import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  resolveGuardedXaiRuntime,
  XAI_API_BASE_URL,
  XaiBearerToken,
  type XaiAuthRegistry,
} from "./xai-auth.ts";
import { postXaiSearch, type FetchLike } from "./xai-client.ts";
import { loadXaiSearchConfig, parseXaiSearchConfig, type XaiSearchConfig } from "./xai-config.ts";
import { formatXaiSearchResponse, readXSearchUsage } from "./xai-format.ts";
import { buildXaiSearchRequest } from "./xai-request.ts";
import { runXaiSearch, XAI_SEARCH_DISABLED_MESSAGE } from "./xai-search.ts";

const FAKE_TOKEN = "fake-oauth-access-token";

interface RegistryOptions {
  nativeOverride?: boolean;
  configOverride?: boolean;
  providerMissing?: boolean;
  providerBaseUrl?: string;
  isSubscription?: boolean;
  storedType?: "oauth" | "api_key";
  status?: { configured: boolean; source?: string };
  resolution?: { auth: { apiKey?: string; baseUrl?: string }; source?: string } | undefined;
  resolveError?: Error;
}

function fakeRegistry(options: RegistryOptions = {}) {
  const calls = { getProviderAuth: 0 };
  const resolution =
    "resolution" in options ? options.resolution : { auth: { apiKey: FAKE_TOKEN }, source: "OAuth" };
  const registry = {
    getRegisteredNativeProvider: () => (options.nativeOverride ? {} : undefined),
    getRegisteredProviderConfig: () => (options.configOverride ? {} : undefined),
    getProvider: () =>
      options.providerMissing
        ? undefined
        : {
            id: "xai",
            baseUrl: options.providerBaseUrl ?? XAI_API_BASE_URL,
            auth: { oauth: { isSubscription: options.isSubscription ?? true } },
            getModels: () => [{ provider: "xai", id: "grok-4.5" }],
          },
    isUsingOAuth: (model: { provider: string }) => model.provider === "xai" && (options.storedType ?? "oauth") === "oauth",
    getProviderAuthStatus: () => options.status ?? { configured: true, source: "stored" },
    async getProviderAuth() {
      calls.getProviderAuth += 1;
      if (options.resolveError) throw options.resolveError;
      return resolution;
    },
  } as unknown as XaiAuthRegistry;
  return { registry, calls };
}

function recordingFetch(response: () => Response = () => okResponse({ output: [] })) {
  const requests: { url: string; init: RequestInit }[] = [];
  const fetch: FetchLike = async (url, init) => {
    requests.push({ url, init });
    return response();
  };
  return { fetch, requests };
}

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

const enabledConfig: XaiSearchConfig = { enabled: true, model: "grok-4.5", warnings: [] };

test("OAuth subscription sign-in resolves to the fixed first-party endpoint", async () => {
  const { registry } = fakeRegistry();
  const runtime = await resolveGuardedXaiRuntime(registry);

  assert.equal(runtime.baseUrl, "https://api.x.ai/v1");
  assert.equal(runtime.bearer.reveal(), FAKE_TOKEN);
  assert.equal(JSON.stringify(runtime).includes(FAKE_TOKEN), false);
  assert.equal(String(runtime.bearer), "[redacted]");
});

test("stored API-key sign-in is rejected before resolution", async () => {
  const { registry, calls } = fakeRegistry({ storedType: "api_key" });
  await assert.rejects(resolveGuardedXaiRuntime(registry), /not an OAuth sign-in/);
  assert.equal(calls.getProviderAuth, 0);
});

test("a non-OAuth resolution source is rejected even if metadata says OAuth", async () => {
  const { registry } = fakeRegistry({ resolution: { auth: { apiKey: "xai-key" }, source: "xAI API key" } });
  await assert.rejects(resolveGuardedXaiRuntime(registry), /not subscription OAuth/);
});

test("environment, runtime, and models.json credentials are rejected before resolution", async () => {
  for (const source of ["environment", "runtime", "models_json_key", "models_json_command", "fallback"]) {
    const { registry, calls } = fakeRegistry({ status: { configured: true, source } });
    await assert.rejects(resolveGuardedXaiRuntime(registry), /not a stored subscription sign-in/);
    assert.equal(calls.getProviderAuth, 0, source);
  }
});

