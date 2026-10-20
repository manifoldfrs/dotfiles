import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { XAI_API_BASE_URL, type XaiAuthRegistry } from "./xai-auth.ts";
import type { FetchLike } from "./xai-client.ts";
import { loadStubbedEntry } from "./xai-entry-stub.ts";
import { boundRunnerParams, parseRunnerArgs, runRunner, type RunnerDeps } from "./xai-runner.ts";

const FAKE_TOKEN = "fake-oauth-access-token";

function fakeRegistry(storedType: "oauth" | "api_key") {
  const calls = { getProviderAuth: 0 };
  const registry = {
    getRegisteredNativeProvider: () => undefined,
    getRegisteredProviderConfig: () => undefined,
    getProvider: () => ({
      baseUrl: XAI_API_BASE_URL,
      auth: { oauth: { isSubscription: true } },
      getModels: () => [{ provider: "xai", id: "grok-4.5" }],
    }),
    getProviderAuthStatus: () => ({ configured: true, source: "stored" }),
    isUsingOAuth: () => storedType === "oauth",
    async getProviderAuth() {
      calls.getProviderAuth += 1;
      return { auth: { apiKey: FAKE_TOKEN }, source: "OAuth" };
    },
  } as unknown as XaiAuthRegistry;
  return { registry, calls };
}

// Exercises the real index.ts entry through the same loader path the CLI uses, with Pi's API stubbed.
function harness(params: unknown, storedType: "oauth" | "api_key" = "oauth") {
  const { registry, calls } = fakeRegistry(storedType);
  const state = {
    registriesCreated: 0,
    networkFetches: [] as { url: string; init: RequestInit }[],
    output: "",
    errors: [] as string[],
  };
  const networkFetch: FetchLike = async (url, init) => {
    state.networkFetches.push({ url, init });
    return new Response(
      JSON.stringify({ output: [], usage: { server_side_tool_usage_details: { x_search_calls: 2, x_posts_fetched: 9 } } }),
      { status: 200 },
    );
  };
  const deps: RunnerDeps = {
    readFile: async () => JSON.stringify(params),
    writeOutput: async (text) => {
      state.output += text;
    },
    writeError: (text) => state.errors.push(text),
    loadEntry: () => loadStubbedEntry(mkdtempSync(join(tmpdir(), "xai-runner-"))),
    createRegistry: async () => {
      state.registriesCreated += 1;
      return registry;
    },
    fetch: networkFetch,
    installFetch(fetch) {
      const original = globalThis.fetch;
      globalThis.fetch = fetch as typeof globalThis.fetch;
      return () => {
        globalThis.fetch = original;
      };
    },
  };
  return { deps, state, calls };
}

const digestParams = { query: "AI developer tool releases", from_date: "2026-10-14", to_date: "2026-10-16" };

const expectedBody = {
  model: "grok-4.5",
  input: [{ role: "user", content: "AI developer tool releases" }],
  tools: [
    {
      type: "x_search",
      from_date: "2026-10-14",
      to_date: "2026-10-16",
      enable_image_understanding: false,
      enable_video_understanding: false,
    },
  ],
  store: false,
  max_turns: 4,
  max_output_tokens: 3000,
};

test("schema reports the freshly registered tool's limit parameters", async () => {
  const { deps, state } = harness(undefined);
  assert.equal(await runRunner(["--schema"], deps), 0);

  const output = JSON.parse(state.output);
  assert.equal(output.tool, "xai_search");
  assert.ok(output.parameters.includes("max_turns"));
  assert.ok(output.parameters.includes("max_output_tokens"));
  assert.equal(state.registriesCreated, 0);
});

test("dry-run runs the registered execute with placeholder auth and no live request", async () => {
  const { deps, state, calls } = harness(digestParams);
  const original = globalThis.fetch;
  assert.equal(await runRunner(["--dry-run", "--params", "digest.json"], deps), 0);

  assert.deepEqual(JSON.parse(state.output), {
    dryRun: true,
    liveRequest: false,
    url: "https://api.x.ai/v1/responses",
    body: expectedBody,
    redirect: "error",
  });
  assert.equal(state.registriesCreated, 0);
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(state.networkFetches.length, 0);
  assert.equal(state.output.includes("dry-run-placeholder"), false);
  assert.equal(globalThis.fetch, original);
});

