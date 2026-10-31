import { Option, Schema } from "effect"
import { callJev, errorMessage, type Generate, type Json, type ToolCaller } from "./jev.ts"

export type Evidence = { readonly id: string; readonly text: string }

// Where a claim came from decides how it can be checked; "context" covers instructions and user messages the evidence does not hold.
const Source = Schema.Literals(["tool", "inference", "knowledge", "context"])

type Source = typeof Source.Type

type Claim = { readonly text: string; readonly source: Source }

type ReportedValue = { readonly request: string; readonly value: string; readonly source: Source }

// Hard findings send the agent back; soft ones only ride along with a hard one, since alone they were mostly noise.
type Findings = { readonly hard: string[]; readonly soft: string[] }

export const MIN_ANSWER_CHARS = 400

const MAX_CLAIMS = 16

const MAX_VALUES = 32

const CLAIM_CHARS = 2_000

const CHUNK_CHARS = 6_000

const EVIDENCE_CHARS = 120_000

const AUDIT_SOURCE_CHARS = 50_000

const CONFIDENT = 0.8

const EXTRACT_PROMPT = `You audit an AI coding assistant's answer. Return only JSON, no prose, shaped exactly:
{"claims": [{"text": "...", "source": "..."}], "values": [{"request": "...", "value": "...", "source": "..."}]}

claims: up to ${MAX_CLAIMS} checkable factual statements the answer makes about code, files, commands, tool results, versions, behavior, or the outside world. Rewrite each so it stands alone without the answer. Leave out plans, opinions, questions, statements about what the assistant will do, and statements describing the answer itself.
values: up to ${MAX_VALUES} concrete values the answer reports, such as versions, paths, numbers, IDs, counts, commands, or fields of a JSON result. "request" says in one sentence what the value is; "value" is copied verbatim from the answer.
source, for every claim and value, is where it came from in this conversation:
- "tool": stated in a tool call or tool result from the recent turns.
- "inference": the assistant's own conclusion drawn from tool results, such as a count, a cause, or a summary.
- "knowledge": general knowledge, not about this machine or project.
- "context": taken from the system or project instructions or from the user's messages.
Return {"claims": [], "values": []} when there is nothing to check.

Answer:
`

// Entries are decoded one by one, so a single malformed claim from the extractor is dropped instead of failing the whole check.
const Extraction = Schema.fromJsonString(Schema.Struct({
  claims: Schema.optionalKey(Schema.Array(Schema.Json)),
  values: Schema.optionalKey(Schema.Array(Schema.Json)),
}))

const RawClaim = Schema.Struct({ text: Schema.NonEmptyString, source: Schema.optionalKey(Schema.Json) })

const RawValue = Schema.Struct({ request: Schema.NonEmptyString, value: Schema.NonEmptyString, source: Schema.optionalKey(Schema.Json) })

const VerifyResult = Schema.Struct({
  results: Schema.Array(Schema.Struct({
    verdict: Schema.Literals(["verified", "contradicted", "unsupported", "unknown"]),
    confidence: Schema.optionalKey(Schema.Number),
    status: Schema.optionalKey(Schema.String),
  })),
})

const NoulResult = Schema.Struct({
  results: Schema.Array(Schema.Struct({ probability: Schema.optionalKey(Schema.Number), label: Schema.Literals(["likely", "unlikely", "uncertain"]) })),
})

const AuditResult = Schema.Struct({
  records: Schema.Array(Schema.Struct({ id: Schema.String, action: Schema.String, p_wrong: Schema.optionalKey(Schema.Number) })),
})

const decodeExtraction = Schema.decodeUnknownSync(Extraction)

const decodeRawClaim = Schema.decodeUnknownOption(RawClaim)

const decodeRawValue = Schema.decodeUnknownOption(RawValue)

const decodeSource = Schema.decodeUnknownOption(Source)

