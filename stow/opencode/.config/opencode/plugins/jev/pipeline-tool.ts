import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { callJev, callTool, mcpToolName, type CallIdentity, type Context } from "./jev.ts"
import {
  CLASSIFY_BATCH,
  JEV_TEXT_LIMIT,
  RERANK_BATCH,
  chunks,
  fillArgs,
  listAt,
  mapLimit,
  textOf,
  toItem,
  type Classify,
  type Item,
  type McpStep,
  type PipelineInput,
  type Rerank,
} from "./pipeline.ts"

export const PIPELINE_TOOL = "jev_pipeline"
// Matches Pi's codemode demo: four concurrent per-item fetches keep MCP servers from rate limiting.
const ENRICH_CONCURRENCY = 4

const mcpStep = {
  server: { type: "string", description: "MCP server name as configured under mcp.servers, e.g. \"hey\"" },
  tool: { type: "string", description: "Tool name on that server, as the server names it" },
  args: { type: "object", description: "Tool arguments" },
}

const pathList = { type: "array", items: { type: "string" }, minItems: 1 }

export const PIPELINE_INPUT = {
  type: "object",
  additionalProperties: false,
  required: ["source", "fields", "judge", "limit"],
  properties: {
    source: {
      type: "object",
      required: ["server", "tool"],
      properties: {
        ...mcpStep,
        items: { type: "string", description: "Dot path to the item array in the JSON result; omit when the result is the array" },
      },
    },
    fields: {
      type: "object",
      required: ["text"],
      properties: {
        id: { type: "string", description: "Dot path to each item id" },
        title: { type: "string", description: "Dot path to a short label shown in the reply" },
        text: { ...pathList, description: "Dot paths whose values make up the text Jev judges" },
      },
    },
    enrich: {
      type: "object",
      description: "Optional per-item MCP call whose results are appended to the item text. A string arg that is exactly \"{{path}}\" takes the item value at that path.",
      required: ["server", "tool", "text"],
      properties: {
        ...mcpStep,
        items: { type: "string", description: "Dot path to an array in the per-item result, e.g. \"comments\"" },
        text: { ...pathList, description: "Dot paths within each result (or each array entry) to append" },
      },
    },
    judge: {
      type: "object",
      required: ["kind"],
      description:
        "kind \"classify\": classes (2+, strong descriptions), optional purpose, context, auto_accept, minimum_margin. kind \"rerank\": query, optional top_k.",
      properties: {
        kind: { enum: ["classify", "rerank"] },
        classes: {
          type: "array",
          items: { type: "object", required: ["description"], properties: { id: { type: "string" }, description: { type: "string" } } },
        },
        purpose: { type: "string" },
        context: {},
        auto_accept: { type: "number" },
        minimum_margin: { type: "number" },
        query: { type: "string" },
        top_k: { type: "integer", minimum: 1 },
      },
    },
    limit: { type: "integer", minimum: 1, maximum: 100, description: "How many items to list per class (classify) or in total (rerank)" },
  },
} as const

export const PIPELINE_DESCRIPTION = [
  "Fetch a list of items from one MCP tool, optionally enrich each item with a second MCP call, and judge every item with TypeSafe Jev (classify or rerank).",
  "The fetched data never enters your context: the reply holds counts and the top items only, and every item with its verdict is saved to results_file for read or jq.",
  "Use it instead of reading many records and pasting them into jev_classify or jev_rerank yourself.",
].join(" ")

type Verdict = { classification: string; top_probability: number; decision: string }

function callStep(ctx: Context, identity: CallIdentity, step: McpStep, args: unknown) {
  return callTool(ctx, mcpToolName(step.server, step.tool), args, identity)
}

async function enrich(ctx: Context, identity: CallIdentity, input: PipelineInput, raws: unknown[], items: Item[]) {
  const step = input.enrich
  if (!step) return items

  return mapLimit(items, ENRICH_CONCURRENCY, async item => {
    const raw = raws[Number(item.key)]
    const result = await callStep(ctx, identity, step, fillArgs(step.args, raw))
    const entries = step.items ? listAt(result, step.items) : [result]
    const extra = entries.map(entry => textOf(entry, step.text)).filter(Boolean)
    return { ...item, text: [item.text, ...extra].join("\n") }
  })
}

