import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { XAI_SEARCH_DISABLED_MESSAGE } from "./xai-search.ts";

// The entry imports Pi and typebox, which only resolve inside Pi, so it is loaded through Pi's own jiti.
function piNodeModules(): string {
  const piPath = realpathSync(execFileSync("bash", ["-lc", "command -v pi"], { encoding: "utf8" }).trim());
  const marker = "/node_modules/";
  const index = piPath.lastIndexOf(marker, piPath.indexOf("/@earendil-works/"));
  assert.ok(index >= 0, `cannot locate node_modules for ${piPath}`);
  return piPath.slice(0, index + marker.length - 1);
}

async function loadEntry(agentDir: string) {
  const nodeModules = piNodeModules();
  const stubPath = join(agentDir, "pi-coding-agent-stub.mjs");
  writeFileSync(
    stubPath,
    [
      `export const getAgentDir = () => ${JSON.stringify(agentDir)};`,
      "export const truncateHead = (content) => ({ content, truncated: false, outputLines: 0, outputBytes: 0 });",
      "export const formatSize = (bytes) => `${bytes}B`;",
    ].join("\n"),
  );

  const { createJiti } = (await import(pathToFileURL(join(nodeModules, "jiti/lib/jiti.mjs")).href)) as {
    createJiti: (from: string, options: object) => { import: (id: string, options?: object) => Promise<unknown> };
  };
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    alias: {
      "@earendil-works/pi-coding-agent": stubPath,
      typebox: join(nodeModules, "typebox/build/index.mjs"),
    },
  });
  return (await jiti.import(new URL("./index.ts", import.meta.url).pathname, { default: true })) as (
    pi: unknown,
  ) => void;
}

interface Registered {
  tools: { name: string; execute: (...args: unknown[]) => Promise<{ content: { text: string }[] }> }[];
  commands: Map<string, { handler: (args: string, ctx: unknown) => Promise<void> }>;
}

async function register(agentDir: string): Promise<Registered> {
  const registered: Registered = { tools: [], commands: new Map() };
  const entry = await loadEntry(agentDir);
  entry({
    registerTool: (tool: Registered["tools"][number]) => registered.tools.push(tool),
    registerCommand: (name: string, command: { handler: (args: string, ctx: unknown) => Promise<void> }) =>
      registered.commands.set(name, command),
    on: () => undefined,
  });
  return registered;
}

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

test("disabled execute reaches neither credential resolution nor fetch", async () => {
  const registered = await register(mkdtempSync(join(tmpdir(), "xai-search-entry-")));
  const { ctx, calls } = fakeContext("oauth");

  await withFetchSpy(async (fetchCalls) => {
    await assert.rejects(
      registered.tools[0]!.execute("call-1", { query: "pi" }, undefined, undefined, ctx),
      (error: Error) => error.message === XAI_SEARCH_DISABLED_MESSAGE,
    );
    assert.equal(fetchCalls.length, 0);
  });
  assert.equal(calls.getProviderAuth, 0);
});

test("enabled execute sends one request to the fixed endpoint", async () => {
  const agentDir = mkdtempSync(join(tmpdir(), "xai-search-entry-"));
  writeFileSync(join(agentDir, "pi-xai-search.json"), JSON.stringify({ enabled: true }));
  const registered = await register(agentDir);
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
  assert.match(apiKey.notices.at(-1) ?? "", /xai_search: disabled \(billing not verified\)/);
  assert.match(apiKey.notices.at(-1) ?? "", /Auth: The stored xAI credential is not an OAuth sign-in/);

  const oauth = fakeContext("oauth");
  await status.handler("", oauth.ctx);
  assert.equal(oauth.calls.getProviderAuth, 0);
  assert.match(oauth.notices.at(-1) ?? "", /Auth: eligible: stored OAuth sign-in/);
});
