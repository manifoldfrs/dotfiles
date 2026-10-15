import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadStubbedEntry } from "./xai-entry-stub.ts";

const register = loadStubbedEntry;

function fakeContext(storedType: "oauth" | "api_key") {
  const calls = { getProviderAuth: 0 };
  const notices: string[] = [];
  const modelRegistry = {
    getRegisteredNativeProvider: () => undefined,
    getRegisteredProviderConfig: () => undefined,
    getProvider: () => ({
      baseUrl: "https://api.x.ai/v1",
      auth: { oauth: { isSubscription: true } },
      getModels: () => [{ provider: "xai", id: "grok-4.5" }],
    }),
    getProviderAuthStatus: () => ({ configured: true, source: "stored" }),
    isUsingOAuth: () => storedType === "oauth",
    async getProviderAuth() {
      calls.getProviderAuth += 1;
      return { auth: { apiKey: "fake-oauth-access-token" }, source: "OAuth" };
    },
  };
  const ui = { notify: (message: string) => notices.push(message) };
  return { ctx: { modelRegistry, ui }, calls, notices };
}

async function withFetchSpy<T>(run: (fetchCalls: string[]) => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  const fetchCalls: string[] = [];
  globalThis.fetch = (async (input: string) => {
    fetchCalls.push(String(input));
    return new Response(JSON.stringify({ output: [] }), { status: 200 });
  }) as typeof fetch;
  try {
    return await run(fetchCalls);
  } finally {
    globalThis.fetch = original;
  }
}

test("the entry registers exactly one xai_search tool and the /xai-search command", async () => {
  const registered = await register(mkdtempSync(join(tmpdir(), "xai-search-entry-")));

  assert.deepEqual(registered.tools.map((tool) => tool.name), ["xai_search"]);
  assert.deepEqual([...registered.commands.keys()], ["xai-search"]);
});

test("execute with a stored API key reaches neither credential resolution nor fetch", async () => {
  const registered = await register(mkdtempSync(join(tmpdir(), "xai-search-entry-")));
  const { ctx, calls } = fakeContext("api_key");

  await withFetchSpy(async (fetchCalls) => {
    await assert.rejects(
      registered.tools[0]!.execute("call-1", { query: "pi" }, undefined, undefined, ctx),
      /not an OAuth sign-in/,
    );
    assert.equal(fetchCalls.length, 0);
  });
  assert.equal(calls.getProviderAuth, 0);
});

test("execute without a config file sends one request to the fixed endpoint", async () => {
  const registered = await register(mkdtempSync(join(tmpdir(), "xai-search-entry-")));
  const { ctx, calls } = fakeContext("oauth");

  await withFetchSpy(async (fetchCalls) => {
    const result = await registered.tools[0]!.execute("call-1", { query: "pi" }, undefined, undefined, ctx);
    assert.deepEqual(fetchCalls, ["https://api.x.ai/v1/responses"]);
    assert.match(result.content[0]?.text ?? "", /X search usage: not reported by xAI/);
  });
  assert.equal(calls.getProviderAuth, 1);
});

test("status uses metadata only and labels stored API keys", async () => {
  const registered = await register(mkdtempSync(join(tmpdir(), "xai-search-entry-")));
  const status = registered.commands.get("xai-search")!;

  const apiKey = fakeContext("api_key");
  await withFetchSpy(async (fetchCalls) => {
    await status.handler("", apiKey.ctx);
    assert.equal(fetchCalls.length, 0);
  });
  assert.equal(apiKey.calls.getProviderAuth, 0);
  assert.doesNotMatch(apiKey.notices.at(-1) ?? "", /disabled|billing/);
  assert.match(apiKey.notices.at(-1) ?? "", /Auth: The stored xAI credential is not an OAuth sign-in/);

  const oauth = fakeContext("oauth");
  await status.handler("", oauth.ctx);
  assert.equal(oauth.calls.getProviderAuth, 0);
  assert.match(oauth.notices.at(-1) ?? "", /Auth: eligible: stored OAuth sign-in/);
});
