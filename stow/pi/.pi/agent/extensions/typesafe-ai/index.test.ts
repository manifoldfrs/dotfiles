import assert from "node:assert/strict";
import test from "node:test";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
  Questions,
  RequestOptions,
  SystemOneRequest,
  SystemOneResult,
} from "@typesafe-ai/sdk";

import {
  buildTypeSafeEvaluationRequest,
  registerTypeSafeAiExtension,
} from "./index.ts";

type CapturedTypeSafeTool = {
  readonly name: string;
  execute(
    toolCallId: string,
    params: {
      readonly state: string;
      readonly model?: string;
      readonly noul_questions?: ReadonlyArray<{
        readonly id: string;
        readonly instructions: string;
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
    },
    signal?: AbortSignal,
  ): Promise<{
    readonly content: ReadonlyArray<{ readonly type: string; readonly text: string }>;
    readonly details: {
      readonly model: string;
      readonly inputTokens: number;
      readonly outputTokens: number;
      readonly questionCount: number;
      readonly truncated: boolean;
    };
  }>;
};

function captureTypeSafeTool(
  evaluate: (
    request: SystemOneRequest,
    options: RequestOptions,
  ) => Promise<SystemOneResult<Questions>>,
): CapturedTypeSafeTool {
  let capturedTool: unknown;
  const recordingApi = {
    registerTool(tool: unknown) {
      capturedTool = tool;
    },
  };
  // SAFETY: registerTypeSafeAiExtension uses only registerTool; recordingApi implements that operation and records the definition for public-behavior tests.
  registerTypeSafeAiExtension(recordingApi as unknown as ExtensionAPI, evaluate);
  assert.equal(typeof capturedTool, "object");
  assert.notEqual(capturedTool, null);
  assert.equal(typeof (capturedTool as { execute?: unknown }).execute, "function");
  return capturedTool as CapturedTypeSafeTool;
}

test("buildTypeSafeEvaluationRequest creates all three question types", () => {
  const request = buildTypeSafeEvaluationRequest({
    state: { ticket: "Please fix this today" },
    model: "jev-1.13.0",
    noul_questions: [
      {
        id: "urgent",
        instructions: "Does the ticket express urgency?",
        yes_description: "The ticket is time-sensitive",
      },
    ],
    choice_questions: [
      {
        id: "team",
        instructions: "Which team should handle the ticket?",
        options: [
          { label: "billing", description: "Payment issues" },
          { label: "support" },
        ],
      },
    ],
    score_questions: [
      {
        id: "frustration",
        instructions: "How frustrated is the customer?",
        levels: ["Calm", "Frustrated", "Angry"],
      },
    ],
  });

  assert.equal(request.model, "jev-1.13.0");
  assert.deepEqual(request.questions.urgent, {
    type: "noul",
    instructions: "Does the ticket express urgency?",
    criteria: { true: "The ticket is time-sensitive" },
  });
  assert.deepEqual(request.questions.team, {
    type: "choice",
    instructions: "Which team should handle the ticket?",
    criteria: { billing: "Payment issues", support: null },
  });
  assert.deepEqual(request.questions.frustration, {
    type: "score",
    instructions: "How frustrated is the customer?",
    criteria: ["Calm", "Frustrated", "Angry"],
  });
});

test("buildTypeSafeEvaluationRequest rejects duplicate answer IDs", () => {
  assert.throws(
    () =>
      buildTypeSafeEvaluationRequest({
        state: "A ticket",
        noul_questions: [
          { id: "route", instructions: "Is this billing-related?" },
        ],
        score_questions: [
          {
            id: "route",
            instructions: "How urgent is this?",
            levels: ["Not urgent", "Urgent"],
          },
        ],
      }),
    /TypeSafe question ID is duplicated: route/,
  );
});

test("typesafe_evaluate sends the request with cancellation and returns typed results", async () => {
  let receivedRequest: SystemOneRequest | undefined;
  let receivedOptions: RequestOptions | undefined;
  const controller = new AbortController();
  const tool = captureTypeSafeTool(async (request, options) => {
    receivedRequest = request;
    receivedOptions = options;
    return {
      model: "jev-1.13.0",
      answers: {
        urgent: { type: "noul", noul: 0.97 },
      },
      usage: { input_tokens: 24, output_tokens: 3 },
    };
  });

  const result = await tool.execute(
    "tool-1",
    {
      state: "Please fix this today",
      noul_questions: [
        { id: "urgent", instructions: "Does this express urgency?" },
      ],
    },
    controller.signal,
  );

  assert.equal(tool.name, "typesafe_evaluate");
  assert.equal(receivedRequest?.state, "Please fix this today");
  assert.equal(receivedOptions?.signal, controller.signal);
  assert.match(result.content[0]?.text ?? "", /"noul": 0.97/);
  assert.deepEqual(result.details, {
    model: "jev-1.13.0",
    inputTokens: 24,
    outputTokens: 3,
    questionCount: 1,
    truncated: false,
  });
});

test("typesafe_evaluate does not expose dependency error details", async () => {
  const tool = captureTypeSafeTool(async () => {
    throw new Error("request failed with secret-token-value");
  });

  await assert.rejects(
    tool.execute("tool-2", {
      state: "A ticket",
      noul_questions: [
        { id: "urgent", instructions: "Does this express urgency?" },
      ],
    }),
    {
      message: "TypeSafe evaluation failed",
    },
  );
});