function jevItems(items: Item[]) {
  return items.map(item => ({ id: item.key, text: item.text.slice(0, JEV_TEXT_LIMIT) }))
}

async function classify(ctx: Context, identity: CallIdentity, judge: Classify, items: Item[], limit: number) {
  const verdicts = new Map<string, Verdict>()
  for (const batch of chunks(items, CLASSIFY_BATCH)) {
    const { kind: _, ...options } = judge
    const result = (await callJev(ctx, "jev_classify", { ...options, items: jevItems(batch) }, identity)) as {
      results?: (Verdict & { id: string })[]
    }
    for (const verdict of result.results ?? []) verdicts.set(verdict.id, verdict)
  }

  const judged = items.map(item => ({ ...item, verdict: verdicts.get(item.key) }))
  const byClass: Record<string, { count: number; review: number; top: string[] }> = {}
  const ranked = [...judged].sort((a, b) => (b.verdict?.top_probability ?? 0) - (a.verdict?.top_probability ?? 0))
  for (const item of ranked) {
    const name = item.verdict?.classification ?? "unjudged"
    const group = (byClass[name] ??= { count: 0, review: 0, top: [] })
    group.count++
    if (item.verdict?.decision === "review") group.review++
    if (group.top.length < limit) {
      const review = item.verdict?.decision === "review" ? ", review" : ""
      group.top.push(`${item.id} ${item.title} (p=${item.verdict?.top_probability ?? "?"}${review})`)
    }
  }

  return { judged, summary: { by_class: byClass } }
}

async function rerank(ctx: Context, identity: CallIdentity, judge: Rerank, items: Item[], limit: number) {
  const scores = new Map<string, number>()
  for (const batch of chunks(items, RERANK_BATCH)) {
    const result = (await callJev(ctx, "jev_rerank", { query: judge.query, candidates: jevItems(batch) }, identity)) as {
      ranked?: { id: string; relevance: number }[]
    }
    for (const entry of result.ranked ?? []) scores.set(entry.id, entry.relevance)
  }

  // Jev scores each candidate independently, so scores from separate batches compare directly.
  const judged = items
    .map(item => ({ ...item, verdict: { relevance: scores.get(item.key) } }))
    .sort((a, b) => (b.verdict.relevance ?? 0) - (a.verdict.relevance ?? 0))
  const top = judged.slice(0, Math.min(limit, judge.top_k ?? limit))
  return { judged, summary: { top: top.map(item => `${item.id} ${item.title} (relevance=${item.verdict.relevance ?? "?"})`) } }
}

function judgeProblem(judge: Classify | Rerank) {
  if (judge.kind === "classify" && !(judge.classes?.length >= 2)) return "judge.classes needs at least two classes"
  if (judge.kind === "rerank" && !judge.query) return "judge.query is required for rerank"
  return undefined
}

export async function runPipeline(ctx: Context, identity: CallIdentity, input: PipelineInput) {
  const problem = judgeProblem(input.judge)
  if (problem) throw new Error(problem)

  const raws = listAt(await callStep(ctx, identity, input.source, input.source.args), input.source.items)
  const items = await enrich(ctx, identity, input, raws, raws.map((raw, index) => toItem(raw, index, input.fields)))
  const judged = input.judge.kind === "classify"
    ? await classify(ctx, identity, input.judge, items, input.limit)
    : await rerank(ctx, identity, input.judge, items, input.limit)

  const path = join(tmpdir(), `jev-pipeline-${identity.sessionID}-${Date.now()}.json`)
  await writeFile(path, JSON.stringify(judged.judged.map(({ key: _, ...item }) => item), null, 2))
  return { total: items.length, results_file: path, ...judged.summary }
}
