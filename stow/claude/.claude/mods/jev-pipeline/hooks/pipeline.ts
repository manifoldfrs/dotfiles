import type { McpToolResult } from 'claude-code'

import { listOf, numberOf, objectOf, parseJson, textOf as stringOf, type Json, type JsonObject } from './json.ts'

export type McpStep = { server: string; tool: string; args: JsonObject | undefined; items: string | undefined }

export type Fields = { id: string | undefined; title: string | undefined; text: string[] }

// Everything but kind passes straight through to jev_classify.
export type Classify = { kind: 'classify'; classes: readonly Json[]; options: JsonObject }

export type Rerank = { kind: 'rerank'; query: string; top_k: number | undefined }

export type PipelineInput = {
  source: McpStep
  fields: Fields
  enrich: (McpStep & { text: string[] }) | undefined
  judge: Classify | Rerank
  limit: number
}

export type Item = { key: string; id: string; title: string; text: string }

// Jev truncates item text at 2,000 characters; trimming here keeps request payloads small.
export const JEV_TEXT_LIMIT = 2_000
export const CLASSIFY_BATCH = 64
export const RERANK_BATCH = 250

export function mcpJson(result: McpToolResult): Json {
  const text = result.content.find(block => block.type === 'text')?.text

  if (result.isError) throw new Error(text ?? 'MCP call failed')

  if (result.structuredContent !== undefined) return parseJson(JSON.stringify(result.structuredContent))

  if (text === undefined) throw new Error('MCP call returned no text')

  return JSON.parse(text)
}

function childOf(node: Json | undefined, key: string) {
  return Array.isArray(node) ? listOf(node)[Number(key)] : objectOf(node)?.[key]
}

export function at(value: Json | undefined, path: string | undefined): Json | undefined {
  if (!path) return value

  return path.split('.').reduce(childOf, value)
}

export function listAt(value: Json, path: string | undefined): readonly Json[] {
  const list = at(value, path)

  if (!Array.isArray(list)) throw new Error(`No array at "${path ?? ''}" in the MCP result`)

  return listOf(list)
}

function asText(value: Json | undefined) {
  if (value === undefined || value === null) return ''

  return stringOf(value) ?? JSON.stringify(value)
}

export function textOf(value: Json, paths: string[]) {
  return paths.flatMap(path => asText(at(value, path)) || []).join('\n')
}

// A string that is exactly "{{path}}" becomes the item's value at that path, keeping its type.
export function fillArgs(args: Json | undefined, item: Json | undefined): Json | undefined {
  const text = stringOf(args)

  if (text !== undefined) {
    const match = /^\{\{(.+)\}\}$/.exec(text)

    return match ? at(item, match[1]) : text
  }

  if (Array.isArray(args)) return listOf(args).map(arg => fillArgs(arg, item) ?? null)

  const object = objectOf(args)

  if (object) return Object.fromEntries(Object.entries(object).flatMap(([key, arg]) => {
    const filled = fillArgs(arg, item)

    return filled === undefined ? [] : [[key, filled]]
  }))

  return args
}

function stepOf(value: Json | undefined, label: string): McpStep {
  const step = objectOf(value)
  const server = stringOf(step?.server)
  const tool = stringOf(step?.tool)

  if (server === undefined || tool === undefined) throw new Error(`${label} needs a server and a tool`)

  return { server, tool, args: objectOf(step?.args), items: stringOf(step?.items) }
}

function textList(value: Json | undefined) {
  return listOf(value).flatMap(entry => stringOf(entry) ?? [])
}

function judgeOf(value: Json | undefined): Classify | Rerank {
  const judge = objectOf(value)

  if (!judge || (judge.kind !== 'classify' && judge.kind !== 'rerank')) throw new Error('judge.kind must be classify or rerank')

  if (judge.kind === 'rerank') return { kind: 'rerank', query: stringOf(judge.query) ?? '', top_k: numberOf(judge.top_k) }

  const { kind: _, ...options } = judge

  return { kind: 'classify', classes: listOf(judge.classes), options }
}

/** Reads a tool call's arguments into the pipeline's input, and throws a message the model can act on when they are unusable. */
export function parsePipelineInput(value: Json): PipelineInput {
  const input = objectOf(value)
  const fields = objectOf(input?.fields)
  const limit = numberOf(input?.limit)

  if (!fields || limit === undefined) throw new Error('fields and limit are required')

  return {
    source: stepOf(input?.source, 'source'),
    fields: { id: stringOf(fields.id), title: stringOf(fields.title), text: textList(fields.text) },
    enrich: input?.enrich === undefined ? undefined : { ...stepOf(input.enrich, 'enrich'), text: textList(objectOf(input.enrich)?.text) },
    judge: judgeOf(input?.judge),
    limit,
  }
}

export function toItem(raw: Json, index: number, fields: Fields): Item {
  const text = textOf(raw, fields.text)
  const id = fields.id ? asText(at(raw, fields.id)) : ''
  const title = fields.title ? asText(at(raw, fields.title)) : ''

  return { key: String(index), id: id || String(index), title: title || text.slice(0, 100), text }
}

export function chunks<T>(list: T[], size: number) {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, (index + 1) * size))
}

export async function mapLimit<T, R>(list: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(list.length)
  let next = 0

  async function worker() {
    while (next < list.length) {
      const index = next++

      // SAFETY: index is below list.length, so this slot holds a T.
      results[index] = await fn(list[index] as T)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))

  return results
}
