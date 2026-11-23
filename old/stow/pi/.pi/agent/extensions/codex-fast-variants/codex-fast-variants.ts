import type { AnyModel, Api, Model } from "@earendil-works/pi-ai";

type CodexModel = Model<"openai-codex-responses">;

/** Create selectable speed variants for the specified upstream model IDs. */
export function createCodexFastVariantModels<TApi extends Api>(
	baseModels: readonly Model<TApi>[],
	fastCapableModelIds: ReadonlySet<string>,
	mode: "fast" | "ultrafast" = "fast",
): readonly Model<TApi>[] {
	const baseModelIds = new Set(baseModels.map((model) => model.id));
	return baseModels.flatMap((model) => {
		if (!fastCapableModelIds.has(model.id)) return [];
		const variantId = `${model.id}-${mode}`;
		if (baseModelIds.has(variantId)) return [];
		return [{ ...model, id: variantId, name: `${model.name} (${mode === "ultrafast" ? "Ultrafast" : "Fast"})` }];
	});
}

/** Resolve a visible Fast Mode variant to an exact model in the built-in Codex catalog. */
export function resolveCodexFastUpstreamModelId(
	visibleModelId: string,
	baseModels: readonly Model<Api>[],
	mode: "fast" | "ultrafast" = "fast",
): string | undefined {
	const suffix = `-${mode}`;
	if (!visibleModelId.endsWith(suffix)) return undefined;
	const upstreamModelId = visibleModelId.slice(0, -suffix.length);
	return baseModels.some(
		(model) =>
			model.id === upstreamModelId &&
			`${model.id}${suffix}` === visibleModelId,
	)
		? upstreamModelId
		: undefined;
}

/** Rebuild cached Fast Mode variants with metadata from the current built-in Codex catalog. */
export function restoreCodexFastVariantModels(
	baseModels: readonly CodexModel[],
	storedModels: readonly AnyModel[],
): readonly CodexModel[] {
	const storedUpstreamModelIds = new Set(
		storedModels.flatMap((model) => {
			if (model.provider !== "openai-codex" || (model.type !== undefined && model.type !== "chat")) return [];
			const upstreamModelId = resolveCodexFastUpstreamModelId(model.id, baseModels);
			return upstreamModelId ? [upstreamModelId] : [];
		}),
	);
	return createCodexFastVariantModels(baseModels, storedUpstreamModelIds);
}
