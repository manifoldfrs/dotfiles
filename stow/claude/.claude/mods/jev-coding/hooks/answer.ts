import { withoutSecrets } from './secrets.ts'
import { listOf, numberOf, objectOf, parseJson, textOf, type Json, type JsonObject } from './json.ts'

export type Evidence = { id: string; text: string; source?: string }

type Chunk = { id: string; text: string }

export type CallJev = (tool: string, args: JsonObject) => Promise<Json>

export type Generate = (prompt: string) => Promise<string>

// Where a claim came from decides how it can be checked; "context" covers instructions and user messages the evidence does not hold.
const SOURCES = ['tool', 'inference', 'knowledge', 'context'] as const
const VERDICTS = ['verified', 'contradicted', 'unsupported'] as const

type Source = (typeof SOURCES)[number]

type Claim = { text: string; source: Source; timed: boolean }

type ReportedValue = { request: string; value: string; source: Source }

type Verdict = { verdict: (typeof VERDICTS)[number]; confidence: number | undefined }

type AuditRecord = { id: string; action: string; pWrong: number | undefined }

// Hard findings send the agent back; soft ones only ride along with a hard one, since alone they were mostly noise.
type Findings = { hard: string[]; soft: string[] }

export const MIN_ANSWER_CHARS = 400
const MAX_CLAIMS = 16
const MAX_VALUES = 32
const CLAIM_CHARS = 2_000
const CHUNK_CHARS = 6_000
const EVIDENCE_CHARS = 120_000

// TypeSafe limits a request by tokens, 32k per question; the densest text measured hit that near 43,000 characters.
const BATCH_CHARS = 30_000
const AUDIT_SOURCE_CHARS = 35_000
const CONFIDENT = 0.8

const EXTRACT_PROMPT = `You audit an AI coding assistant's answer. Return only JSON, no prose, shaped exactly:
{"claims": [{"text": "...", "source": "...", "timed": false}], "values": [{"request": "...", "value": "...", "source": "..."}]}

claims: up to ${MAX_CLAIMS} checkable factual statements the answer makes about code, files, commands, tool results, versions, behavior, or the outside world. Rewrite each so it stands alone without the answer. Leave out plans, opinions, questions, statements about what the assistant will do, and statements describing the answer itself.
values: up to ${MAX_VALUES} concrete values the answer reports, such as versions, paths, numbers, IDs, counts, commands, or fields of a JSON result. "request" says in one sentence what the value is; "value" is copied verbatim from the answer.
source, for every claim and value, is where it came from in this conversation:
- "tool": stated in a tool call or tool result from the recent turns.
- "inference": the assistant's own conclusion drawn from tool results, such as a count, a cause, or a summary.
- "knowledge": general knowledge, not about this machine or project.
- "context": taken from the system or project instructions or from the user's messages.
timed, for every claim, is true when the claim depends on the order or timing of events, such as what happened before, after, or since something, or what is still or no longer true.
Return {"claims": [], "values": []} when there is nothing to check.

Answer:
`