export function hasJson(text: string) {
  return /```json\s*\n/i.test(text) || /^\s*[[{]/.test(text)
}

function jsonBlocks(text: string) {
  const fenced = [...text.matchAll(/```json\s*\n([\s\S]*?)```/gi)].map(match => match[1] ?? "")

  return fenced.length || !/^\s*[[{]/.test(text) ? fenced : [text]
}

export function jsonProblems(text: string) {
  return jsonBlocks(text).flatMap((block, index) => {
    try {
      JSON.parse(block)

      return []
    } catch (cause) {
      return [`- JSON block ${index + 1} does not parse: ${errorMessage(cause)}`]
    }
  })
}

// An unlabeled claim is checked against the tool output rather than skipped.
function sourceOf(label: Json | undefined): Source {
  return Option.getOrElse(decodeSource(label), () => "tool" as const)
}

function parseExtraction(text: string) {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")

  if (start === -1 || end <= start) throw new Error("claim extraction returned no JSON")

  const parsed = decodeExtraction(text.slice(start, end + 1))

  const claims = (parsed.claims ?? []).flatMap((entry): Claim[] => Option.match(decodeRawClaim(entry), {
    onNone: () => [],
    onSome: claim => [{ text: claim.text.slice(0, CLAIM_CHARS), source: sourceOf(claim.source) }],
  }))

  const values = (parsed.values ?? []).flatMap((entry): ReportedValue[] => Option.match(decodeRawValue(entry), {
    onNone: () => [],
    onSome: value => [{ request: value.request, value: value.value, source: sourceOf(value.source) }],
  }))

  return { claims: claims.slice(0, MAX_CLAIMS), values: values.slice(0, MAX_VALUES) }
}

// Long results are split rather than cut, so text past the first few thousand characters still counts as evidence.
export function chunkEvidence(evidence: readonly Evidence[]) {
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
function selectEvidence(chunks: readonly Evidence[], limit: number, needles: readonly string[] = []) {
  const holdsNeedle = (chunk: Evidence) => needles.some(needle => chunk.text.includes(needle))
  const ordered = [...chunks.filter(holdsNeedle).reverse(), ...chunks.filter(chunk => !holdsNeedle(chunk)).reverse()]
  const picked = new Set<Evidence>()
  let total = 0

  for (const chunk of ordered) {
    if (total + chunk.text.length > limit) continue

    picked.add(chunk)
    total += chunk.text.length
  }

  return chunks.filter(chunk => picked.has(chunk))
}

function probability(value: number | undefined) {
  return value === undefined ? "?" : value.toFixed(2)
}

// Without context jev_noul judges from world knowledge; with the evidence as context it judges how well the tool output backs an inference.
async function judgeLikelihood(tools: ToolCaller, claims: readonly string[], context: readonly Evidence[] | undefined, label: string) {
  if (!claims.length) return []

  const args: Json = context ? { propositions: claims, context } : { propositions: claims }
  const { results } = await callJev(tools, "jev_noul", args, NoulResult)

  return results.flatMap((result, index) => {
    const claim = claims[index] ?? ""

    if (result.label === "likely") return []

    return [`- ${label} and ${result.label === "unlikely" ? "likely false" : "uncertain"} (p=${probability(result.probability)}): ${claim}`]
  })
}

async function verifyObserved(tools: ToolCaller, observed: readonly Claim[], evidence: readonly Evidence[], findings: Findings) {
  const unsupportedInferences: string[] = []

  if (!observed.length) return unsupportedInferences

  const { results } = await callJev(tools, "jev_verify", { claims: observed.map(claim => claim.text), evidence }, VerifyResult)

  for (const [index, result] of results.entries()) {
    const claim = observed[index]

    if (!claim) continue

    if (result.status === "invalid_response" || result.verdict === "unknown") throw new Error("Jev verify returned an invalid verdict")

    if (result.verdict === "contradicted") {
      const confident = result.confidence !== undefined && result.confidence >= CONFIDENT

      findings[confident ? "hard" : "soft"].push(`- Contradicted by the tool output (confidence ${probability(result.confidence)}): ${claim.text}`)
    }

    if (result.verdict !== "unsupported") continue

    if (claim.source === "inference") unsupportedInferences.push(claim.text)
    else findings.soft.push(`- Presented as tool output but not found in it (confidence ${probability(result.confidence)}): ${claim.text}`)
  }

  return unsupportedInferences
}

async function checkClaims(tools: ToolCaller, claims: readonly Claim[], evidence: readonly Evidence[]): Promise<Findings> {
  const observed = claims.filter(claim => claim.source === "tool" || claim.source === "inference")
  const knowledge = claims.flatMap(claim => (claim.source === "knowledge" ? [claim.text] : []))
  const findings: Findings = { hard: [], soft: [] }
  const unsupportedInferences = await verifyObserved(tools, observed, evidence, findings)

  const [inferences, general] = await Promise.all([
    judgeLikelihood(tools, unsupportedInferences, evidence, "Inference not backed by the tool output"),
    judgeLikelihood(tools, knowledge, undefined, "General claim"),
  ])

  findings.soft.push(...inferences, ...general)

  return findings
}

async function checkValues(tools: ToolCaller, reported: readonly ReportedValue[], chunks: readonly Evidence[]): Promise<Findings> {
  const values = reported.filter(entry => entry.source === "tool")
  const findings: Findings = { hard: [], soft: [] }

  if (!values.length) return findings

  const needles = values.map(entry => entry.value)
  const source = selectEvidence(chunks, AUDIT_SOURCE_CHARS, needles).map(item => `### ${item.id}\n${item.text}`).join("\n\n").slice(0, AUDIT_SOURCE_CHARS)
  const records = values.map((entry, index) => ({ id: `v${index + 1}`, request: entry.request.slice(0, 500), value: entry.value.slice(0, 2_000) }))
  const audit = await callJev(tools, "jev_audit", { source, records }, AuditResult)

  for (const result of audit.records) {
    if (result.action === "invalid_response") throw new Error("Jev audit returned an invalid record")

    const entry = result.action === "wrong" ? records.find(item => item.id === result.id) : undefined

    if (!entry) continue

    // A value that appears verbatim in the tool output was observed, so a "wrong" verdict is at most a labeling quibble.
    const observed = chunks.some(chunk => chunk.text.includes(entry.value))

    findings[observed ? "soft" : "hard"].push(`- Reported value not backed by the tool output (p_wrong=${probability(result.p_wrong)}): ${entry.request} = ${entry.value}`)
  }

  return findings
}

export async function reviewAnswer(tools: ToolCaller, generate: Generate, answer: string, evidence: readonly Evidence[]) {
  const hard = jsonProblems(answer)
  const { claims, values } = parseExtraction(await generate(EXTRACT_PROMPT + answer))
  const chunks = chunkEvidence(evidence)

  const [claimFindings, valueFindings] = await Promise.all([
    checkClaims(tools, claims, selectEvidence(chunks, EVIDENCE_CHARS)),
    checkValues(tools, values, chunks),
  ])

  hard.push(...claimFindings.hard, ...valueFindings.hard)

  if (!hard.length) return undefined

  const soft = [...claimFindings.soft, ...valueFindings.soft]

  return [
    "Jev checked your last answer and flagged:",
    ...hard,
    ...(soft.length ? ["Less certain:", ...soft] : []),
    "Correct each flagged item, or cite the tool output that supports it, then give the user the corrected answer.",
  ].join("\n")
}
