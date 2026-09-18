import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  truncateHead,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
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
} from "@typesafe-ai/sdk";
import { Type } from "typebox";

// SAFETY: Tool arguments are JSON, and this schema restricts the top-level value to the SDK's EntryType variants.
const typeSafeEntrySchema = Type.Unsafe<EntryType>({
  anyOf: [
    { type: "string" },
    { type: "object", additionalProperties: true },
    { type: "array" },
    { type: "null" },
  ],
  description: "Text, a JSON object or array, or null",
});

const typeSafeQuestionInstructionsSchema = Type.String({
  minLength: 1,
  description: "One narrow semantic judgment about the supplied state",
});

const typeSafeEvaluationToolParameters = Type.Object({
  state: typeSafeEntrySchema,
  model: Type.Optional(
    Type.String({
      minLength: 1,
      description: "Optional Jev model ID; omit to use the SDK default",
    }),
  ),
  noul_questions: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.String({ minLength: 1, description: "Unique answer ID" }),
        instructions: typeSafeQuestionInstructionsSchema,
        yes_description: Type.Optional(
          Type.String({ description: "Optional description of a yes answer" }),
        ),
        no_description: Type.Optional(
          Type.String({ description: "Optional description of a no answer" }),
        ),
      }),
      { description: "Independent yes/no judgments" },
    ),
  ),
  choice_questions: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.String({ minLength: 1, description: "Unique answer ID" }),
        instructions: typeSafeQuestionInstructionsSchema,
        options: Type.Array(
          Type.Object({
            label: Type.String({ minLength: 1 }),
            description: Type.Optional(Type.String()),
          }),
          { minItems: 2, description: "Available answer labels" },
        ),
      }),
      { description: "Independent selections from defined options" },
    ),
  ),
  score_questions: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.String({ minLength: 1, description: "Unique answer ID" }),
        instructions: typeSafeQuestionInstructionsSchema,
        levels: Type.Array(Type.String({ minLength: 1 }), {
          minItems: 2,
          description: "Ordered rubric levels from lowest to highest",
        }),
      }),
      { description: "Independent ratings on ordered rubrics" },
    ),
  ),
});

type TypeSafeEvaluate = (
  request: SystemOneRequest,
  options: RequestOptions,
) => Promise<SystemOneResult<Questions>>;

class TypeSafeToolInputError extends Error {}

class TypeSafeCredentialError extends Error {}

type TypeSafeEvaluationToolInput = {
  readonly state: EntryType;
  readonly model?: string;
  readonly noul_questions?: ReadonlyArray<{
    readonly id: string;
    readonly instructions: string;
    readonly yes_description?: string;
    readonly no_description?: string;
  }>;
  readonly choice_questions?: ReadonlyArray<{
    readonly id: string;
    readonly instructions: string;
    readonly options: ReadonlyArray<{
      readonly label: string;
      readonly description?: string;
    }>;
  }>;
  readonly score_questions?: ReadonlyArray<{
    readonly id: string;
    readonly instructions: string;
    readonly levels: readonly string[];
  }>;
};

/** Build one validated TypeSafe request from the Pi tool's model-friendly question groups. */
export function buildTypeSafeEvaluationRequest(
  input: TypeSafeEvaluationToolInput,
): SystemOneRequest {
  const questions: Questions = {};
  const questionIds = new Set<string>();

  const reserveQuestionId = (questionId: string): void => {
    if (questionIds.has(questionId)) {
      throw new TypeSafeToolInputError(
        `TypeSafe question ID is duplicated: ${questionId}`,
      );
    }
    questionIds.add(questionId);
  };

  for (const question of input.noul_questions ?? []) {
    reserveQuestionId(question.id);
    const criteria = {
      ...(question.yes_description === undefined
        ? {}
        : { true: question.yes_description }),
      ...(question.no_description === undefined
        ? {}
        : { false: question.no_description }),
    };
    questions[question.id] =
      Object.keys(criteria).length === 0
        ? noul(question.instructions)
        : noul(question.instructions, criteria);
  }

  for (const question of input.choice_questions ?? []) {
    reserveQuestionId(question.id);
    const criteria: Record<string, string | null> = {};
    for (const option of question.options) {
      if (option.label in criteria) {
        throw new TypeSafeToolInputError(
          `TypeSafe choice label is duplicated for ${question.id}: ${option.label}`,
        );
      }
      criteria[option.label] = option.description ?? null;
    }
    questions[question.id] = choice(question.instructions, criteria);
  }

  for (const question of input.score_questions ?? []) {
    reserveQuestionId(question.id);
    const [firstLevel, secondLevel, ...remainingLevels] = question.levels;
    if (firstLevel === undefined || secondLevel === undefined) {
      throw new TypeSafeToolInputError(
        `TypeSafe score question requires at least two levels: ${question.id}`,
      );
    }
    questions[question.id] = score(question.instructions, [
      firstLevel,
      secondLevel,
      ...remainingLevels,
    ]);
  }

  if (questionIds.size === 0) {
    throw new TypeSafeToolInputError(
      "TypeSafe evaluation requires at least one question",
    );
  }

  return {
    state: input.state,
    questions,
    ...(input.model === undefined ? {} : { model: input.model }),
  };
}

