import type { EngineInterface, McpToolResult } from 'claude-code'

import { parseJson, type CallJev, type Json } from './jev-shared.ts'

export function mcpJson(result: McpToolResult): Json {
  const text = result.content.find(block => block.type === 'text')?.text

  if (result.isError) throw new Error(text ?? 'MCP call failed')

  if (result.structuredContent !== undefined) return parseJson(JSON.stringify(result.structuredContent))

  if (text === undefined) throw new Error('MCP call returned no text')

  return parseJson(text)
}

export function jevCaller($: EngineInterface): CallJev {
  return async (tool, args) => {
    const result = await $.mcp.call('jev', tool, args)
    const text = result.content.find(block => block.type === 'text')?.text

    if (result.isError || text === undefined) throw new Error(`${tool} failed`)

    return parseJson(text)
  }
}

export function errorResult(text: string) {
  return { isError: true as const, result: text, text }
}
