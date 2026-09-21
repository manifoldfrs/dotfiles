import assert from "node:assert/strict"
import test from "node:test"
import typeSafePlugin from "./index.ts"
import {
  buildTypeSafeEvaluationRequest,
  TypeSafeToolInputError,
} from "./typesafe.ts"

test("plugin registers the TypeSafe tool", async () => {
  const toolNames: string[] = []
  await typeSafePlugin.setup({
    tool: {
      transform: async (
        register: (editor: { add(tool: { name: string }): void }) => void,
      ) => register({ add: (tool) => toolNames.push(tool.name) }),
    },
  } as never)

  assert.deepEqual(toolNames, ["typesafe_evaluate"])
})

test("buildTypeSafeEvaluationRequest creates all supported question types", () => {
  const request = buildTypeSafeEvaluationRequest({
    state: { ticket: "Please fix this today" },
    noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
    choice_questions: [{
      id: "owner",
      instructions: "Who should own this?",
      options: [{ label: "product" }, { label: "engineering" }],
    }],
    score_questions: [{
      id: "risk",
      instructions: "How risky is this?",
      levels: ["low", "medium", "high"],
    }],
  })

  assert.deepEqual(Object.keys(request.questions), ["urgent", "owner", "risk"])
})

test("buildTypeSafeEvaluationRequest rejects duplicate IDs", () => {
  assert.throws(
    () => buildTypeSafeEvaluationRequest({
      state: "A ticket",
      noul_questions: [{ id: "route", instructions: "Route it?" }],
      score_questions: [{
        id: "route",
        instructions: "How strongly?",
        levels: ["low", "high"],
      }],
    }),
    TypeSafeToolInputError,
  )
})
