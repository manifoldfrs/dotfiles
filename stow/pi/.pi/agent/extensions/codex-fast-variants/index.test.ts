import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { InMemoryCredentialStore, InMemoryModelsStore, normalizeContext, type Api, type AssistantMessage, type Model, type ModelsPublication, type OAuthCredential, type Provider, type SimpleStreamOptions } from "@earendil-works/pi-ai";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { getModels } from "@earendil-works/pi-ai/compat";
import {
	createAgentSession,
	generateSummaryWithUsage,
	ModelRuntime,
	SessionManager,
	SettingsManager,
	type ExtensionAPI,
	type ProviderConfig,
	type ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

import { createCodexTestAccessToken } from "./codex-fast-test-fixtures.ts";
import codexFastVariantsExtension, { createCodexFastVariantsExtension } from "./index.ts";

function requireOpenAIFastProvider(): Provider {
	let registered: Provider | undefined;
	const recordingApi = {
		registerProvider(provider: string | Provider) {
			if (typeof provider !== "string" && provider.id === "openai") registered = provider;
		},
	};
	// SAFETY: The extension factory only calls registerProvider, which this recorder implements.
	codexFastVariantsExtension(recordingApi as unknown as ExtensionAPI);
	assert.ok(registered, "extension must register the current OpenAI provider");
	return registered;
}

test("current OpenAI provider exposes Sol Fast and preserves authentication and classifiers", () => {
	const provider = requireOpenAIFastProvider();
	const builtIn = openaiProvider();
	const fastModel = provider.getModels().find((model) => model.id === "gpt-6.1-sol-fast");
	assert.ok(fastModel);
	assert.equal(fastModel.provider, "openai");
	assert.equal(fastModel.api, "openai-responses");
	assert.equal(fastModel.baseUrl, "https://api.openai.com/v1");
	assert.deepEqual(provider.getModels().filter((model) => model.id.endsWith("-fast")).map((model) => model.id).sort(), [
		"gpt-6-astra-fast",
		"gpt-6-luna-fast",
		"gpt-6-sol-fast",
		"gpt-6.1-sol-fast",
	]);
	assert.ok(!provider.getModels().some((model) => model.id === "gpt-6.1-astra-fast" || model.id === "gpt-6.1-luna-fast"));
	assert.ok(!provider.getAllModels?.().some((model) => model.type === "classifier" && model.id.endsWith("-fast")));
	assert.equal(provider.auth.oauth?.loginLabel, "Sign in with ChatGPT");
	assert.equal(provider.auth.oauth?.isSubscription, true);
	assert.equal(provider.auth.apiKey?.name, builtIn.auth.apiKey?.name);
	assert.equal(typeof provider.auth.oauth?.login, "function");
	assert.equal(typeof provider.auth.oauth?.refresh, "function");
	assert.ok(provider.auth.apiKey?.resolve);
	assert.ok(provider.classify);
	assert.ok(provider.getAllModels);
	assert.ok(builtIn.getAllModels);
	assert.ok(provider.getAllModels().some((model) => model.type === "classifier"));
	const oauth: OAuthCredential = { type: "oauth", access: "opaque-test-token", refresh: "test-refresh", expires: 0 };
	const available = provider.filterAllModels?.(provider.getAllModels(), oauth);
	assert.ok(available?.some((model) => model.id === "gpt-6.1-sol-fast"));
	assert.ok(available?.every((model) => model.type !== "classifier"));
	for (const model of builtIn.getAllModels()) {
		assert.deepEqual(provider.getAllModels().find((candidate) => candidate.id === model.id && candidate.type === model.type), model);
	}
});

test("OpenAI Fast streams use the real Responses API with priority and preserve caller hooks", async () => {
	const provider = requireOpenAIFastProvider();
	const fastModel = provider.getModels().find((model) => model.id === "gpt-6.1-sol-fast");
	const standardModel = provider.getModels().find((model) => model.id === "gpt-6.1-sol");
	assert.ok(fastModel && standardModel);
	const models = provider.getModels().filter((model) => /^gpt-6(?:\.1)?-(?:sol|astra|luna)(?:-fast)?$/.test(model.id));
	const cases = models.flatMap((model) =>
		["simple", "raw", "compaction"].map((mode) => ({ model, mode })),
	);
	for (const { model, mode } of cases) {
		let requests = 0;
		let responses = 0;
		const options: SimpleStreamOptions = {
			apiKey: "opaque-test-token",
			onPayload(payload) {
				assert.ok(typeof payload === "object" && payload !== null);
				return { ...payload, metadata: { caller: "preserved" } };
			},
			onResponse() { responses++; },
			fetch: async (input, init) => {
				requests++;
				assert.equal(input.toString(), "https://api.openai.com/v1/responses");
				assert.equal(new Headers(init?.headers).get("authorization"), "Bearer opaque-test-token");
				assert.equal(new Headers(init?.headers).get("x-codex-routing-hint"), null);
				assert.equal(typeof init?.body, "string");
				const payload: unknown = JSON.parse(String(init?.body));
				assert.ok(typeof payload === "object" && payload !== null && "model" in payload && "metadata" in payload);
				assert.equal(payload.model, model.id.replace(/-fast$/, ""));
				assert.deepEqual(payload.metadata, { caller: "preserved" });
				assert.equal("service_tier" in payload ? payload.service_tier : undefined, model.id.endsWith("-fast") ? "priority" : undefined);
				return completedResponse();
			},
		};
		if (mode === "compaction") {
			const summary = await generateSummaryWithUsage(
				[{ role: "user", content: "Summarize this", timestamp: 1 }],
				model, 1_000, "opaque-test-token", undefined, new AbortController().signal,
				undefined, undefined, "off",
				(requestModel, context, summaryOptions) => provider.streamSimple(requestModel, normalizeContext(context), { ...summaryOptions, ...options }),
			);
			assert.equal(summary.usage.totalTokens, 2);
		} else {
			const stream = mode === "simple" ? provider.streamSimple : provider.stream;
			const result = await stream(model, normalizeContext({ messages: [] }), options).result();
			assert.equal(result.stopReason, "stop");
			assert.equal(result.model, model.id);
		}
		assert.equal(requests, 1);
		assert.equal(responses, 1);
	}
});

function completedResponse(): Response {
	return new Response('data: {"type":"response.completed","response":{"id":"resp_test","status":"completed","output":[],"usage":{"input_tokens":1,"output_tokens":1,"total_tokens":2},"service_tier":"priority"}}\n\n', {
		headers: { "content-type": "text/event-stream" },
	});
}

test("bundled Pi loads GPT-6 and GPT-6.1 Fast models without a local node_modules directory", () => {
	const directory = mkdtempSync(join(tmpdir(), "pi-fast-loader-test-"));
	try {
		for (const name of readdirSync(import.meta.dirname)) {
			if (name.endsWith(".ts") || name === "package.json") {
				copyFileSync(join(import.meta.dirname, name), join(directory, name));
			}
		}
		const cli = fileURLToPath(new URL("./bundle/cli.js", import.meta.resolve("@earendil-works/pi-coding-agent")));
		const output = execFileSync(process.execPath, [cli, "--extension", join(directory, "index.ts"), "--list-models", "gpt-6"], {
			cwd: directory,
			env: { ...process.env, OPENAI_API_KEY: "sk-inert-test-key", PI_CODING_AGENT_DIR: join(directory, "config"), PI_OFFLINE: "1", PI_SKIP_VERSION_CHECK: "1", PI_TELEMETRY: "0" },
			encoding: "utf8",
			timeout: 20_000,
		});
		assert.match(output, /openai\s+gpt-6-sol-fast\s/);
		assert.match(output, /openai\s+gpt-6-astra-fast\s/);
		assert.match(output, /openai\s+gpt-6-luna-fast\s/);
		assert.match(output, /openai\s+gpt-6\.1-sol-fast\s/);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

for (const fastModelId of ["gpt-6-sol-fast", "gpt-6-astra-fast", "gpt-6-luna-fast", "gpt-6.1-sol-fast"]) {
	test(`${fastModelId} preserves model endpoint, headers, output cap and sampling overrides`, async () => {
		const provider = requireOpenAIFastProvider();
		const fastModel = provider.getModels().find((model) => model.id === fastModelId);
		assert.ok(fastModel);
		for (const stream of [provider.stream, provider.streamSimple]) {
			const model: Model<Api> = { ...fastModel, baseUrl: "https://configured-proxy.example/v1", maxTokens: 64, headers: { "x-test-model-header": "preserved" }, samplingParams: { top_p: 0.5 } };
			let requests = 0;
			let observed: { url: string; headers: Headers; payload: unknown } | undefined;
			const response: AssistantMessage = await stream(model, normalizeContext({ messages: [] }), {
				apiKey: "sk-inert-test-key",
				...(stream === provider.stream ? { maxTokens: model.maxTokens } : {}),
				fetch: async (input, init) => {
					requests++;
					observed = { url: input.toString(), headers: new Headers(init?.headers), payload: JSON.parse(String(init?.body)) };
					return completedResponse();
				},
			}).result();
			assert.equal(response.stopReason, "stop");
			assert.equal(requests, 1);
			assert.ok(observed);
			assert.equal(observed.url, "https://configured-proxy.example/v1/responses");
			assert.equal(observed.headers.get("x-test-model-header"), "preserved");
			const payload = observed.payload;
			assert.ok(typeof payload === "object" && payload !== null);
			assert.ok("model" in payload && "max_output_tokens" in payload && "top_p" in payload && "service_tier" in payload);
			assert.equal(payload.model, fastModelId.replace(/-fast$/, ""));
			assert.equal(payload.max_output_tokens, 64);
			assert.equal(payload.top_p, 0.5);
			assert.equal(payload.service_tier, "priority");
			assert.equal(response.model, fastModelId);
		}
	});

	test(`resuming after a ${fastModelId} response keeps Fast selected`, async () => {
		const directory = mkdtempSync(join(tmpdir(), "pi-fast-resume-test-"));
		try {
			const provider = requireOpenAIFastProvider();
			const fastModel = provider.getModels().find((model) => model.id === fastModelId);
			assert.ok(fastModel);
			const response = await provider.streamSimple(fastModel, normalizeContext({ messages: [] }), {
				apiKey: "opaque-test-token",
				fetch: async () => completedResponse(),
			}).result();
			assert.equal(response.stopReason, "stop");
			const sessionManager = SessionManager.inMemory(directory);
			sessionManager.appendModelChange("openai", fastModelId);
			sessionManager.appendMessage(response);
			const credentials = new InMemoryCredentialStore();
			await credentials.modify("openai", async () => ({ type: "api_key", key: "sk-inert-test-key" }));
			const modelRuntime = await ModelRuntime.create({ credentials, modelsStore: new InMemoryModelsStore(), modelsPath: null, refreshOnCreate: false, allowModelNetwork: false });
			modelRuntime.registerNativeProvider(provider);
			await modelRuntime.setRuntimeApiKey("openai", "sk-inert-test-key");
			await modelRuntime.refresh({ allowNetwork: false });
			const { session } = await createAgentSession({ cwd: directory, agentDir: directory, sessionManager, modelRuntime, settingsManager: SettingsManager.inMemory(), tools: [] });
			try {
				assert.equal(session.model?.id, fastModelId);
			} finally {
				session.dispose();
			}
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
}

function requireFastModel(
	catalog: readonly ProviderModelConfig[],
	baseModelId: string,
): ProviderModelConfig {
	const fastModel = catalog.find((model) => model.id === `${baseModelId}-fast`);
	assert.ok(fastModel);
	return fastModel;
}

test("extension discovers Fast variants and preserves cached variants across discovery failures", async () => {
	let registeredProviderName: string | undefined;
	let registeredProviderConfig: ProviderConfig | undefined;
	const recordingApi = {
		registerProvider(providerName: string, providerConfig: ProviderConfig) {
			registeredProviderName = providerName;
			registeredProviderConfig = providerConfig;
		},
	};
	// SAFETY: createCodexFastVariantsExtension uses only registerProvider; recordingApi faithfully implements that ExtensionAPI operation for this integration test.
	const pi = recordingApi as unknown as ExtensionAPI;
	const builtInModel = getModels("openai-codex")[0];
	assert.ok(builtInModel);

	let discoveryFailure: "none" | "client-version" | "catalog" = "none";
	createCodexFastVariantsExtension({
		fetchCatalog: async (input) => {
			if (input.toString() === "https://registry.npmjs.org/@openai/codex/latest") {
				return discoveryFailure === "client-version"
					? new Response("unavailable", { status: 503 })
					: new Response(JSON.stringify({ version: "1.2.3" }), { status: 200 });
			}
			return discoveryFailure === "catalog"
				? new Response("unavailable", { status: 503 })
				: new Response(
						JSON.stringify({
							models: [
								{ slug: builtInModel.id, service_tiers: [{ id: "priority" }] },
							],
						}),
						{ status: 200, headers: { "content-type": "application/json" } },
					);
		},
	})(pi);

	assert.equal(registeredProviderName, "openai-codex");
	assert.ok(registeredProviderConfig?.refreshModels);
	assert.ok(
		registeredProviderConfig.models?.some((model) => model.id === "gpt-6-astra"),
	);
	const credential: OAuthCredential = {
		type: "oauth",
		access: createCodexTestAccessToken("account-test"),
		refresh: "refresh-secret",
		expires: Date.now() + 60_000,
	};
	let persisted: ModelsPublication["persist"];
	const refreshedCatalog = await registeredProviderConfig.refreshModels({
		credential,
		allowNetwork: true,
		signal: new AbortController().signal,
		async publish(publication) {
			persisted = publication.persist;
			publication.update?.();
			return true;
		},
	});

	const fastModelConfig = requireFastModel(refreshedCatalog, builtInModel.id);
	assert.equal(persisted && persisted !== null ? persisted.models.length : 0, 1);

	discoveryFailure = "client-version";
	assert.ok(persisted && persisted !== null);
	const cachedCatalog = await registeredProviderConfig.refreshModels({
		credential,
		stored: persisted,
		allowNetwork: true,
		signal: new AbortController().signal,
		async publish(publication) {
			publication.update?.();
			return true;
		},
	});
	assert.equal(requireFastModel(cachedCatalog, builtInModel.id).id, fastModelConfig.id);

	discoveryFailure = "catalog";
	const catalogFailureFallback = await registeredProviderConfig.refreshModels({
		credential,
		stored: persisted,
		allowNetwork: true,
		signal: new AbortController().signal,
		async publish(publication) {
			publication.update?.();
			return true;
		},
	});
	assert.equal(requireFastModel(catalogFailureFallback, builtInModel.id).id, fastModelConfig.id);

	const authenticationFailureFallback = await registeredProviderConfig.refreshModels({
		credential: { ...credential, access: "not-a-jwt" },
		stored: persisted,
		allowNetwork: true,
		signal: new AbortController().signal,
		async publish(publication) {
			publication.update?.();
			return true;
		},
	});
	assert.equal(requireFastModel(authenticationFailureFallback, builtInModel.id).id, fastModelConfig.id);

});
