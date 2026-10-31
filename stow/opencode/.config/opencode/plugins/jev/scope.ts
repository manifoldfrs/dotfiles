import { Option, Schema } from "effect"
import { callJev, type Json, type ToolCaller } from "./jev.ts"

export type CodeEdit = { readonly file: string; readonly before: string; readonly after: string }

const CLASSES = [
  { id: "requested", description: "Directly carries out what the user asked, including tests or docs the request needs." },
  { id: "scope_creep", description: "Changes behavior, files, or code the request did not ask for, including unrelated refactors or reformatting." },
  { id: "speculative", description: "Adds abstraction, configuration, defaults, or defensive handling the request did not need." },
  { id: "leftover", description: "Debug output, commented-out code, TODO notes, or temporary scaffolding." },
] as const

const FLAGGED: ReadonlySet<string> = new Set(["scope_creep", "speculative", "leftover"])

const CLASSIFY_BATCH = 64

const ITEM_CHARS = 2_000

export const DECISION_REMINDER =
  "Jev decision check: if this edit carries out a choice between approaches (library, design, data model, or fix strategy) that you have not run through jev_decide, run jev_decide now with the options, the evidence, and the user's stated priorities, and report its verdict."

// Argument names of OpenCode's built-in edit, write, and patch tools.
const decodeEdit = Schema.decodeUnknownOption(Schema.Struct({ path: Schema.String, oldString: Schema.String, newString: Schema.String }))

const decodeWrite = Schema.decodeUnknownOption(Schema.Struct({ path: Schema.String, content: Schema.String }))

const decodePatch = Schema.decodeUnknownOption(Schema.Struct({ patchText: Schema.String }))

const Verdict = Schema.Struct({
  id: Schema.String,
  classification: Schema.Literals(CLASSES.map(entry => entry.id)),
  top_probability: Schema.Number.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
  decision: Schema.Literals(["auto", "review"]),
})

const ClassifyResult = Schema.Struct({ results: Schema.Array(Verdict) })

type Verdict = typeof Verdict.Type

const editParsers = new Map<string, (input: Json) => Option.Option<CodeEdit>>([
  ["edit", input => Option.map(decodeEdit(input), args => ({ file: args.path, before: args.oldString, after: args.newString }))],
  ["write", input => Option.map(decodeWrite(input), args => ({ file: args.path, before: "", after: args.content }))],
  ["patch", input => Option.map(decodePatch(input), args => ({ file: "patch", before: "", after: args.patchText }))],
])

export function editOf(tool: string, input: Json) {
  const parse = editParsers.get(tool)

  return parse ? Option.getOrUndefined(parse(input)) : undefined
}

function itemText(edit: CodeEdit) {
  const before = edit.before ? `--- before\n${edit.before}\n` : ""

  return `${edit.file}\n${before}+++ after\n${edit.after}`.slice(0, ITEM_CHARS)
}

async function classify(tools: ToolCaller, prompts: readonly string[], batch: readonly CodeEdit[], offset: number) {
  const ids = batch.map((_, index) => String(offset + index))

  const { results } = await callJev(tools, "jev_classify", {
    purpose: "Judge whether each edit a coding agent made is what the user's request called for.",
    context: { request: prompts.join("\n---\n") },
    classes: CLASSES.map(entry => ({ id: entry.id, description: entry.description })),
    items: batch.map((edit, index) => ({ id: String(offset + index), text: itemText(edit) })),
  }, ClassifyResult)

  const returned = new Set(results.map(verdict => verdict.id))

  if (results.length !== batch.length || ids.some(id => !returned.has(id))) throw new Error("Jev returned incomplete audit results")

  return results
}

function line(edits: readonly CodeEdit[], verdict: Verdict) {
  const edit = edits[Number(verdict.id)]
  const beforeLines = new Set(edit?.before.split("\n").map(text => text.trim()))
  const changed = edit?.after.split("\n").find(text => text.trim() && !beforeLines.has(text.trim())) ?? ""

  return `- ${edit?.file} (${verdict.classification}, p=${verdict.top_probability}): ${changed.trim().slice(0, 80)}`
}

export async function reviewScope(tools: ToolCaller, prompts: readonly string[], edits: readonly CodeEdit[]) {
  const verdicts: Verdict[] = []

  for (let offset = 0; offset < edits.length; offset += CLASSIFY_BATCH) {
    verdicts.push(...(await classify(tools, prompts, edits.slice(offset, offset + CLASSIFY_BATCH), offset)))
  }

  const flagged = verdicts.filter(verdict => FLAGGED.has(verdict.classification))
  const confident = flagged.filter(verdict => verdict.decision === "auto")

  if (!confident.length) return undefined

  const unsure = flagged.filter(verdict => verdict.decision !== "auto")

  return [
    "Jev classified edits from this turn as outside the request:",
    ...confident.map(verdict => line(edits, verdict)),
    ...(unsure.length ? ["Less certain:", ...unsure.map(verdict => line(edits, verdict))] : []),
    "For each one, revert it or tell the user why it was needed.",
  ].join("\n")
}
