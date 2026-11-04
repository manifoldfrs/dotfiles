import type { EngineInterface, Register, ToolCallInput } from 'claude-code'

import { MIN_ANSWER_CHARS, hasJson, reviewAnswer, type Evidence } from './answer.ts'
import { listOf, numberOf, objectOf, parseJson, textOf, type Json, type JsonObject } from './json.ts'

const CLASSES = [
  { id: 'requested', description: 'Directly carries out what the user asked, including tests or docs the request needs.' },
  { id: 'scope_creep', description: 'Changes behavior, files, or code the request did not ask for, including unrelated refactors or reformatting.' },
  { id: 'speculative', description: 'Adds abstraction, configuration, defaults, or defensive handling the request did not need.' },
  { id: 'leftover', description: 'Debug output, commented-out code, TODO notes, or temporary scaffolding.' },
]

const FLAGGED = new Set(['scope_creep', 'speculative', 'leftover'])
const CLASSIFY_BATCH = 64
const ITEM_CHARS = 2_000
const RECENT_PROMPTS = 3
const MAX_EVIDENCE = 80
const INPUT_CHARS = 500
const EXTRACT_MODEL = 'opus'
const EXTRACT_TIMEOUT_MS = 60_000
const UNCHECKED_TOOLS = /^mcp__jev/

const DECISION_REMINDER =
  'Jev decision check: if this edit carries out a choice between approaches (library, design, data model, or fix strategy) that you have not run through jev_decide, run jev_decide now with the options, the evidence, and the user\'s stated priorities, and report its verdict.'

type CodeEdit = { file: string; before: string; after: string }

type Verdict = { id: string; classification: string; top_probability: number; decision: string }

// Module state resets on hot reload; that only loses the edits of a turn in flight.
let prompts: string[] = []
let edits: CodeEdit[] = []
let evidence: Evidence[] = []
let evidenceCount = 0
let ranTool = false

function editOf(e: ToolCallInput): CodeEdit | undefined {
  if (e.tool === 'Edit') return { file: e.file_path, before: e.old_string, after: e.new_string }

  if (e.tool === 'Write') return { file: e.file_path, before: '', after: e.content }

  return undefined
}

function parseVerdict(item: Json, expected: Set<string>): Verdict {
  const entry = objectOf(item)
  const id = textOf(entry?.id)
  const classification = CLASSES.find(known => known.id === entry?.classification)?.id
  const probability = numberOf(entry?.top_probability)
  const decision = entry?.decision === 'auto' || entry?.decision === 'review' ? entry.decision : undefined

  if (id === undefined || !expected.delete(id) || !classification || probability === undefined || probability < 0 || probability > 1 || !decision) {
    throw new Error('Jev coding returned an invalid audit verdict')
  }

  return { id, classification, top_probability: probability, decision }
}

function itemText(edit: CodeEdit) {
  const before = edit.before ? `--- before\n${edit.before}\n` : ''

  return `${edit.file}\n${before}+++ after\n${edit.after}`.slice(0, ITEM_CHARS)
}

async function classify($: EngineInterface, batch: CodeEdit[], offset: number) {
  const result = await $.mcp.call('jev', 'jev_classify', {
    purpose: "Judge whether each edit a coding agent made is what the user's request called for.",
    context: { request: prompts.join('\n---\n') },
    classes: CLASSES,
    items: batch.map((edit, index) => ({ id: String(offset + index), text: itemText(edit) })),
  })

  const text = result.content.find(block => block.type === 'text')?.text

  if (result.isError || text === undefined) throw new Error('jev_classify failed')

  const results = objectOf(parseJson(text))?.results

  if (!Array.isArray(results) || results.length !== batch.length) throw new Error('Jev coding returned incomplete audit results')

  const expected = new Set(batch.map((_, index) => String(offset + index)))

  return listOf(results).map(item => parseVerdict(item, expected))
}

function line(verdict: Verdict) {
  const edit = edits[Number(verdict.id)]
  const beforeLines = new Set(edit?.before.split('\n').map(text => text.trim()))
  const changed = edit?.after.split('\n').find(text => text.trim() && !beforeLines.has(text.trim())) ?? ''
  const preview = changed.trim().slice(0, 80)

  return `- ${edit?.file} (${verdict.classification}, p=${verdict.top_probability}): ${preview}`
}

