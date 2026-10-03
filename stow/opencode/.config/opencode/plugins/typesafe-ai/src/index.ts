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

const typeSafeGuidance = `# TypeSafe Jev judgments
Use the available Jev tools for verification, content screening, and completion judgments; prefer them for selection, classification, ranking, and comparison by meaning. If a specialized Jev tool fits, use it; otherwise use typesafe_evaluate for bounded Choice, Score, or Noul questions.
Use exact search, parsing, arithmetic, and tests for deterministic facts, not Jev. A judgment is evidence, not proof; inspect probabilities and escalate uncertain consequential decisions.
Inside execute, call tools only by the paths and signatures in the Code Mode catalog or search results. Batch independent judgments inside execute and return only the useful answers. Inputs leave this machine: do not send secrets or unrelated private data. Never invoke a paid classifier just to satisfy this instruction.
Example inside execute, when the catalog lists tools.typesafe_evaluate:
const result = await tools.typesafe_evaluate({ state: "A customer asks to cancel today", noul_questions: [{ id: "urgent", instructions: "Does this need a reply today?" }] });
return result.answers.urgent; // { type: "noul", noul: probability }, not a boolean. No JSON.parse needed.`

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