test("run sends the same bounded body once through the registered execute", async () => {
  const { deps, state, calls } = harness(digestParams);
  assert.equal(await runRunner(["--params", "digest.json"], deps), 0);

  assert.equal(state.networkFetches.length, 1);
  assert.equal(state.networkFetches[0]?.url, "https://api.x.ai/v1/responses");
  assert.deepEqual(JSON.parse(String(state.networkFetches[0]?.init.body)), expectedBody);
  assert.equal(calls.getProviderAuth, 1);
  const output = JSON.parse(state.output);
  assert.deepEqual(output.details.xSearchUsage, { x_search_calls: 2, x_posts_fetched: 9 });
  assert.match(output.text, /X search usage: x_search_calls=2, x_posts_fetched=9/);
  assert.equal(state.output.includes(FAKE_TOKEN), false);
});

test("interactive mode preserves Pi tool parameters without a live request", async () => {
  const params = { ...digestParams, max_turns: 6, max_output_tokens: 4000, enable_image_understanding: false, enable_video_understanding: true };
  const { deps, state, calls } = harness(params);
  assert.equal(await runRunner(["--interactive", "--dry-run", "--params", "interactive.json"], deps), 0);
  assert.deepEqual(JSON.parse(state.output).body, {
    ...expectedBody,
    tools: [{ ...expectedBody.tools[0], enable_video_understanding: true }],
    max_turns: 6,
    max_output_tokens: 4000,
  });
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(state.networkFetches.length, 0);
});

test("interactive mode retains the subscription auth guard", async () => {
  const { deps, state, calls } = harness(digestParams, "api_key");
  assert.equal(await runRunner(["--interactive", "--params", "interactive.json"], deps), 1);
  assert.match(state.errors[0] ?? "", /not an OAuth sign-in/);
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(state.networkFetches.length, 0);
});

test("check uses provider metadata only", async () => {
  const oauth = harness(undefined);
  assert.equal(await runRunner(["--check"], oauth.deps), 0);
  assert.deepEqual(JSON.parse(oauth.state.output), { eligible: true, credentialResolved: false });
  assert.equal(oauth.calls.getProviderAuth, 0);
  assert.equal(oauth.state.networkFetches.length, 0);

  const apiKey = harness(undefined, "api_key");
  assert.equal(await runRunner(["--check"], apiKey.deps), 1);
  assert.match(apiKey.state.errors[0] ?? "", /not an OAuth sign-in/);
});

test("a stored API key stops a run before credential resolution or fetch", async () => {
  const { deps, state, calls } = harness(digestParams, "api_key");
  assert.equal(await runRunner(["--params", "digest.json"], deps), 1);
  assert.match(state.errors[0] ?? "", /not an OAuth sign-in/);
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(state.networkFetches.length, 0);
});

test("params cannot loosen the runner bounds", () => {
  assert.deepEqual(boundRunnerParams({ query: "q", max_turns: 4 }), {
    query: "q",
    max_turns: 4,
    max_output_tokens: 3000,
    enable_image_understanding: false,
    enable_video_understanding: false,
  });
  for (const loosened of [{ max_turns: 10 }, { max_output_tokens: 8000 }, { enable_image_understanding: true }]) {
    assert.throws(() => boundRunnerParams({ query: "q", ...loosened }), /The runner always sends/);
  }
  assert.throws(() => boundRunnerParams([]), /JSON object/);
  assert.throws(() => boundRunnerParams({}), /string query/);
});

test("arguments are parsed strictly", async () => {
  assert.deepEqual(parseRunnerArgs(["--params", "p.json", "--out", "o.json"]), {
    mode: "run",
    paramsPath: "p.json",
    outPath: "o.json",
  });
  assert.deepEqual(parseRunnerArgs(["--check"]), { mode: "check" });
  assert.deepEqual(parseRunnerArgs(["--schema"]), { mode: "schema" });
  assert.throws(() => parseRunnerArgs([]), /--params is required/);
  assert.throws(() => parseRunnerArgs(["--params"]), /needs a file path/);
  assert.throws(() => parseRunnerArgs(["--check", "--params", "p.json"]), /takes no other arguments/);
  assert.throws(() => parseRunnerArgs(["--schema", "--check"]), /takes no other arguments/);
  assert.throws(() => parseRunnerArgs(["--live"]), /Unknown argument/);

  const { deps, state } = harness(digestParams);
  assert.equal(await runRunner(["--bogus"], deps), 2);
  assert.equal(state.networkFetches.length, 0);
  assert.equal(state.registriesCreated, 0);
});

test("invalid params fail before auth or fetch", async () => {
  const { deps, state, calls } = harness({ ...digestParams, to_date: "2026-10-14" });
  assert.equal(await runRunner(["--params", "digest.json"], deps), 1);
  assert.match(state.errors[0] ?? "", /to_date is exclusive/);
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(state.networkFetches.length, 0);
});
