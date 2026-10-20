import type { McpToolResult } from 'claude-code'

export type McpStep = { server: string; tool: string; args?: Record<string, unknown> }
export type Fields = { id?: string; title?: string; text: string[] }
export type Classify = {
  kind: 'classify'
  classes: { id?: string; description: string }[]
  purpose?: string
  context?: unknown
  auto_accept?: number
  minimum_margin?: number
}
export type Rerank = { kind: 'rerank'; query: string; top_k?: number }

export type PipelineInput = {
  source: McpStep & { items?: string }
  fields: Fields
  enrich?: McpStep & { items?: string; text: string[] }
  judge: Classify | Rerank
  limit: number
}

export type Item = { key: string; id: string; title: string; text: string }

// Jev truncates item text at 2,000 characters; trimming here keeps request payloads small.
export const JEV_TEXT_LIMIT = 2_000
export const CLASSIFY_BATCH = 64
export const RERANK_BATCH = 250

export function mcpJson(result: McpToolResult): unknown {
  const text = result.content.find(block => block.type === 'text')?.text
  if (result.isError) throw new Error(text ?? 'MCP call failed')
  if (result.structuredContent !== undefined) return result.structuredContent
  if (text === undefined) throw new Error('MCP call returned no text')
  return JSON.parse(text)
}

export function at(value: unknown, path: string | undefined): unknown {
  if (!path) return value
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), value)
}

export function listAt(value: unknown, path: string | undefined): unknown[] {
  const list = at(value, path)
  if (!Array.isArray(list)) throw new Error(`No array at "${path ?? ''}" in the MCP result`)
  return list
}

function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function textOf(value: unknown, paths: string[]) {
  return paths
    .map(path => asText(at(value, path)))
    .filter(Boolean)
    .join('\n')
}

// A string that is exactly "{{path}}" becomes the item's value at that path, keeping its type.
export function fillArgs(args: unknown, item: unknown): unknown {
  if (typeof args === 'string') {
    const match = /^\{\{(.+)\}\}$/.exec(args)
    return match ? at(item, match[1]) : args
  }
  if (Array.isArray(args)) return args.map(arg => fillArgs(arg, item))
  if (args && typeof args === 'object') {
    return Object.fromEntries(Object.entries(args).map(([key, arg]) => [key, fillArgs(arg, item)]))
  }
  return args
}

export function toItem(raw: unknown, index: number, fields: Fields): Item {
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
      results[index] = await fn(list[index] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))
  return results
}
