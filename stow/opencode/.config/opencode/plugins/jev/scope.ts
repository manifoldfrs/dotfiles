import { callJev, list, type CallIdentity, type Context } from "./jev.ts"

export type CodeEdit = { file: string; before: string; after: string }

const CLASSES = [
  { id: "requested", description: "Directly carries out what the user asked, including tests or docs the request needs." },
  { id: "scope_creep", description: "Changes behavior, files, or code the request did not ask for, including unrelated refactors or reformatting." },
  { id: "speculative", description: "Adds abstraction, configuration, defaults, or defensive handling the request did not need." },
  { id: "leftover", description: "Debug output, commented-out code, TODO notes, or temporary scaffolding." },
]
const FLAGGED = new Set(["scope_creep", "speculative", "leftover"])
const CLASSIFY_BATCH = 64
const ITEM_CHARS = 2_000

export const DECISION_REMINDER =
  "Jev decision check: if this edit carries out a choice between approaches (library, design, data model, or fix strategy) that you have not run through jev_decide, run jev_decide now with the options, the evidence, and the user's stated priorities, and report its verdict."

type Verdict = { id: string; classification: string; top_probability: number; decision: string }

function field(input: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    if (typeof input[name] === "string") return input[name] as string
  }
  return ""
}

export function editOf(tool: string, input: unknown): CodeEdit | undefined {
  if (!input || typeof input !== "object") return undefined
  const args = input as Record<string, unknown>
  const file = field(args, "path", "filePath", "file_path")
  if (tool === "edit") return { file, before: field(args, "oldString", "old_string"), after: field(args, "newString", "new_string") }
  if (tool === "write") return { file, before: "", after: field(args, "content") }
  if (tool === "patch") return { file: file || "patch", before: "", after: field(args, "patch", "patchText", "input") || JSON.stringify(args) }
  return undefined
}

function itemText(edit: CodeEdit) {
  const before = edit.before ? `--- before\n${edit.before}\n` : ""
  return `${edit.file}\n${before}+++ after\n${edit.after}`.slice(0, ITEM_CHARS)
}

async function classify(ctx: Context, identity: CallIdentity, prompts: string[], batch: CodeEdit[], offset: number) {
  const results = list(await callJev(ctx, "jev_classify", {
    purpose: "Judge whether each edit a coding agent made is what the user's request called for.",
    context: { request: prompts.join("\n---\n") },
    classes: CLASSES,
    items: batch.map((edit, index) => ({ id: String(offset + index), text: itemText(edit) })),
  }, identity), "results")
  if (results.length !== batch.length) throw new Error("Jev returned incomplete audit results")

  const expected = new Set(batch.map((_, index) => String(offset + index)))
  return results.map((item): Verdict => {
    const { id, classification, top_probability, decision } = item
    if (typeof id !== "string" || !expected.delete(id)
      || typeof classification !== "string" || !CLASSES.some(entry => entry.id === classification)
      || typeof top_probability !== "number" || !Number.isFinite(top_probability) || top_probability < 0 || top_probability > 1
      || (decision !== "auto" && decision !== "review")) {
      throw new Error("Jev returned an invalid audit verdict")
    }
    return { id, classification, top_probability, decision }
  })
}

function line(edits: CodeEdit[], verdict: Verdict) {
  const edit = edits[Number(verdict.id)]
  const beforeLines = new Set(edit?.before.split("\n").map(text => text.trim()))
  const changed = edit?.after.split("\n").find(text => text.trim() && !beforeLines.has(text.trim())) ?? ""
  return `- ${edit?.file} (${verdict.classification}, p=${verdict.top_probability}): ${changed.trim().slice(0, 80)}`
}

export async function reviewScope(ctx: Context, identity: CallIdentity, prompts: string[], edits: CodeEdit[]) {
  const verdicts: Verdict[] = []
  for (let offset = 0; offset < edits.length; offset += CLASSIFY_BATCH) {
    verdicts.push(...(await classify(ctx, identity, prompts, edits.slice(offset, offset + CLASSIFY_BATCH), offset)))
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
