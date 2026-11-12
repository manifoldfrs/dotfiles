export const TOOL_NAME = 'codemode'
export const FULL_TOOL_NAME = 'mcp__codemode__codemode'
export const LAUNCHER = 'runner/launch.sh'
// Process spawns cap at ten minutes, so scripts without timeout_ms stop there.
export const MAX_SCRIPT_MS = 600_000
const OPTIONS_LINE = /^\s*\/\/\s*@options:\s*(.*)$/

export const TOOL_DESCRIPTION = `Run JavaScript that calls other tools. The input is raw JavaScript (not JSON, no code fence), run as an async function body in a sandboxed Node process with no require, file system, network, or timers: top-level \`await\` and \`return\` work.
- \`await tools.<name>({ ...args })\` calls any tool you can call, built-in or MCP: \`tools.Bash({ command })\`, \`tools.Read({ file_path })\`, \`tools.mcp__<server>__<tool>({ ... })\`. Characters that are not valid in a JavaScript identifier become \`_\`. Each call runs through the same hooks and permission checks as your own calls, resolves to the tool's text output (MCP JSON results arrive as a JSON string; use JSON.parse), and rejects with an Error when the tool fails or is refused. Calls still running when the script ends are abandoned.
- Scripts cannot see input schemas. Before scripting a deferred MCP tool whose parameters you have not loaded, load it with ToolSearch (\`select:<name>\`).
- Optional first line: \`// @options: {"max_output_tokens": 10000, "timeout_ms": 60000}\`.

Globals:
- \`text(value)\`, \`console.log(...)\`, and top-level \`return\` add output; \`exit()\` ends the script. With several text items, each starts with a \`==> text N/M <==\` line, and \`console\` lines follow in one \`<console_output>\` block.
- \`store(key, value)\` and \`load(key)\` keep JSON values across codemode calls in this session.
- \`ALL_TOOLS\`, \`await searchTools(query, { limit?, namespace? })\`, \`await describeTool(name)\`, \`await describeNamespace(name)\`: find tools by name and description.

Use codemode to batch independent tool calls (Promise.all or Promise.allSettled), page through results, or filter large output before it reaches you. For a single call, call the tool directly.`

export const inputSchema = {
  type: 'object',
  properties: { code: { type: 'string', description: 'Raw JavaScript source.' } },
  required: ['code'],
  additionalProperties: false,
}

export type CatalogEntry = { name: string; description: string }

export type RunnerMessage =
  | { t: 'ready'; dir: string }
  | { t: 'call'; id: number; tool: string; args: Record<string, unknown> }
  | { t: 'done'; ok: boolean; text: string; store: Record<string, unknown>; keepDir: boolean }

/** Tools a script may call: every tool but codemode itself, so scripts cannot start scripts. */
export function scriptCatalog(tools: readonly CatalogEntry[]): CatalogEntry[] {
  return tools.filter(tool => tool.name !== FULL_TOOL_NAME).map(tool => ({ name: tool.name, description: tool.description }))
}

/** The script's deadline: its timeout_ms option, capped at what a spawned process may run. */
export function scriptDeadlineMs(code: string): number {
  const match = OPTIONS_LINE.exec(code.split('\n')[0] ?? '')
  if (!match) return MAX_SCRIPT_MS
  try {
    const timeout = (JSON.parse(match[1]) as { timeout_ms?: unknown }).timeout_ms
    // A little slack so the runner reports its own timeout before the child is killed.
    return typeof timeout === 'number' && timeout > 0 ? Math.min(timeout + 2_000, MAX_SCRIPT_MS) : MAX_SCRIPT_MS
  } catch {
    return MAX_SCRIPT_MS
  }
}

/** Splits streamed stdout into complete runner messages, keeping a partial last line for later. */
export function takeMessages(buffer: string): { messages: RunnerMessage[]; rest: string } {
  const lines = buffer.split('\n')
  const rest = lines.pop() ?? ''
  const messages = lines.filter(line => line.trim()).map(line => JSON.parse(line) as RunnerMessage)
  return { messages, rest }
}

type CallOutcome = { deny?: string; isError?: boolean; text?: string; result?: unknown }

/** What the script receives for a nested call: the model-facing text, or the refusal or error. */
export function callAnswer(outcome: CallOutcome): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof outcome.deny === 'string') return { ok: false, error: outcome.deny || 'The call was refused.' }
  const text = typeof outcome.text === 'string' ? outcome.text : JSON.stringify(outcome.result ?? '')
  if (outcome.isError) return { ok: false, error: text || 'The tool failed.' }
  return { ok: true, value: text }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
