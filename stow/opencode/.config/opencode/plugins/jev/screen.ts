import { Option, Schema } from "effect"
import { resultText, type ToolResult } from "./jev.ts"
import { isSentLink as isSharedSentLink, screenText, withoutSecrets, type CallJev, type Json } from "./shared.ts"

const SCREENED_TOOLS = /^(webfetch|websearch|exa_web_fetch_exa|exa_web_search_exa|exa_web_search_advanced_exa|ref_ref_read_url|ref_ref_search_documentation)$/

const decodeExecuteInput = Schema.decodeUnknownOption(Schema.Struct({ code: Schema.String }))

// Code Mode's fetch() is plain HTTP rather than a tool call, so the execute result is the only place to screen it.
export function isScreened(tool: string, input: Json) {
  if (SCREENED_TOOLS.test(tool)) return true

  if (tool !== "execute") return false

  const execute = decodeExecuteInput(input)

  return Option.isSome(execute) && /\bfetch\s*\(/.test(execute.value.code)
}

// Code can fetch somewhere other than the links it mentions.
export function isSentLink(tool: string, input: Json, prompts: readonly string[]) {
  return tool !== "execute" && isSharedSentLink(tool, JSON.stringify(input), prompts)
}

// Code Mode reads output and the model reads content, so a replacement must set both.
function replaced(text: string): ToolResult {
  return { content: [{ type: "text", text }], output: text }
}

export function withWarning(result: ToolResult, warning: string): ToolResult {
  const content = result.content === undefined ? [] : Array.isArray(result.content) ? result.content : [{ type: "text" as const, text: String(result.content) }]

  return { ...result, content: [...content, { type: "text", text: warning }] }
}

type ScreenOptions = { readonly sentByUser?: boolean; readonly secret?: boolean }

// Web pages are screened whole, since hiding a line would hide it from the screen but not the model; only a call that names a secret file is filtered.
export async function screenResult(callJev: CallJev, log: (note: string) => Promise<void>, result: ToolResult, options: ScreenOptions = {}): Promise<ToolResult> {
  const text = resultText(result)
  const outcome = await screenText(callJev, log, options.secret ? withoutSecrets(text) : text, options.sentByUser === true)

  if (outcome.kind === "withhold") return replaced(outcome.text)

  return outcome.kind === "warn" ? withWarning(result, outcome.warning) : result
}
