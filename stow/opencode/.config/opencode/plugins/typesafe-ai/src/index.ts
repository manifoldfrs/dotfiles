import { Plugin } from "@opencode/plugin"
import {
  buildTypeSafeEvaluationRequest,
  evaluateTypeSafeRequest,
  safeTypeSafeToolError,
  serializeTypeSafeResult,
  type TypeSafeEvaluate,
  type TypeSafeEvaluationInput,
} from "./typesafe.ts"
import { parseTypeSafeResult, typeSafeOutputSchema } from "./typesafe-output.ts"

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

const typeSafeGuidance = `# TypeSafe Code Mode
If no specialized Jev tool fits, typesafe_evaluate accepts bounded Choice, Score, or Noul questions.
Inside execute, use the exact tool path and signature listed in the catalog or returned by search. The result is a validated object with answers, model, and usage; no JSON.parse is needed. Noul answers contain a probability, not a boolean.`

/** Creates the Jev harness adapter with a replaceable evaluation boundary. */
export function createTypeSafePlugin(evaluate: TypeSafeEvaluate = evaluateTypeSafeRequest) {
  return Plugin.define({
    id: "frsh.typesafe-ai",
    async setup(context) {
      await context.tool.transform((editor) => {
        editor.add({
          name: "typesafe_evaluate",
          description:
            "Ask TypeSafe Jev for bounded semantic classification, ranking, extraction, verification, or yes/no judgments with Choice, Score, or Noul questions. Return answers keyed by question ID with probabilities. Use exact search, parsing, arithmetic, and tests for deterministic facts; never send secrets or unrelated private data.",
          input: typeSafeInputSchema,
          output: typeSafeOutputSchema,
          options: { codemode: true, pinned: true },
          async execute(input, toolContext) {
            const signal = "signal" in toolContext && toolContext.signal instanceof AbortSignal
              ? toolContext.signal
              : undefined
            try {
              if (signal?.aborted) throw safeTypeSafeToolError(undefined, signal)
              const request = buildTypeSafeEvaluationRequest(
                // SAFETY: OpenCode validates the registered input schema before invoking this executor.
                input as TypeSafeEvaluationInput,
              )
              const response = await evaluate(request, signal === undefined ? {} : { signal })
              if (signal?.aborted) throw safeTypeSafeToolError(undefined, signal)
              const result = parseTypeSafeResult(response, request.questions)
              return {
                output: result,
                content: serializeTypeSafeResult(result),
                metadata: {
                  model: result.model,
                  inputTokens: result.usage.input_tokens,
                  outputTokens: result.usage.output_tokens,
                  questionCount: Object.keys(result.answers).length,
                },
              }
            } catch (error: unknown) {
              throw safeTypeSafeToolError(error, signal)
            }
          },
        })
      })
      await context.session.hook("context", (event) => {
        if (event.tools.execute === undefined) return
        const available = event.system.some(
          (part) => part.type === "text" && part.text.includes("tools.typesafe_evaluate("),
        )
        if (!available) return
        if (event.system.some((part) => part.type === "text" && part.text === typeSafeGuidance)) return
        event.system.push({ type: "text", text: typeSafeGuidance })
      })
    },
  })
}

export default createTypeSafePlugin()
