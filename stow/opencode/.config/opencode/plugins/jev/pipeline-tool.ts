import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Schema } from "effect"
import { callJev, mcpToolName, type Json, type ToolCaller } from "./jev.ts"
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
  PipelineInput,
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


const ClassifyResult = Schema.Struct({
  results: Schema.Array(Schema.Struct({ id: Schema.String, classification: Schema.String, top_probability: Schema.Number, decision: Schema.String })),
})

const RerankResult = Schema.Struct({ ranked: Schema.Array(Schema.Struct({ id: Schema.String, relevance: Schema.Number })) })

type Verdict = Omit<(typeof ClassifyResult.Type)["results"][number], "id">

type ClassGroup = { count: number; review: number; top: string[] }

// A JSON round trip drops absent optional fields, which Json cannot hold and Jev rejects as unknown arguments.
const toJson = Schema.decodeUnknownSync(Schema.Json)

function classifyArgs(options: Omit<Classify, "kind">, items: readonly Item[]): Json {
  return toJson(JSON.parse(JSON.stringify({ ...options, items: jevItems(items) })))
}

function callStep(tools: ToolCaller, step: McpStep, args: Json) {
  return tools.call(mcpToolName(step.server, step.tool), args, Schema.Json)
}

async function enrich(tools: ToolCaller, input: PipelineInput, raws: readonly Json[], items: readonly Item[]) {
  const step = input.enrich

  if (!step) return items

  return mapLimit(items, ENRICH_CONCURRENCY, async item => {
    const raw = raws[Number(item.key)] ?? null
    const result = await callStep(tools, step, fillArgs(step.args ?? {}, raw) ?? {})
    const entries = step.items ? listAt(result, step.items) : [result]

    const extra = entries.flatMap(entry => {
      const text = textOf(entry, step.text)

      return text ? [text] : []
    })

    return { ...item, text: [item.text, ...extra].join("\n") }
  })
}

function jevItems(items: readonly Item[]) {
  return items.map(item => ({ id: item.key, text: item.text.slice(0, JEV_TEXT_LIMIT) }))
}

function groupByClass(judged: readonly (Item & { verdict: Verdict | undefined })[], limit: number) {
  const byClass: Record<string, ClassGroup> = {}
  const ranked = [...judged].sort((a, b) => (b.verdict?.top_probability ?? 0) - (a.verdict?.top_probability ?? 0))

  for (const item of ranked) {
    const name = item.verdict?.classification ?? "unjudged"
    const group = (byClass[name] ??= { count: 0, review: 0, top: [] })
    const review = item.verdict?.decision === "review"

    group.count++

    if (review) group.review++

    if (group.top.length < limit) group.top.push(`${item.id} ${item.title} (p=${item.verdict?.top_probability ?? "?"}${review ? ", review" : ""})`)
  }

  return byClass
}

async function classify(tools: ToolCaller, judge: Classify, items: readonly Item[], limit: number) {
  const verdicts = new Map<string, Verdict>()
  const { kind: _, ...options } = judge

  for (const batch of chunks(items, CLASSIFY_BATCH)) {
    const { results } = await callJev(tools, "jev_classify", classifyArgs(options, batch), ClassifyResult)

    for (const { id, ...verdict } of results) verdicts.set(id, verdict)
  }

  const judged = items.map(item => ({ ...item, verdict: verdicts.get(item.key) }))

  return { judged, summary: { by_class: groupByClass(judged, limit) } }
}

async function rerank(tools: ToolCaller, judge: Rerank, items: readonly Item[], limit: number) {
  const scores = new Map<string, number>()

  for (const batch of chunks(items, RERANK_BATCH)) {
    const { ranked } = await callJev(tools, "jev_rerank", { query: judge.query, candidates: jevItems(batch) }, RerankResult)

    for (const { id, relevance } of ranked) scores.set(id, relevance)
  }

  // Jev scores each candidate independently, so scores from separate batches compare directly.
  const judged = items
    .map(item => ({ ...item, verdict: { relevance: scores.get(item.key) } }))
    .sort((a, b) => (b.verdict.relevance ?? 0) - (a.verdict.relevance ?? 0))

  const top = judged.slice(0, Math.min(limit, judge.top_k ?? limit))

  return { judged, summary: { top: top.map(item => `${item.id} ${item.title} (relevance=${item.verdict.relevance ?? "?"})`) } }
}

export const decodePipelineInput = Schema.decodeUnknownSync(PipelineInput)

export async function runPipeline(tools: ToolCaller, sessionID: string, input: PipelineInput) {
  const raws = listAt(await callStep(tools, input.source, input.source.args ?? {}), input.source.items)
  const items = await enrich(tools, input, raws, raws.map((raw, index) => toItem(raw, index, input.fields)))

  const judged = input.judge.kind === "classify"
    ? await classify(tools, input.judge, items, input.limit)
    : await rerank(tools, input.judge, items, input.limit)

  const path = join(tmpdir(), `jev-pipeline-${sessionID}-${Date.now()}.json`)

  await writeFile(path, JSON.stringify(judged.judged.map(({ key: _, ...item }) => item), null, 2))

  return { total: items.length, results_file: path, ...judged.summary }
}