test("missing and unknown credential sources are rejected", async () => {
  const unconfigured = fakeRegistry({ status: { configured: false } });
  await assert.rejects(resolveGuardedXaiRuntime(unconfigured.registry), /No xAI sign-in found/);
  assert.equal(unconfigured.calls.getProviderAuth, 0);

  const unknownStatus = fakeRegistry({ status: { configured: true } });
  await assert.rejects(resolveGuardedXaiRuntime(unknownStatus.registry), /an unknown source/);

  const noResolution = fakeRegistry({ resolution: undefined });
  await assert.rejects(resolveGuardedXaiRuntime(noResolution.registry), /No xAI sign-in found/);

  const unknownResolution = fakeRegistry({ resolution: { auth: { apiKey: FAKE_TOKEN } } });
  await assert.rejects(resolveGuardedXaiRuntime(unknownResolution.registry), /an unknown source, not subscription OAuth/);

  const emptyToken = fakeRegistry({ resolution: { auth: { apiKey: "  " }, source: "OAuth" } });
  await assert.rejects(resolveGuardedXaiRuntime(emptyToken.registry), /did not yield a bearer token/);
});

test("replaced, reconfigured, or non-subscription providers are rejected before resolution", async () => {
  const cases: [RegistryOptions, RegExp][] = [
    [{ nativeOverride: true }, /replaced or reconfigured/],
    [{ configOverride: true }, /replaced or reconfigured/],
    [{ providerMissing: true }, /unavailable/],
    [{ isSubscription: false }, /does not offer subscription OAuth/],
  ];
  for (const [options, message] of cases) {
    const { registry, calls } = fakeRegistry(options);
    await assert.rejects(resolveGuardedXaiRuntime(registry), message);
    assert.equal(calls.getProviderAuth, 0);
  }
});

test("endpoint overrides are rejected", async () => {
  for (const providerBaseUrl of ["https://proxy.example.com/v1", "https://api.x.ai/v1/", "http://api.x.ai/v1"]) {
    const { registry, calls } = fakeRegistry({ providerBaseUrl });
    await assert.rejects(resolveGuardedXaiRuntime(registry), /base URL is not https:\/\/api\.x\.ai\/v1/);
    assert.equal(calls.getProviderAuth, 0);
  }

  const resolvedOverride = fakeRegistry({
    resolution: { auth: { apiKey: FAKE_TOKEN, baseUrl: "https://proxy.example.com/v1" }, source: "OAuth" },
  });
  await assert.rejects(resolveGuardedXaiRuntime(resolvedOverride.registry), /base URL other than/);
});

test("credential resolution errors are not propagated", async () => {
  const { registry } = fakeRegistry({ resolveError: new Error(`refresh failed for token ${FAKE_TOKEN}`) });
  await assert.rejects(resolveGuardedXaiRuntime(registry), (error: Error) => {
    assert.equal(error.message.includes(FAKE_TOKEN), false);
    assert.equal(error.cause, undefined);
    assert.match(error.message, /Could not resolve the xAI subscription sign-in/);
    return true;
  });
});

test("search requests go only to the fixed endpoint with redirects disabled", async () => {
  const { fetch, requests } = recordingFetch();
  const runtime = { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(FAKE_TOKEN) } as const;
  await postXaiSearch(runtime, buildXaiSearchRequest({ query: "pi" }, "grok-4.5"), { fetch });

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, "https://api.x.ai/v1/responses");
  assert.equal(requests[0]?.init.redirect, "error");
  assert.deepEqual(requests[0]?.init.headers, {
    Authorization: `Bearer ${FAKE_TOKEN}`,
    "Content-Type": "application/json",
  });
});

test("redirects and foreign runtimes are refused", async () => {
  const redirectedFetch: FetchLike = async () => {
    const response = okResponse({});
    Object.defineProperty(response, "redirected", { value: true });
    return response;
  };
  const runtime = { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(FAKE_TOKEN) } as const;
  const request = buildXaiSearchRequest({ query: "pi" }, "grok-4.5");
  await assert.rejects(postXaiSearch(runtime, request, { fetch: redirectedFetch }), /redirected/);

  const rejectingFetch: FetchLike = async () => {
    throw new TypeError("fetch failed: unexpected redirect");
  };
  await assert.rejects(
    postXaiSearch(runtime, request, { fetch: rejectingFetch }),
    /failed before a response was received/,
  );

  const foreign = recordingFetch();
  const foreignRuntime = { baseUrl: "https://proxy.example.com/v1", bearer: new XaiBearerToken(FAKE_TOKEN) };
  await assert.rejects(
    postXaiSearch(foreignRuntime as never, request, { fetch: foreign.fetch }),
    /Refusing to send xAI credentials/,
  );
  assert.equal(foreign.requests.length, 0);
});

