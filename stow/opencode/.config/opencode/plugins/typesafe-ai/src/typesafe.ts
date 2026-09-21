import {
  APIUserAbortError,
  AuthenticationError,
  RateLimitError,
  TypeSafeClient,
  UnprocessableEntityError,
  choice,
  noul,
  score,
  type EntryType,
  type Questions,
  type RequestOptions,
  type SystemOneRequest,
  type SystemOneResult,
} from "@typesafe-ai/sdk"

const MAX_RESULT_BYTES = 50 * 1024
const MAX_RESULT_LINES = 2_000

export type TypeSafeEvaluationInput = {
  readonly state: EntryType
  readonly model?: string
  readonly noul_questions?: ReadonlyArray<{
    readonly id: string
    readonly instructions: string
    readonly yes_description?: string
    readonly no_description?: string
  }>
  readonly choice_questions?: ReadonlyArray<{
    readonly id: string
    readonly instructions: string
    readonly options: ReadonlyArray<{
      readonly label: string
      readonly description?: string
    }>
  }>
  readonly score_questions?: ReadonlyArray<{
    readonly id: string
    readonly instructions: string
    readonly levels: readonly string[]
  }>
}

export type TypeSafeEvaluate = (
  request: SystemOneRequest,
  options: RequestOptions,
) => Promise<SystemOneResult<Questions>>

export class TypeSafeToolInputError extends Error {}

class TypeSafeCredentialError extends Error {}

export function buildTypeSafeEvaluationRequest(
  input: TypeSafeEvaluationInput,
): SystemOneRequest {
  const questions: Questions = {}
  const questionIds = new Set<string>()

  const reserveQuestionId = (questionId: string): void => {
    if (questionIds.has(questionId)) {
      throw new TypeSafeToolInputError(
        `TypeSafe question ID is duplicated: ${questionId}`,
      )
    }
    questionIds.add(questionId)
  }

  for (const question of input.noul_questions ?? []) {
    reserveQuestionId(question.id)
    const criteria = {
      ...(question.yes_description === undefined
        ? {}
        : { true: question.yes_description }),
      ...(question.no_description === undefined
        ? {}
        : { false: question.no_description }),
    }
    questions[question.id] =
      Object.keys(criteria).length === 0
        ? noul(question.instructions)
        : noul(question.instructions, criteria)
  }

  for (const question of input.choice_questions ?? []) {
    reserveQuestionId(question.id)
    const criteria: Record<string, string | null> = {}
    for (const option of question.options) {
      if (option.label in criteria) {
        throw new TypeSafeToolInputError(
          `TypeSafe choice label is duplicated for ${question.id}: ${option.label}`,
        )
      }
      criteria[option.label] = option.description ?? null
    }
    questions[question.id] = choice(question.instructions, criteria)
  }

  for (const question of input.score_questions ?? []) {
    reserveQuestionId(question.id)
    const [firstLevel, secondLevel, ...remainingLevels] = question.levels
    if (firstLevel === undefined || secondLevel === undefined) {
      throw new TypeSafeToolInputError(
        `TypeSafe score question requires at least two levels: ${question.id}`,
      )
    }
    questions[question.id] = score(question.instructions, [
      firstLevel,
      secondLevel,
      ...remainingLevels,
    ])
  }

  if (questionIds.size === 0) {
    throw new TypeSafeToolInputError(
      "TypeSafe evaluation requires at least one question",
    )
  }

  return {
    state: input.state,
    questions,
    ...(input.model === undefined ? {} : { model: input.model }),
  }
}

export async function evaluateTypeSafeRequest(
  request: SystemOneRequest,
  options: RequestOptions,
): Promise<SystemOneResult<Questions>> {
  if (!process.env.TYPESAFE_API_KEY?.trim()) {
    throw new TypeSafeCredentialError()
  }
  const client = new TypeSafeClient()
  return client.systemOne(request, options)
}

export function safeTypeSafeToolError(
  error: unknown,
  signal?: AbortSignal,
): Error {
  if (error instanceof TypeSafeToolInputError) return new Error(error.message)
  if (signal?.aborted || error instanceof APIUserAbortError) {
    return new Error("TypeSafe evaluation was cancelled")
  }
  if (
    error instanceof TypeSafeCredentialError ||
    error instanceof AuthenticationError
  ) {
    return new Error(
      "TypeSafe authentication failed; check the TYPESAFE_API_KEY environment variable",
    )
  }
  if (error instanceof RateLimitError) {
    return new Error("TypeSafe rate limit was exceeded after retries")
  }
  if (error instanceof UnprocessableEntityError) {
    return new Error("TypeSafe rejected the evaluation request as invalid")
  }
  return new Error("TypeSafe evaluation failed")
}

export function serializeTypeSafeResult(result: SystemOneResult<Questions>): string {
  const serialized = JSON.stringify(result, null, 2)
  const lines = serialized.split("\n")
  let content = lines.slice(0, MAX_RESULT_LINES).join("\n")
  let truncated = lines.length > MAX_RESULT_LINES

  if (Buffer.byteLength(content) > MAX_RESULT_BYTES) {
    const buffer = Buffer.from(content)
    content = buffer.subarray(0, MAX_RESULT_BYTES).toString("utf8")
    truncated = true
  }

  return truncated
    ? `${content}\n\n[TypeSafe result truncated; submit fewer questions to retrieve every answer.]`
    : content
}