async function review($: EngineInterface) {
  const verdicts: Verdict[] = []

  for (let offset = 0; offset < edits.length; offset += CLASSIFY_BATCH) {
    verdicts.push(...(await classify($, edits.slice(offset, offset + CLASSIFY_BATCH), offset)))
  }

  const flagged = verdicts.filter(verdict => FLAGGED.has(verdict.classification))
  const confident = flagged.filter(verdict => verdict.decision === 'auto')

  if (!confident.length) return undefined

  const unsure = flagged.filter(verdict => verdict.decision !== 'auto')

  return [
    'Jev classified edits from this turn as outside the request:',
    ...confident.map(line),
    ...(unsure.length ? ['Less certain:', ...unsure.map(line)] : []),
    'For each one, revert it or tell the user why it was needed, then finish.',
  ].join('\n')
}

// The call's input is evidence too: answers report which command ran or which file was read.
function evidenceOf(e: ToolCallInput, output: string): Evidence {
  const { tool, tool_use_id: _id, agentId: _agent, requestMeta: _meta, ...input } = e
  const args = JSON.stringify(input)

  evidenceCount += 1

  return { id: `${evidenceCount}:${tool}`, text: `${tool} input: ${args.slice(0, INPUT_CHARS)}\n${output}`, source: `${tool} ${args}` }
}

function requestEvidence(): Evidence[] {
  const request = prompts.at(-1)

  return request ? [{ id: 'user-request', text: `The user's request. It shows what was asked, not what is true:\n${request}` }] : []
}

async function callJev($: EngineInterface, tool: string, args: JsonObject) {
  const result = await $.mcp.call('jev', tool, args)
  const text = result.content.find(block => block.type === 'text')?.text

  if (result.isError || text === undefined) throw new Error(`${tool} failed`)

  return parseJson(text)
}

async function generate($: EngineInterface, prompt: string) {
  const reply = await $.model.complete({ model: EXTRACT_MODEL, prompt, timeoutMs: EXTRACT_TIMEOUT_MS })

  if (!reply.isAnswered) throw new Error(`claim extraction failed: ${reply.reason}`)

  return reply.text
}

// A failed check tells the person and not the agent: the agent can do nothing with it, and answering it buries the real reply.
async function checkAnswer($: EngineInterface, answer: string) {
  try {
    const flagged = await reviewAnswer((tool, args) => callJev($, tool, args), prompt => generate($, prompt), answer, [...requestEvidence(), ...evidence])

    if (flagged) $.ui.log(flagged)

    return flagged
  } catch (cause) {
    $.ui.log(`Jev answer check did not run: ${cause instanceof Error ? cause.message : String(cause)}`)

    return undefined
  }
}

export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (e.text) prompts = [...prompts, e.text].slice(-RECENT_PROMPTS)
    edits = []

    if (e.agentId === undefined) ranTool = false

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)

    if (e.agentId !== undefined || UNCHECKED_TOOLS.test(e.tool) || result.deny !== undefined) return result

    const output = result.text ?? ''
    ranTool = true
    evidence = [...evidence, evidenceOf(e, result.isError ? `Error: ${output}` : output)].slice(-MAX_EVIDENCE)

    return result
  })

  on('tool.call', { tool: /^(Edit|Write)$/ }, async ($, e, next) => {
    const result = await next(e)
    const edit = editOf(e)

    if (result.deny !== undefined || result.isError || !edit) return result

    edits.push(edit)

    if (edits.length > 1) return result

    return { ...result, context: [...(result.context ?? []), DECISION_REMINDER] }
  })

  // stop_hook_active means this stop follows our own block, so each turn is checked once.
  on('classic.Stop', async ($, e, next) => {
    const answer = e.last_assistant_message
    const checksAnswer = ranTool && answer !== undefined && (answer.length >= MIN_ANSWER_CHARS || hasJson(answer))

    if (e.stop_hook_active || (!edits.length && !checksAnswer)) return next(e)

    const sections = await Promise.all([
      edits.length
        ? review($).catch(() => 'Automatic Jev edit-scope audit failed. Do not claim it passed; perform the normal final review and completion gate.')
        : undefined,
      checksAnswer ? checkAnswer($, answer) : undefined,
    ])

    edits = []
    ranTool = false

    const reason = sections.filter(section => section !== undefined).join('\n\n')

    return reason ? { block: reason } : next(e)
  })
}
