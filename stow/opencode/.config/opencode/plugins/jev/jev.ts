import { appendFile, mkdir } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import type { Plugin } from "@opencode/plugin"
import { Option, Schema } from "effect"

export type Context = Plugin.Context

type ToolInfo = Awaited<ReturnType<Context["tool"]["list"]>>[number]

export type ToolResult = Awaited<ReturnType<ToolInfo["execute"]>>

type ToolCallContext = Parameters<ToolInfo["execute"]>[1]

type ToolInput = Parameters<ToolInfo["execute"]>[0]

export type CallIdentity = Pick<ToolCallContext, "sessionID" | "agent" | "messageID" | "id">

export type Json = Schema.Json

/** Calls a registered tool by name and decodes its result; the checks depend on this port rather than the whole plugin context. */
export interface ToolCaller {
  readonly call: <T>(name: string, args: Json, schema: Schema.ConstraintDecoder<T>) => Promise<T>
}

/** Asks the session's own model for text without adding to the transcript. */
export type Generate = (prompt: string) => Promise<string>

export const JEV_SERVER = "jev"

const TOOL_TIMEOUT_MS = 120_000

const decodeString = Schema.decodeUnknownOption(Schema.String)

const decodeJsonText = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Json))

/** Decodes a hook's tool input as JSON, serializing first so absent optional fields drop out instead of failing the decode. */
export function decodeToolInput(input: ToolInput) {
  return decodeJsonText(JSON.stringify(input))
}

export function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : String(cause)
}

// The background service discards plugin stderr and plugins get no logger, so failures go to a file beside opencode.log.
export function failureLogPath() {
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "opencode", "log", "jev-plugin.log")
}

// Records the check and the error's name and message only, never tool payloads or arguments.
export async function logFailure(what: string, cause: unknown) {
  const detail = cause instanceof Error ? `${cause.name}: ${cause.message}` : errorMessage(cause)
  const path = failureLogPath()

  try {
    await mkdir(dirname(path), { recursive: true })
    await appendFile(path, `${new Date().toISOString()} ${what} failed: ${detail}\n`)
  } catch {
    // Logging is best effort: the caller already reports the failure to the agent, and a log error must not replace it.
  }
}

// MCP tools are named <server>_<tool> with every other character replaced by "_".
export function mcpToolName(server: string, tool: string) {
  const normalize = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, "_")

  return `${normalize(server)}_${normalize(tool)}`
}

export function isJevTool(tool: string) {
  return tool.startsWith(`${JEV_SERVER}_`)
}

function contentText(content: ToolResult["content"]) {
  if (content === undefined) return ""

  if (!Array.isArray(content)) return String(content)

  return content.flatMap(part => (part.type === "text" ? [part.text] : [])).join("\n")
}

function outputText(output: ToolResult["output"]) {
  if (output === undefined) return ""

  return Option.getOrElse(decodeString(output), () => JSON.stringify(output))
}

export function resultText(result: ToolResult) {
  return [...new Set([contentText(result.content), outputText(result.output)].filter(part => part.trim()))].join("\n")
}

// Tools answer with JSON text in output or content, or with structured output that may hold undefined fields;
// serializing the structured form gives both the same JSON boundary.
function decodeResult<T>(result: ToolResult, schema: Schema.ConstraintDecoder<T>) {
  const text = result.output === undefined
    ? contentText(result.content)
    : Option.getOrElse(decodeString(result.output), () => JSON.stringify(result.output))

  return Schema.decodeUnknownPromise(Schema.fromJsonString(schema))(text)
}

export function toolCaller(ctx: Context, identity: CallIdentity): ToolCaller {
  return {
    call: async (name, args, schema) => {
      const tool = (await ctx.tool.list()).find(entry => entry.id === name)

      if (!tool) throw new Error(`Tool ${name} is not available`)

      const context: ToolCallContext = { ...identity, signal: AbortSignal.timeout(TOOL_TIMEOUT_MS), progress: async () => {} }

      return decodeResult(await tool.execute(args, context), schema)
    },
  }
}

export function callJev<T>(tools: ToolCaller, tool: string, args: Json, schema: Schema.ConstraintDecoder<T>) {
  return tools.call(mcpToolName(JEV_SERVER, tool), args, schema)
}
