import type { Plugin } from "@opencode/plugin"

export type Context = Plugin.Context
type ToolInfo = Awaited<ReturnType<Context["tool"]["list"]>>[number]
export type ToolResult = Awaited<ReturnType<ToolInfo["execute"]>>
export type ToolCallContext = Parameters<ToolInfo["execute"]>[1]

export type CallIdentity = {
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly id: string
}

export const JEV_SERVER = "jev"

// MCP tools are named <server>_<tool> with every other character replaced by "_".
export function mcpToolName(server: string, tool: string) {
  const normalize = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, "_")
  return `${normalize(server)}_${normalize(tool)}`
}

export function isJevTool(tool: string) {
  return tool.startsWith(`${JEV_SERVER}_`)
}

export function resultText(result: ToolResult | undefined) {
  if (!result) return ""
  const content = typeof result.content === "string"
    ? result.content
    : (result.content ?? []).map(part => ("text" in part && typeof part.text === "string" ? part.text : "")).filter(Boolean).join("\n")
  const output = result.output === undefined ? "" : typeof result.output === "string" ? result.output : JSON.stringify(result.output)
  return [...new Set([content, output].filter(part => part.trim()))].join("\n")
}

function resultJson(result: ToolResult): unknown {
  if (result.output !== undefined && typeof result.output !== "string") return result.output
  const text = typeof result.output === "string" ? result.output : resultText(result)
  return JSON.parse(text)
}

export async function callTool(ctx: Context, name: string, args: unknown, identity: CallIdentity, signal?: AbortSignal) {
  const tool = (await ctx.tool.list()).find(entry => entry.id === name)
  if (!tool) throw new Error(`Tool ${name} is not available`)
  // Tool IDs and session IDs are branded schema strings; hooks and session messages hand us the same values unbranded.
  const context = {
    ...identity,
    signal: signal ?? AbortSignal.timeout(120_000),
    progress: async () => {},
  } as unknown as ToolCallContext
  // A JSON round trip drops undefined optional fields, which Jev rejects as unknown arguments.
  return resultJson(await tool.execute(JSON.parse(JSON.stringify(args ?? {})), context))
}

export function callJev(ctx: Context, tool: string, args: unknown, identity: CallIdentity) {
  return callTool(ctx, mcpToolName(JEV_SERVER, tool), args, identity)
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Jev returned an invalid result")
  return value as Record<string, unknown>
}

export function list(value: unknown, field: string): Record<string, unknown>[] {
  const entries = record(value)[field]
  if (!Array.isArray(entries)) throw new Error(`Jev returned no ${field}`)
  return entries.map(record)
}
