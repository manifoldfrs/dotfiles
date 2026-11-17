import { type Api, isModelType, type Model, type Provider, type StreamOptions } from "@earendil-works/pi-ai";
import { getModels } from "@earendil-works/pi-ai/compat";
import { builtinProviders } from "@earendil-works/pi-ai/providers/all";
import type {
	ExtensionFactory,
	ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

import { createCodexAccessToken } from "./codex-access-token.ts";
import {
	type CodexFastCatalogFetch,
	fetchCodexFastModelCatalog,
	fetchLatestCodexClientVersion,
} from "./codex-fast-catalog.ts";
import { createCodexFastStream } from "./codex-fast-stream.ts";
import { rewriteCodexFastRequestPayload } from "./codex-fast-request.ts";
import {
	createCodexFastVariantModels,
	restoreCodexFastVariantModels,
	resolveCodexFastUpstreamModelId,
} from "./codex-fast-variants.ts";
type CodexModel = Model<"openai-codex-responses">;

/** Runtime dependencies for Codex Fast Mode discovery. */
export interface CodexFastVariantsDependencies {
	/** Fetch implementation used only for official Codex metadata and the authenticated catalog. */
	readonly fetchCatalog: CodexFastCatalogFetch;
}

function isCodexModel(model: Model<Api>): model is CodexModel {
	return model.provider === "openai-codex" && model.api === "openai-codex-responses";
}

function toProviderModelConfig(model: CodexModel): ProviderModelConfig {
	return {
		id: model.id,
		name: model.name,
		api: model.api,
		baseUrl: model.baseUrl,
		reasoning: model.reasoning,
		thinkingLevelMap: model.thinkingLevelMap,
		input: [...model.input],
		cost: model.cost,
		contextWindow: model.contextWindow,
		maxTokens: model.maxTokens,
		compat: model.compat,
	};
}

function buildProviderModelCatalog(
	baseModels: readonly CodexModel[],
	fastVariants: readonly CodexModel[],
): ProviderModelConfig[] {
	return [...baseModels, ...fastVariants].map(toProviderModelConfig);
}

/** Create a Pi extension that discovers and routes selectable Codex `-fast` model variants. */
export function createCodexFastVariantsExtension(
	dependencies: CodexFastVariantsDependencies,
): ExtensionFactory {
	return (pi) => {
		const baseModels = getModels("openai-codex").filter(isCodexModel);
		const baseUrl = baseModels[0]?.baseUrl;
		if (!baseUrl) {
			throw new Error("Codex Fast built-in provider has no base URL");
		}

		pi.registerProvider("openai-codex", {
			api: "openai-codex-responses",
			baseUrl,
			models: buildProviderModelCatalog(baseModels, []),
			streamSimple: createCodexFastStream(baseModels),
			async refreshModels(context) {
				const storedVariants = restoreCodexFastVariantModels(
					baseModels,
					context.stored?.models ?? [],
				);
				const storedCatalog = buildProviderModelCatalog(baseModels, storedVariants);
				if (!context.allowNetwork || context.credential?.type !== "oauth") {
					return storedCatalog;
				}

				const clientVersionResult = await fetchLatestCodexClientVersion(
					dependencies.fetchCatalog,
					context.signal,
				);
				if (!clientVersionResult.ok) return storedCatalog;
				const catalogResult = await fetchCodexFastModelCatalog({
					baseUrl,
					clientVersion: clientVersionResult.value,
					accessToken: createCodexAccessToken(context.credential.access),
					fetch: dependencies.fetchCatalog,
					signal: context.signal,
				});
				if (!catalogResult.ok) return storedCatalog;

				const fastVariants = createCodexFastVariantModels(
					baseModels,
					catalogResult.value.fastCapableModelIds,
				);
				await context.publish({
					persist: { models: fastVariants },
				});
				return buildProviderModelCatalog(baseModels, fastVariants);
			},
		});

	};
}

const OPENAI_FAST_MODEL_PATTERN = /^gpt-6(?:\.[12])?-(?:sol|astra|luna)$/;
const OPENAI_ULTRAFAST_MODEL_IDS = new Set(["gpt-6.1-sol", "gpt-6-astra", "gpt-6.2-sol", "gpt-6.2-astra"]);

function mergeOpenAICatalog<T extends { readonly id: string }>(builtIn: readonly T[], refreshed: readonly T[]): T[] {
	const refreshedIds = new Set(refreshed.map((model) => model.id));

	return [...builtIn.filter((model) => !refreshedIds.has(model.id)), ...refreshed];
}

function createOpenAIFastProvider(): Provider {
	const provider = builtinProviders().find((candidate) => candidate.id === "openai");
	if (!provider) throw new Error("OpenAI Fast built-in provider is unavailable");

	const getAllModels = provider.getAllModels;

	if (!getAllModels) throw new Error("OpenAI Fast provider has no mixed-operation catalog");

	// Replacing the provider drops Pi's remote catalog wrapper, so restore the snapshot `pi update --models` stores.
	let refreshedModels: ReturnType<typeof getAllModels> = [];

	const baseModels = () => mergeOpenAICatalog(
		provider.getModels(),
		refreshedModels.filter((model): model is Model<Api> => isModelType(model, "chat")),
	);

	function speedVariants(): Model<Api>[] {
		const models = baseModels();

		return [
			...createCodexFastVariantModels(models, new Set(models.filter((model) => OPENAI_FAST_MODEL_PATTERN.test(model.id)).map((model) => model.id))),
			...createCodexFastVariantModels(models, OPENAI_ULTRAFAST_MODEL_IDS, "ultrafast"),
		];
	}

	function requestOptions(model: Model<Api>, options?: StreamOptions): StreamOptions | undefined {
		const mode = model.id.endsWith("-ultrafast") ? "ultrafast" : "fast";
		const models = baseModels();

		if (!resolveCodexFastUpstreamModelId(model.id, models, mode)) return options;

		return {
			...options,
			onPayload: async (payload, requestModel) => {
				const callerPayload = await options?.onPayload?.(payload, requestModel) ?? payload;

				return rewriteCodexFastRequestPayload(callerPayload, model.id, models, mode);
			},
		};
	}

	return {
		...provider,
		getModels: () => [...baseModels(), ...speedVariants()],
		getAllModels: () => [...mergeOpenAICatalog(getAllModels(), refreshedModels), ...speedVariants()],
		refreshModelsAuth: "configured",
		refreshModels: async (context) => {
			const restored = (context.stored?.models ?? []).filter((model) => model.provider === provider.id);
			await context.publish({ update: () => { refreshedModels = restored; } });
		},
		stream: (model, context, options) => provider.stream<Api>(model, context, { ...options, ...requestOptions(model, options) }),
		streamSimple: (model, context, options) => provider.streamSimple(model, context, requestOptions(model, options)),
	};
}

/** Register current OpenAI speed variants and legacy Codex catalog discovery. */
export default function codexFastVariantsExtension(
	pi: Parameters<ExtensionFactory>[0],
): void {
	pi.registerProvider(createOpenAIFastProvider());
	createCodexFastVariantsExtension({ fetchCatalog: globalThis.fetch })(pi);
}
