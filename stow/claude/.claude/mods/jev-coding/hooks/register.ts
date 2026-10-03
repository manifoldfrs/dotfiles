import type { EngineInterface, Register } from 'claude-code'

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

const DECISION_REMINDER =
  'Jev decision check: if this edit carries out a choice between approaches (library, design, data model, or fix strategy) that you have not run through jev_decide, run jev_decide now with the options, the evidence, and the user\'s stated priorities, and report its verdict.'

type CodeEdit = { file: string; before: string; after: string }
type Verdict = { id: string; classification: string; top_probability: number; decision: string }

// Module state resets on hot reload; that only loses the edits of a turn in flight.
let prompts: string[] = []
let edits: CodeEdit[] = []

function editOf(e: { tool: string } & Record<string, unknown>): CodeEdit | undefined {
  const file = String(e.file_path ?? '')
  if (e.tool === 'Edit') return { file, before: String(e.old_string ?? ''), after: String(e.new_string ?? '') }
  if (e.tool === 'Write') return { file, before: '', after: String(e.content ?? '') }
  return undefined
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
  return (JSON.parse(text).results ?? []) as Verdict[]
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

export const register: Register = on => {
  on('turn.start', async ($, e, next) => {
    if (e.text) prompts = [...prompts, e.text].slice(-RECENT_PROMPTS)
    edits = []

    return next(e)
  })

  on('tool.call', { tool: /^(Edit|Write)$/ }, async ($, e, next) => {
    const result = await next(e)
    const edit = editOf(e as unknown as { tool: string } & Record<string, unknown>)
    if (result.deny !== undefined || result.isError || !edit) return result

    edits.push(edit)
    if (edits.length > 1) return result
    return { ...result, context: [...(result.context ?? []), DECISION_REMINDER] }
  })

  // stop_hook_active means this stop follows our own block, so each turn is checked once.
  on('classic.Stop', async ($, e, next) => {
    if (e.stop_hook_active || !edits.length) return next(e)

    // A failed check lets the agent finish rather than trapping the turn.
    const reason = await review($).catch(() => {
      $.ui.toast('jev-coding: Jev could not classify this turn\'s edits.')
      return undefined
    })
    edits = []
    return reason ? { block: reason } : next(e)
  })
}
