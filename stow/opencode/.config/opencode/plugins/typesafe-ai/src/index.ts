import { Plugin } from "@opencode/plugin"
import {
  buildTypeSafeEvaluationRequest,
  evaluateTypeSafeRequest,
  safeTypeSafeToolError,
  serializeTypeSafeResult,
  type TypeSafeEvaluationInput,
} from "./typesafe.ts"

const typeSafeInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["state"],
  properties: {
    state: {
      anyOf: [
        { type: "string" },
        { type: "object", additionalProperties: true },
        { type: "array" },
        { type: "null" },
      ],
      description: "Text, a JSON object or array, or null",
    },
    model: {
      type: "string",
      minLength: 1,
      description: "Optional Jev model ID; omit to use the SDK default",
    },
    noul_questions: {
      type: "array",
      description: "Independent yes/no judgments",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "instructions"],
        properties: {
          id: { type: "string", minLength: 1 },
          instructions: { type: "string", minLength: 1 },
          yes_description: { type: "string" },
          no_description: { type: "string" },
        },
      },
    },
    choice_questions: {
      type: "array",
      description: "Independent selections from defined options",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "instructions", "options"],
        properties: {
          id: { type: "string", minLength: 1 },
          instructions: { type: "string", minLength: 1 },
          options: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["label"],
              properties: {
                label: { type: "string", minLength: 1 },
                description: { type: "string" },
              },
            },
          },
        },
      },
    },
    score_questions: {
      type: "array",
      description: "Independent ratings on ordered rubrics",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "instructions", "levels"],
        properties: {
          id: { type: "string", minLength: 1 },
          instructions: { type: "string", minLength: 1 },
          levels: {
            type: "array",
            minItems: 2,
            items: { type: "string", minLength: 1 },
          },
        },
      },
    },
  },
} as const

export default Plugin.define({
  id: "frsh.typesafe-ai",
  async setup(context) {
    await context.tool.transform((editor) => {
      editor.add({
        name: "typesafe_evaluate",
        description:
          "Ask TypeSafe Jev for narrow typed semantic judgments. Use for Choice, Score, or Noul questions, never for secrets, arithmetic, parsing, code generation, or multi-step reasoning.",
        input: typeSafeInputSchema,
        async execute(input, toolContext) {
          try {
            const request = buildTypeSafeEvaluationRequest(
              input as TypeSafeEvaluationInput,
            )
            const signal = (toolContext as { signal?: AbortSignal }).signal
            const result = await evaluateTypeSafeRequest(
              request,
              signal === undefined ? {} : { signal },
            )
            return {
              content: serializeTypeSafeResult(result),
              metadata: {
                model: result.model,
                inputTokens: result.usage.input_tokens,
                outputTokens: result.usage.output_tokens,
                questionCount: Object.keys(result.answers).length,
              },
            }
          } catch (error: unknown) {
            const signal = (toolContext as { signal?: AbortSignal }).signal
            throw safeTypeSafeToolError(error, signal)
          }
        },
      })
    })
  },
})