export function hasJson(text: string) {
  return /```json\s*\n/i.test(text) || /^\s*[[{]/.test(text)
}

function jsonBlocks(text: string) {
  const fenced = [...text.matchAll(/```json\s*\n([\s\S]*?)```/gi)].map(match => match[1] ?? '')

  return fenced.length || !/^\s*[[{]/.test(text) ? fenced : [text]
}

function jsonProblems(text: string) {
  return jsonBlocks(text).flatMap((block, index) => {
    try {
      JSON.parse(block)

      return []
    } catch (cause) {
      return [`- JSON block ${index + 1} does not parse: ${cause instanceof Error ? cause.message : String(cause)}`]
    }
  })
}

// An unlabeled claim is checked against the tool output rather than skipped.
function sourceOf(label: Json | undefined): Source {
  return SOURCES.find(source => source === label) ?? 'tool'
}

// Entries are read one by one, so a single malformed claim from the extractor is dropped instead of failing the whole check.
function parseExtraction(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')

  if (start === -1 || end <= start) throw new Error('claim extraction returned no JSON')

  const parsed = objectOf(parseJson(text.slice(start, end + 1)))

  if (!parsed) throw new Error('claim extraction returned no object')

  const claims = listOf(parsed.claims).flatMap((item): Claim[] => {
    const entry = objectOf(item)
    const claim = textOf(entry?.text)

    return entry && claim ? [{ text: claim.slice(0, CLAIM_CHARS), source: sourceOf(entry.source), timed: entry.timed === true }] : []
  })

  const values = listOf(parsed.values).flatMap((item): ReportedValue[] => {
    const entry = objectOf(item)
    const request = textOf(entry?.request)
    const value = textOf(entry?.value)

    return entry && request && value ? [{ request, value, source: sourceOf(entry.source) }] : []
  })

  return { claims: claims.slice(0, MAX_CLAIMS), values: values.slice(0, MAX_VALUES) }
}

function parseVerdicts(result: Json): Verdict[] {
  return listOf(objectOf(result)?.results).map(item => {
    const entry = objectOf(item)
    const verdict = VERDICTS.find(known => known === entry?.verdict)

    if (!entry || !verdict || entry.status === 'invalid_response') throw new Error('Jev verify returned an invalid verdict')

    return { verdict, confidence: numberOf(entry.confidence) }
  })
}

function parseAudit(result: Json): AuditRecord[] {
  return listOf(objectOf(result)?.records).map(item => {
    const entry = objectOf(item)
    const id = textOf(entry?.id)
    const action = textOf(entry?.action)

    if (!entry || id === undefined || action === undefined || action === 'invalid_response') throw new Error('Jev audit returned an invalid record')

    return { id, action, pWrong: numberOf(entry.p_wrong) }
  })
}

// Rereading a file or rerunning a command replaces what the earlier result showed, so only the newest stands as evidence.
function latestPerSource(evidence: readonly Evidence[]): Chunk[] {
  const newest = new Map(evidence.flatMap(item => (item.source ? [[item.source, item] as const] : [])))

  return evidence.flatMap(item => (!item.source || newest.get(item.source) === item ? [{ id: item.id, text: item.text }] : []))
}

// Long results are split rather than cut, so text past the first few thousand characters still counts as evidence.
function chunkEvidence(evidence: readonly Chunk[]) {
  return evidence.flatMap(item => {
    if (item.text.length <= CHUNK_CHARS) return [item]

    const count = Math.ceil(item.text.length / CHUNK_CHARS)

    return Array.from({ length: count }, (_, index) => ({
      id: `${item.id}#${index + 1}`,
      text: item.text.slice(index * CHUNK_CHARS, (index + 1) * CHUNK_CHARS),
    }))
  })
}

// Keeps the newest chunks, plus any chunk that holds a needle, within the size budget.
function selectEvidence(chunks: readonly Chunk[], limit: number, needles: readonly string[]) {
  const holdsNeedle = (chunk: Chunk) => needles.some(needle => chunk.text.includes(needle))
  const ordered = [...chunks.filter(holdsNeedle).reverse(), ...chunks.filter(chunk => !holdsNeedle(chunk)).reverse()]
  const picked = new Set<Chunk>()
  let total = 0

  for (const chunk of ordered) {
    if (total + chunk.text.length > limit) continue
    picked.add(chunk)
    total += chunk.text.length
  }

  return chunks.filter(chunk => picked.has(chunk))
}

// A claim's wording is rewritten, so only identifier-shaped words such as paths, versions, and snake_case names match tool output.
function distinctiveTerms(text: string) {
  return (text.match(/\w+(?:[./:@-]\w+)+|\w*[\d_]\w*/g) ?? []).filter(term => term.length >= 4)
}

function batchEvidence(chunks: readonly Chunk[]) {
  const batches: Chunk[][] = []
  let total = 0

  for (const chunk of chunks) {
    const current = batches.at(-1)

    if (current && total + chunk.text.length <= BATCH_CHARS) {
      current.push(chunk)
      total += chunk.text.length
    } else {
      batches.push([chunk])
      total = chunk.text.length
    }
  }

  return batches
}

const VERDICT_RANK: Record<Verdict['verdict'], number> = { unsupported: 0, verified: 1, contradicted: 2 }

// Evidence for a claim can sit in any one batch, so one batch's support counts unless another contradicts it.
function strongestVerdict(verdicts: readonly Verdict[]) {
  return [...verdicts].sort((a, b) => VERDICT_RANK[b.verdict] - VERDICT_RANK[a.verdict] || (b.confidence ?? 0) - (a.confidence ?? 0)).at(0)
}

function probability(value: number | undefined) {
  return value === undefined ? '?' : value.toFixed(2)
}

