import type { Api, Model } from "@earendil-works/pi-ai";
import { getModels } from "@earendil-works/pi-ai/compat";
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
import {
	createCodexFastVariantModels,
	restoreCodexFastVariantModels,
} from "./codex-fast-variants.ts";
type CodexModel = Model<"openai-codex-responses">;

const TEMPORARY_ASTRA_MODEL_ID = "gpt-6-astra";

function createTemporaryAstraModel(baseUrl: string): CodexModel {
	return {
		id: TEMPORARY_ASTRA_MODEL_ID,
		name: "GPT-6 Astra",
		api: "openai-codex-responses",
		provider: "openai-codex",
		baseUrl,
		reasoning: true,
		thinkingLevelMap: {
			off: null,
			minimal: null,
			low: "low",
			medium: "medium",
			high: "high",
			xhigh: "xhigh",
			max: "max",
		},
		input: ["text", "image"],
		contextWindow: 272_000,
		maxTokens: 128_000,
		cost: {
			input: 10,
			output: 50,
			cacheRead: 1,
			cacheWrite: 12.5,
		},
	};
}

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
		const builtInModels = getModels("openai-codex").filter(isCodexModel);
		const baseUrl = builtInModels[0]?.baseUrl;
		if (!baseUrl) {
			throw new Error("Codex Fast built-in provider has no base URL");
		}
		const baseModels = builtInModels.some(
			(model) => model.id === TEMPORARY_ASTRA_MODEL_ID,
		)
			? builtInModels
			: [...builtInModels, createTemporaryAstraModel(baseUrl)];

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

/** Register Codex Fast Mode variants using Pi's runtime fetch implementation. */
export default function codexFastVariantsExtension(
	pi: Parameters<ExtensionFactory>[0],
): void {
	createCodexFastVariantsExtension({ fetchCatalog: globalThis.fetch })(pi);
}