function assertNoToken(error: Error): true {
  assert.equal(error.message.includes(FAKE_TOKEN), false);
  assert.equal(error.cause, undefined);
  assert.equal(JSON.stringify(error).includes(FAKE_TOKEN), false);
  return true;
}

test("API and transport errors never expose the bearer token", async () => {
  const runtime = { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(FAKE_TOKEN) } as const;
  const request = buildXaiSearchRequest({ query: "pi" }, "grok-4.5");

  const echoing: FetchLike = async () =>
    new Response(`{"error":"bad token Bearer ${FAKE_TOKEN}"}`, { status: 401 });
  await assert.rejects(postXaiSearch(runtime, request, { fetch: echoing }), (error: Error) => {
    assert.equal(error.message, "xAI API error (401)");
    return assertNoToken(error);
  });

  const transport: FetchLike = async () => {
    throw new TypeError(`connect failed with Authorization: Bearer ${FAKE_TOKEN}`);
  };
  await assert.rejects(postXaiSearch(runtime, request, { fetch: transport }), (error: Error) => {
    assert.match(error.message, /failed before a response was received/);
    return assertNoToken(error);
  });

  const badJson: FetchLike = async () => new Response(`not json ${FAKE_TOKEN}`, { status: 200 });
  await assert.rejects(postXaiSearch(runtime, request, { fetch: badJson }), (error: Error) => {
    assert.match(error.message, /invalid JSON/);
    return assertNoToken(error);
  });
});

test("cancellation and timeouts are reported by category", async () => {
  const runtime = { baseUrl: XAI_API_BASE_URL, bearer: new XaiBearerToken(FAKE_TOKEN) } as const;
  const request = buildXaiSearchRequest({ query: "pi" }, "grok-4.5");
  const waitForAbort: FetchLike = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error(`aborted ${FAKE_TOKEN}`)), { once: true });
    });

  const controller = new AbortController();
  const cancelled = postXaiSearch(runtime, request, { fetch: waitForAbort, signal: controller.signal });
  controller.abort();
  await assert.rejects(cancelled, (error: Error) => {
    assert.equal(error.message, "xAI search was cancelled");
    return assertNoToken(error);
  });

  await assert.rejects(postXaiSearch(runtime, request, { fetch: waitForAbort, timeoutMs: 5 }), (error: Error) => {
    assert.equal(error.message, "xAI search timed out after 5ms");
    return assertNoToken(error);
  });
});

test("to_date is exclusive and passes through unchanged", () => {
  const oneDay = buildXaiSearchRequest({ query: "q", from_date: "2026-10-14", to_date: "2026-10-15" }, "m");
  assert.deepEqual(oneDay.xSearchTool, { type: "x_search", from_date: "2026-10-14", to_date: "2026-10-15" });

  const monthEnd = buildXaiSearchRequest({ query: "q", from_date: "2026-09-30", to_date: "2026-10-01" }, "m");
  assert.equal(monthEnd.xSearchTool.to_date, "2026-10-01");

  const openEnded = buildXaiSearchRequest({ query: "q", to_date: " 2026-10-15 " }, "m");
  assert.deepEqual(openEnded.xSearchTool, { type: "x_search", to_date: "2026-10-15" });

  assert.throws(
    () => buildXaiSearchRequest({ query: "q", from_date: "2026-10-14", to_date: "2026-10-14" }, "m"),
    /to_date is exclusive/,
  );
  assert.throws(
    () => buildXaiSearchRequest({ query: "q", from_date: "2026-10-15", to_date: "2026-10-14" }, "m"),
    /from_date must be before to_date/,
  );
  assert.throws(() => buildXaiSearchRequest({ query: "q", to_date: "2026-10-15T00:00:00Z" }, "m"), /YYYY-MM-DD/);
  assert.throws(() => buildXaiSearchRequest({ query: "q", to_date: "2026-02-30" }, "m"), /valid calendar date/);
});

test("nested X search usage counters are reported only when present", () => {
  const full = readXSearchUsage({
    usage: { server_side_tool_usage_details: { x_search_calls: 2, x_posts_fetched: 37, x_users_fetched: 0 } },
  });
  assert.deepEqual(full, { x_search_calls: 2, x_posts_fetched: 37, x_users_fetched: 0 });

  const partial = readXSearchUsage({ usage: { server_side_tool_usage_details: { x_posts_fetched: 5 } } });
  assert.deepEqual(partial, { x_posts_fetched: 5 });
  assert.equal("x_users_fetched" in partial, false);

  assert.deepEqual(readXSearchUsage({ server_side_tool_usage: { SERVER_SIDE_TOOL_X_SEARCH: 3 } }), {});
  assert.deepEqual(readXSearchUsage({ usage: { server_side_tool_usage_details: { x_posts_fetched: "5" } } }), {});

  const formatted = formatXaiSearchResponse({ usage: { input_tokens: 10 } }, "grok-4.5");
  assert.match(formatted.text, /X search usage: not reported by xAI/);
  assert.match(formatted.text, /Tokens: 10 in \/ not reported out/);
  assert.deepEqual(formatted.details.xSearchUsage, {});
});