async function evaluateTypeSafeRequest(
  request: SystemOneRequest,
  options: RequestOptions,
): Promise<SystemOneResult<Questions>> {
  if (!process.env.TYPESAFE_API_KEY?.trim()) {
    throw new TypeSafeCredentialError();
  }
  const client = new TypeSafeClient();
  return client.systemOne(request, options);
}

function safeTypeSafeToolError(error: unknown, signal?: AbortSignal): Error {
  if (error instanceof TypeSafeToolInputError) {
    return new Error(error.message);
  }
  if (signal?.aborted || error instanceof APIUserAbortError) {
    return new Error("TypeSafe evaluation was cancelled");
  }
  if (
    error instanceof TypeSafeCredentialError ||
    error instanceof AuthenticationError
  ) {
    return new Error(
      "TypeSafe authentication failed; check the TYPESAFE_API_KEY environment variable",
    );
  }
  if (error instanceof RateLimitError) {
    return new Error("TypeSafe rate limit was exceeded after retries");
  }
  if (error instanceof UnprocessableEntityError) {
    return new Error("TypeSafe rejected the evaluation request as invalid");
  }
  return new Error("TypeSafe evaluation failed");
}

/** Register Jev as a structured semantic-judgment tool for Pi. */
export function registerTypeSafeAiExtension(
  pi: ExtensionAPI,
  evaluate: TypeSafeEvaluate = evaluateTypeSafeRequest,
): void {
  pi.registerTool({
    name: "typesafe_evaluate",
    label: "Evaluate with Jev",
    description:
      "Send state and independent Choice, Score, or Noul questions to TypeSafe's Jev model. This paid external API returns typed judgments and probabilities; it does not generate text or perform deterministic calculations.",
    promptSnippet:
      "Ask TypeSafe Jev for narrow typed semantic judgments over supplied state",
    promptGuidelines: [
      "Use typesafe_evaluate when the TypeSafe skill identifies a narrow semantic judgment that should return a Choice, Score, or Noul answer.",
      "Do not use typesafe_evaluate for arithmetic, exact parsing, code generation, or multi-step reasoning.",
      "Never send credentials, secrets, or unrelated private data through typesafe_evaluate.",
    ],
    parameters: typeSafeEvaluationToolParameters,
    async execute(_toolCallId, params, signal) {
      try {
        const request = buildTypeSafeEvaluationRequest(params);
        const result = await evaluate(
          request,
          signal === undefined ? {} : { signal },
        );
        const serializedResult = JSON.stringify(result, null, 2);
        const truncatedResult = truncateHead(serializedResult, {
          maxBytes: DEFAULT_MAX_BYTES,
          maxLines: DEFAULT_MAX_LINES,
        });
        const truncationNotice = truncatedResult.truncated
          ? "\n\n[TypeSafe result truncated; submit fewer questions to retrieve every answer.]"
          : "";
        return {
          content: [
            {
              type: "text",
              text: `${truncatedResult.content}${truncationNotice}`,
            },
          ],
          details: {
            model: result.model,
            inputTokens: result.usage.input_tokens,
            outputTokens: result.usage.output_tokens,
            questionCount: Object.keys(result.answers).length,
            truncated: truncatedResult.truncated,
          },
        };
      } catch (error: unknown) {
        throw safeTypeSafeToolError(error, signal);
      }
    },
  });
}

/** Load the TypeSafe Jev evaluation tool into Pi. */
export default function typeSafeAiExtension(pi: ExtensionAPI): void {
  registerTypeSafeAiExtension(pi);
}
