import type { EngineInterface, Register, ToolCallInput } from 'claude-code'

import { jevCaller } from './mcp.ts'
import { DECISION_REMINDER, MAX_EVIDENCE, RECENT_PROMPTS, isSecretFile, reviewTurn, toolEvidence, type CodeEdit, type Evidence } from './jev-shared.ts'

const EXTRACT_MODEL = 'opus'
const EXTRACT_TIMEOUT_MS = 60_000
const UNCHECKED_TOOLS = /^mcp__jev/

// Module state resets on hot reload; that only loses the edits of a turn in flight.
let prompts: string[] = []
let userPrompts: string[] = []
let edits: CodeEdit[] = []
let evidence: Evidence[] = []
let evidenceCount = 0
let ranTool = false

function editOf(e: ToolCallInput): CodeEdit | undefined {
  if (e.tool === 'Edit') return { file: e.file_path, before: e.old_string, after: e.new_string }

  if (e.tool === 'Write') return { file: e.file_path, before: '', after: e.content }

  return undefined
}

/** The person's recent prompts, leaving out the prompts agents write for subagents. A mod gets one turn.start hook, so screening reads this. */
export function recentUserPrompts() {
  return userPrompts
}

// The call's input is evidence too: answers report which command ran or which file was read.
function argsOf(e: ToolCallInput) {
  const { tool: _tool, tool_use_id: _id, agentId: _agent, requestMeta: _meta, ...input } = e

  return JSON.stringify(input)
}

async function generate($: EngineInterface, prompt: string) {
  const reply = await $.model.complete({ model: EXTRACT_MODEL, prompt, timeoutMs: EXTRACT_TIMEOUT_MS })

  if (!reply.isAnswered) throw new Error(`claim extraction failed: ${reply.reason}`)

  return reply.text
}

export const registerCoding: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (e.text) prompts = [...prompts, e.text].slice(-RECENT_PROMPTS)

    if (e.text && e.agentId === undefined) userPrompts = [...userPrompts, e.text].slice(-RECENT_PROMPTS)

    edits = []

    if (e.agentId === undefined) ranTool = false

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)

    const args = argsOf(e)

    if (e.agentId !== undefined || UNCHECKED_TOOLS.test(e.tool) || result.deny !== undefined || isSecretFile(args)) return result

    const output = result.text ?? ''
    ranTool = true
    evidenceCount += 1
    evidence = [...evidence, toolEvidence(evidenceCount, e.tool, args, result.isError ? `Error: ${output}` : output)].slice(-MAX_EVIDENCE)

    return result
  })

  on('tool.call', { tool: /^(Edit|Write)$/ }, async ($, e, next) => {
    const result = await next(e)
    const edit = editOf(e)

    if (result.deny !== undefined || result.isError || !edit || isSecretFile(edit.file)) return result

    edits.push(edit)

    if (edits.length > 1) return result

    return { ...result, context: [...(result.context ?? []), DECISION_REMINDER] }
  })

  // stop_hook_active means this stop follows our own block, so each turn is checked once.
  on('classic.Stop', async ($, e, next) => {
    if (e.stop_hook_active) return next(e)

    const turn = { prompts, edits, answer: e.last_assistant_message, evidence, ranTool }
    const review = await reviewTurn(jevCaller($), prompt => generate($, prompt), turn)

    for (const note of review.person) $.ui.log(note)

    edits = []
    ranTool = false

    return review.agent ? { block: review.agent } : next(e)
  })
}
