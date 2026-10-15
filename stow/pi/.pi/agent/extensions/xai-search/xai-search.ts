import { resolveGuardedXaiRuntime, type XaiAuthRegistry } from "./xai-auth.ts";
import { postXaiSearch, type FetchLike } from "./xai-client.ts";
import type { XaiSearchConfig } from "./xai-config.ts";
import { formatXaiSearchResponse, type FormattedXaiSearch } from "./xai-format.ts";
import { buildXaiSearchRequest, type XaiSearchParams } from "./xai-request.ts";

export interface RunXaiSearchOptions {
  registry: XaiAuthRegistry;
  config: XaiSearchConfig;
  params: XaiSearchParams;
  fetch: FetchLike;
  signal?: AbortSignal;
}

// Parameter validation runs before any credential is resolved or refreshed.
export async function runXaiSearch(options: RunXaiSearchOptions): Promise<FormattedXaiSearch> {
  const request = buildXaiSearchRequest(options.params, options.config.model);
  const runtime = await resolveGuardedXaiRuntime(options.registry);
  const response = await postXaiSearch(runtime, request, {
    fetch: options.fetch,
    ...(options.signal ? { signal: options.signal } : {}),
  });
  return formatXaiSearchResponse(response, request.model);
}