test("responses format text, search calls, citations, and usage", () => {
  const formatted = formatXaiSearchResponse(
    {
      model: "grok-4.5",
      output: [
        { type: "custom_tool_call", name: "x_keyword_search", status: "completed" },
        { type: "custom_tool_call", name: "unrelated_tool" },
        {
          type: "message",
          content: [{ type: "output_text", text: "Answer", annotations: [{ url: "https://x.com/a/status/1" }] }],
        },
      ],
      usage: { input_tokens: 12, output_tokens: 3, server_side_tool_usage_details: { x_posts_fetched: 4 } },
    },
    "fallback",
  );

  assert.equal(formatted.details.searchCount, 1);
  assert.deepEqual(formatted.details.citations, ["https://x.com/a/status/1"]);
  assert.match(formatted.text, /- x_keyword_search \[completed\]/);
  assert.match(formatted.text, /X search usage: x_posts_fetched=4/);
});

test("disabled search never resolves credentials or fetches", async () => {
  const { registry, calls } = fakeRegistry();
  const { fetch, requests } = recordingFetch();
  await assert.rejects(
    runXaiSearch({ registry, config: { ...enabledConfig, enabled: false }, params: { query: "pi" }, fetch }),
    (error: Error) => error.message === XAI_SEARCH_DISABLED_MESSAGE,
  );
  assert.equal(calls.getProviderAuth, 0);
  assert.equal(requests.length, 0);
});

test("no fetch happens when validation or auth guards fail", async () => {
  const valid = fakeRegistry();
  const invalidParams = recordingFetch();
  await assert.rejects(
    runXaiSearch({ registry: valid.registry, config: enabledConfig, params: { query: "q", to_date: "bad" }, fetch: invalidParams.fetch }),
    /YYYY-MM-DD/,
  );
  assert.equal(invalidParams.requests.length, 0);
  assert.equal(valid.calls.getProviderAuth, 0);

  const apiKey = fakeRegistry({ resolution: { auth: { apiKey: "xai-key" }, source: "XAI_API_KEY" } });
  const guarded = recordingFetch();
  await assert.rejects(
    runXaiSearch({ registry: apiKey.registry, config: enabledConfig, params: { query: "q" }, fetch: guarded.fetch }),
    /not subscription OAuth/,
  );
  assert.equal(guarded.requests.length, 0);
});

test("enabled search with OAuth sends the exact request body", async () => {
  const { registry } = fakeRegistry();
  const { fetch, requests } = recordingFetch(() =>
    okResponse({ output: [], usage: { server_side_tool_usage_details: { x_search_calls: 1 } } }),
  );
  const result = await runXaiSearch({
    registry,
    config: enabledConfig,
    params: { query: " launch ", from_date: "2026-10-14", to_date: "2026-10-15", allowed_x_handles: ["@SpaceX"] },
    fetch,
  });

  assert.deepEqual(JSON.parse(String(requests[0]?.init.body)), {
    model: "grok-4.5",
    input: [{ role: "user", content: "launch" }],
    tools: [{ type: "x_search", from_date: "2026-10-14", to_date: "2026-10-15", allowed_x_handles: ["SpaceX"] }],
    store: false,
  });
  assert.deepEqual(result.details.xSearchUsage, { x_search_calls: 1 });
});

test("config enables search only for a literal true", async () => {
  assert.equal(parseXaiSearchConfig(undefined).enabled, false);
  assert.equal(parseXaiSearchConfig({ enabled: true }).enabled, true);

  const stringy = parseXaiSearchConfig({ enabled: "true" });
  assert.equal(stringy.enabled, false);
  assert.equal(stringy.warnings.length, 1);

  const dir = mkdtempSync(join(tmpdir(), "xai-search-config-"));
  assert.equal((await loadXaiSearchConfig(join(dir, "missing.json"))).enabled, false);

  const broken = join(dir, "broken.json");
  writeFileSync(broken, "{ not json");
  const loaded = await loadXaiSearchConfig(broken);
  assert.equal(loaded.enabled, false);
  assert.match(loaded.warnings[0] ?? "", /search stays disabled/);
});