function recordVerdict(claim: Claim, verdicts: readonly Verdict[], dropped: boolean, findings: Findings) {
  const result = strongestVerdict(verdicts)

  if (!result || result.verdict === 'verified') return

  if (verdicts.some(verdict => verdict.verdict === 'verified')) {
    findings.soft.push(`- The tool output disagrees with itself about this claim: ${claim.text}`)

    return
  }

  if (result.verdict === 'contradicted') {
    // Jev reads dates as text and orders events unreliably, so a timed claim is never grounds for a send-back.
    const confident = !claim.timed && result.confidence !== undefined && result.confidence >= CONFIDENT
    findings[confident ? 'hard' : 'soft'].push(`- Contradicted by the tool output (confidence ${probability(result.confidence)}): ${claim.text}`)

    return
  }

  if (dropped) findings.soft.push(`- Could not verify, because older tool output was dropped to fit Jev's limit: ${claim.text}`)
  else if (claim.source !== 'inference') findings.soft.push(`- Presented as tool output but not found in it (confidence ${probability(result.confidence)}): ${claim.text}`)
}

async function verifyClaims(callJev: CallJev, claims: readonly Claim[], evidence: readonly Chunk[], dropped: boolean, findings: Findings) {
  if (!claims.length) return

  const texts = claims.map(claim => claim.text)
  const answers = await Promise.all(batchEvidence(evidence).map(async batch => parseVerdicts(await callJev('jev_verify', { claims: texts, evidence: batch }))))

  for (const [index, claim] of claims.entries()) {
    recordVerdict(claim, answers.flatMap(answer => answer[index] ?? []), dropped, findings)
  }
}

async function checkValues(callJev: CallJev, reported: readonly ReportedValue[], chunks: readonly Chunk[], selected: readonly Chunk[], dropped: boolean, findings: Findings) {
  const values = reported.filter(entry => entry.source === 'tool')

  if (!values.length) return

  const needles = values.map(entry => entry.value)
  const source = selectEvidence(chunks, AUDIT_SOURCE_CHARS, needles).map(item => `### ${item.id}\n${item.text}`).join('\n\n').slice(0, AUDIT_SOURCE_CHARS)
  const records = values.map((entry, index) => ({ id: `v${index + 1}`, request: entry.request.slice(0, 500), value: entry.value.slice(0, 2_000) }))
  const audit = parseAudit(await callJev('jev_audit', { source, records }))
  const unobserved: Claim[] = []

  for (const result of audit) {
    const entry = result.action === 'wrong' ? records.find(item => item.id === result.id) : undefined

    if (!entry) continue

    // A value that appears verbatim in the tool output was observed, so a "wrong" verdict is at most a labeling quibble.
    const observed = chunks.some(chunk => chunk.text.includes(entry.value))

    if (observed) findings.soft.push(`- Reported value not backed by the tool output (p_wrong=${probability(result.pWrong)}): ${entry.request} = ${entry.value}`)
    else unobserved.push({ text: `${entry.request} = ${entry.value}`, source: 'tool', timed: false })
  }

  // The audit flags a value it can't find the same as a wrong one, and it only sees a slice of the session, so only a real contradiction sends the agent back.
  await verifyClaims(callJev, unobserved, selected, dropped, findings)
}

/** Fact-checks an answer against tool output; returns what to send the agent back with, or undefined when nothing hard was found. */
export async function reviewAnswer(callJev: CallJev, generate: Generate, answer: string, evidence: readonly Evidence[]) {
  const { claims, values } = parseExtraction(await generate(EXTRACT_PROMPT + withoutSecrets(answer)))
  const chunks = chunkEvidence(latestPerSource(evidence))
  const needles = [...values.map(entry => entry.value), ...claims.flatMap(claim => distinctiveTerms(claim.text))]
  const selected = selectEvidence(chunks, EVIDENCE_CHARS, needles)
  const dropped = selected.length < chunks.length
  const observed = claims.filter(claim => claim.source === 'tool' || claim.source === 'inference')
  const findings: Findings = { hard: jsonProblems(answer), soft: [] }

  await Promise.all([
    verifyClaims(callJev, observed, selected, dropped, findings),
    checkValues(callJev, values, chunks, selected, dropped, findings),
  ])

  if (!findings.hard.length) return undefined

  return [
    'Jev checked your last answer and flagged:',
    ...findings.hard,
    ...(findings.soft.length ? ['Less certain:', ...findings.soft] : []),
    'Correct each flagged item, or cite the tool output that supports it. Keep the reply short, and write it for someone who has not read this message: say what you got wrong and what is true, without mentioning flags or checks.',
  ].join('\n')
}
