import assert from "node:assert/strict"
import test from "node:test"
import typeSafePlugin, { createTypeSafePlugin } from "./index.ts"
import type { Info, ToolContext } from "@opencode/plugin/promise/tool"
import type { SessionContext } from "@opencode/plugin/promise/session"
import {
  buildTypeSafeEvaluationRequest,
  TypeSafeToolInputError,
  type TypeSafeEvaluate,
} from "./typesafe.ts"

async function registerFixtureTool(evaluate: TypeSafeEvaluate): Promise<Info> {
  const tools: Info[] = []
  // SAFETY: setup only uses these tool-transform and session-hook fixture methods.
  await createTypeSafePlugin(evaluate).setup({
    tool: {
      transform: async (register: (editor: { add(tool: Info): void }) => void) =>
        register({ add: (tool) => tools.push(tool) }),
    },
    session: { hook: async () => {} },
  } as never)
  const tool = tools[0]
  assert.ok(tool)
  return tool
}

test("plugin registers the TypeSafe tool", async () => {
  const toolNames: string[] = []
  await typeSafePlugin.setup({
    tool: {
      transform: async (
        register: (editor: { add(tool: { name: string }): void }) => void,
      ) => register({ add: (tool) => toolNames.push(tool.name) }),
    },
    session: { hook: async () => {} },
  } as never)

  assert.deepEqual(toolNames, ["typesafe_evaluate"])
})

