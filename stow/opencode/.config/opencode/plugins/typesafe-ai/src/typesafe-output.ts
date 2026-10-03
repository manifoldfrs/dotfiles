import type { Question, Questions, ResultFor, SystemOneResult } from "@typesafe-ai/sdk"
import { TypeSafeToolResponseError } from "./typesafe.ts"

const probabilitySchema = { type: "number", minimum: 0, maximum: 1 } as const
const probabilitiesSchema = {
  type: "object",
  additionalProperties: probabilitySchema,
} as const

/** Parses provider answers against the requested questions and drops undeclared fields. */
export function parseTypeSafeResult(
  value: unknown,
  questions: Questions,
): SystemOneResult<Questions> {
  const result = parseResultRecord(value)
  if (typeof result.model !== "string" || result.model.length === 0) {
    throw new TypeSafeToolResponseError()
  }
  const answers = parseResultRecord(result.answers)
  const entries = Object.entries(questions)
  if (Object.keys(answers).length !== entries.length) throw new TypeSafeToolResponseError()
  const parsedAnswers = Object.fromEntries(entries.map(([id, question]) => {
    if (!Object.hasOwn(answers, id)) throw new TypeSafeToolResponseError()
    return [id, parseQuestionAnswer(answers[id], question)]
  }))
  const usage = parseResultRecord(result.usage)
  return {
    model: result.model,
    answers: parsedAnswers,
    usage: {
      input_tokens: parseTokenCount(usage.input_tokens),
      output_tokens: parseTokenCount(usage.output_tokens),
    },
  }
}

function parseQuestionAnswer(value: unknown, question: Question): ResultFor<Question> {
  const answer = parseResultRecord(value)
  if (answer.type !== question.type) throw new TypeSafeToolResponseError()
  switch (question.type) {
    case "noul":
      return { type: "noul", noul: parseProbability(answer.noul) }
    case "choice": {
      if (typeof answer.choice !== "string" || !Object.hasOwn(question.criteria, answer.choice)) {
        throw new TypeSafeToolResponseError()
      }
      return {
        type: "choice",
        choice: answer.choice,
        confidence: parseProbability(answer.confidence),
        probabilities: parseProbabilities(answer.probabilities, Object.keys(question.criteria)),
      }
    }
    case "score": {
      const keys = question.criteria.map((_, index) => String(index))
      const legend = parseResultRecord(answer.legend)
      if (Object.keys(legend).length !== keys.length) throw new TypeSafeToolResponseError()
      const parsedLegend = Object.fromEntries(keys.map((key, index) => {
        const description = legend[key]
        if (typeof description !== "string" || description !== question.criteria[index]) {
          throw new TypeSafeToolResponseError()
        }
        return [key, description]
      }))
      if (typeof answer.score !== "number" || !Number.isFinite(answer.score) ||
        answer.score < 0 || answer.score > keys.length - 1) {
        throw new TypeSafeToolResponseError()
      }
      return {
        type: "score",
        score: answer.score,
        confidence: parseProbability(answer.confidence),
        legend: parsedLegend,
        probabilities: parseProbabilities(answer.probabilities, keys),
      }
    }
  }
}

function parseResultRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeSafeToolResponseError()
  }
  return Object.fromEntries(Object.entries(value))
}

function parseProbability(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeSafeToolResponseError()
  }
  return value
}

function parseProbabilities(value: unknown, keys: readonly string[]): Record<string, number> {
  const probabilities = parseResultRecord(value)
  if (Object.keys(probabilities).length !== keys.length) throw new TypeSafeToolResponseError()
  return Object.fromEntries(keys.map((key) => {
    if (!Object.hasOwn(probabilities, key)) throw new TypeSafeToolResponseError()
    return [key, parseProbability(probabilities[key])]
  }))
}

function parseTokenCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeSafeToolResponseError()
  }
  return value
}

/** TypeSafe output schema exposes typed answers to Code Mode scripts. */
export const typeSafeOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["model", "answers", "usage"],
  properties: {
    model: { type: "string", minLength: 1 },
    answers: {
      type: "object",
      additionalProperties: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "noul"],
            properties: {
              type: { const: "noul" },
              noul: probabilitySchema,
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "choice", "confidence", "probabilities"],
            properties: {
              type: { const: "choice" },
              choice: { type: "string" },
              confidence: probabilitySchema,
              probabilities: probabilitiesSchema,
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["type", "score", "confidence", "legend", "probabilities"],
            properties: {
              type: { const: "score" },
              score: { type: "number", minimum: 0 },
              confidence: probabilitySchema,
              legend: { type: "object", additionalProperties: { type: "string" } },
              probabilities: probabilitiesSchema,
            },
          },
        ],
      },
    },
    usage: {
      type: "object",
      additionalProperties: false,
      required: ["input_tokens", "output_tokens"],
      properties: {
        input_tokens: { type: "integer", minimum: 0 },
        output_tokens: { type: "integer", minimum: 0 },
      },
    },
  },
} as const
