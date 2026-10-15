import { resolveGuardedXaiRuntime, type XaiAuthRegistry } from "./xai-auth.ts";
import { postXaiSearch, type FetchLike } from "./xai-client.ts";
import type { XaiSearchConfig } from "./xai-config.ts";
import { formatXaiSearchResponse, type FormattedXaiSearch } from "./xai-format.ts";
import { buildXaiSearchRequest, type XaiSearchParams } from "./xai-request.ts";

export const XAI_SEARCH_DISABLED_MESSAGE =
  "xai_search is disabled. Whether X search over the SuperGrok/X Premium sign-in uses the included subscription allowance or paid API usage has not been verified. " +
  'After verifying billing, set "enabled": true in ~/.pi/agent/pi-xai-search.json.';

export interface RunXaiSearchOptions {
  registry: XaiAuthRegistry;
  config: XaiSearchConfig;
  params: XaiSearchParams;
  fetch: FetchLike;
  signal?: AbortSignal;
}

// Order matters: validation and the billing switch run before any credential is resolved or refreshed.
export async function runXaiSearch(options: RunXaiSearchOptions): Promise<FormattedXaiSearch> {
  const request = buildXaiSearchRequest(options.params, options.config.model);
  if (!options.config.enabled) throw new Error(XAI_SEARCH_DISABLED_MESSAGE);

  const runtime = await resolveGuardedXaiRuntime(options.registry);
  const response = await postXaiSearch(runtime, request, {
    fetch: options.fetch,
    ...(options.signal ? { signal: options.signal } : {}),
  });
  return formatXaiSearchResponse(response, request.model);
}