test("plugin keeps Jev visible and adds guidance once per Code Mode request", async () => {
  const tools: Info[] = []
  const hooks: Array<(event: SessionContext) => void | Promise<void>> = []
  await typeSafePlugin.setup({
    tool: {
      transform: async (register: (editor: { add(tool: Info): void }) => void) =>
        register({ add: (tool) => tools.push(tool) }),
    },
    session: {
      hook: async (name: string, hook: (event: SessionContext) => void) => {
        assert.equal(name, "context")
        hooks.push(hook)
      },
    },
  } as never)

  assert.equal(tools[0]?.options?.pinned, true)
  assert.equal(hooks.length, 1)
  // SAFETY: this fixture supplies every context field the registered hook reads.
  const event = {
    system: [{ type: "text", text: "Catalog: tools.typesafe_evaluate(input)" }],
    tools: { execute: { description: "Run a script", input: {} } },
  } as unknown as SessionContext
  for (const hook of hooks) await hook(event)
  for (const hook of hooks) await hook(event)
  assert.equal(event.system.length, 2)
  const guidance = event.system[1]
  assert.ok(guidance?.type === "text")
  assert.match(guidance.text, /specialized Jev tool/)
  assert.match(guidance.text, /exact tool path and signature/)
  assert.match(guidance.text, /no JSON.parse/)
  assert.match(guidance.text, /probability, not a boolean/)
  assert.doesNotMatch(guidance.text, /verification|screening|completion|arithmetic|secrets/)

  // A fresh outgoing context after compaction must receive the same guidance.
  event.system.splice(1)
  for (const hook of hooks) await hook(event)
  assert.equal(event.system.length, 2)

  delete event.tools.execute
  event.system.splice(1)
  for (const hook of hooks) await hook(event)
  assert.equal(event.system.length, 1)

  event.tools.execute = { description: "Run a script", input: {} }
  event.system[0] = { type: "text", text: "Catalog: other tools only" }
  for (const hook of hooks) await hook(event)
  assert.equal(event.system.length, 1)
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

test("script callers receive structured Choice, Score, and Noul answers", async () => {
  const fixture = {
    model: "fixture-jev",
    answers: {
      urgent: { type: "noul" as const, noul: 0.9 },
      owner: {
        type: "choice" as const,
        choice: "engineering",
        confidence: 0.8,
        probabilities: { product: 0.2, engineering: 0.8 },
      },
      risk: {
        type: "score" as const,
        score: 1.6,
        confidence: 0.7,
        legend: { "0": "low", "1": "medium", "2": "high" },
        probabilities: { "0": 0.1, "1": 0.2, "2": 0.7 },
      },
    },
    usage: { input_tokens: 100, output_tokens: 20 },
  }
  const controller = new AbortController()
  let calls = 0
  const tool = await registerFixtureTool(async (request, options) => {
    calls++
    assert.deepEqual(Object.keys(request.questions), ["urgent", "owner", "risk"])
    assert.equal(options.signal, controller.signal)
    return fixture
  })
  assert.ok(tool.output)
  assert.equal(calls, 0)
  // SAFETY: the executor only reads signal from this tool-context fixture.
  const context = { signal: controller.signal } as unknown as ToolContext
  const result = await tool.execute({
    state: "Please fix this today",
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
  }, context)
  assert.equal(calls, 1)
  assert.deepEqual(result.output, fixture)
  assert.ok(typeof result.content === "string")
  assert.deepEqual(JSON.parse(result.content), fixture)
  assert.deepEqual(result.metadata, {
    model: "fixture-jev",
    inputTokens: 100,
    outputTokens: 20,
    questionCount: 3,
  })
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

test("tool rejects missing provider answers instead of returning an empty success", async () => {
  const tool = await registerFixtureTool(async () => ({
    model: "fixture-jev",
    answers: {},
    usage: { input_tokens: 10, output_tokens: 2 },
  }))
  await assert.rejects(
    tool.execute({
      state: "A ticket",
      noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
    }, {} as ToolContext),
    /TypeSafe returned an invalid evaluation response/,
  )
})

test("tool rejects malformed answers and invalid usage without exposing the payload", async () => {
  const base = {
    model: "fixture-jev",
    answers: { urgent: { type: "noul", noul: 0.9 } },
    usage: { input_tokens: 10, output_tokens: 2 },
  }
  const responses: unknown[] = [
    null,
    { ...base, model: "" },
    { ...base, answers: { urgent: { type: "noul", noul: 1.1 } } },
    { ...base, answers: { urgent: { type: "noul", noul: Number.NaN } } },
    { ...base, answers: { urgent: { type: "choice", choice: "yes" } } },
    { ...base, answers: { unexpected: { type: "noul", noul: 0.9 } } },
    { ...base, usage: { input_tokens: -1, output_tokens: 2 } },
    { ...base, usage: { input_tokens: 10, output_tokens: 2.5 } },
  ]
  for (const response of responses) {
    const tool = await registerFixtureTool(async () => response)
    await assert.rejects(
      tool.execute({
        state: "A ticket",
        noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
      }, {} as ToolContext),
      { message: "TypeSafe returned an invalid evaluation response" },
    )
  }
})

test("tool preserves provider failures as safe errors", async () => {
  const tool = await registerFixtureTool(async () => {
    throw new Error("private-provider-detail")
  })
  await assert.rejects(
    tool.execute({
      state: "A ticket",
      noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
    }, {} as ToolContext),
    { message: "TypeSafe evaluation failed" },
  )
})

test("tool makes no provider call for cancelled or invalid requests", async () => {
  let calls = 0
  const tool = await registerFixtureTool(async () => { calls++ })
  const controller = new AbortController()
  controller.abort()
  // SAFETY: the fixture supplies the runtime signal absent from the older plugin declarations.
  const context = { signal: controller.signal } as unknown as ToolContext
  await assert.rejects(
    tool.execute({
      state: "A ticket",
      noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
    }, context),
    { message: "TypeSafe evaluation was cancelled" },
  )
  await assert.rejects(
    tool.execute({ state: "A ticket" }, {} as ToolContext),
    { message: "TypeSafe evaluation requires at least one question" },
  )
  assert.equal(calls, 0)
})

test("tool discards a provider result if the request was cancelled while awaiting it", async () => {
  const controller = new AbortController()
  const tool = await registerFixtureTool(async () => {
    controller.abort()
    return {
      model: "fixture-jev",
      answers: { urgent: { type: "noul", noul: 0.9 } },
      usage: { input_tokens: 10, output_tokens: 2 },
    }
  })
  // SAFETY: the fixture supplies the runtime signal absent from the older plugin declarations.
  const context = { signal: controller.signal } as unknown as ToolContext
  await assert.rejects(tool.execute({
    state: "A ticket",
    noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
  }, context), { message: "TypeSafe evaluation was cancelled" })
})

test("tool validates Choice and Score labels, probability keys, and ranges", async () => {
  const owner = {
    type: "choice",
    choice: "engineering",
    confidence: 0.8,
    probabilities: { product: 0.2, engineering: 0.8 },
  }
  const risk = {
    type: "score",
    score: 0.8,
    confidence: 0.7,
    legend: { "0": "low", "1": "high" },
    probabilities: { "0": 0.2, "1": 0.8 },
  }
  const invalidAnswers = [
    { owner: { ...owner, choice: "unknown" }, risk },
    { owner: { ...owner, probabilities: { product: 1 } }, risk },
    { owner, risk: { ...risk, score: 2 } },
    { owner, risk: { ...risk, legend: { "0": "low" } } },
    { owner, risk: { ...risk, legend: { "0": "high", "1": "low" } } },
    { owner, risk: { ...risk, confidence: Number.NaN } },
  ]
  for (const answers of invalidAnswers) {
    const tool = await registerFixtureTool(async () => ({
      model: "fixture-jev",
      answers,
      usage: { input_tokens: 10, output_tokens: 2 },
    }))
    await assert.rejects(tool.execute({
      state: "A ticket",
      choice_questions: [{
        id: "owner",
        instructions: "Who should own this?",
        options: [{ label: "product" }, { label: "engineering" }],
      }],
      score_questions: [{ id: "risk", instructions: "How risky?", levels: ["low", "high"] }],
    }, {} as ToolContext), { message: "TypeSafe returned an invalid evaluation response" })
  }
})

test("tool returns only declared answer fields and usage metadata", async () => {
  const tool = await registerFixtureTool(async () => ({
    model: "fixture-jev",
    answers: { urgent: { type: "noul", noul: 0.9, provider_debug: "private-detail" } },
    usage: { input_tokens: 10, output_tokens: 2, provider_debug: "private-detail" },
    provider_debug: "private-detail",
  }))
  const result = await tool.execute({
    state: "A ticket",
    noul_questions: [{ id: "urgent", instructions: "Is this urgent?" }],
  }, {} as ToolContext)
  assert.deepEqual(result.output, {
    model: "fixture-jev",
    answers: { urgent: { type: "noul", noul: 0.9 } },
    usage: { input_tokens: 10, output_tokens: 2 },
  })
  assert.ok(typeof result.content === "string")
  assert.doesNotMatch(result.content, /private-detail/)
})
