import { XAI_API_BASE_URL, type GuardedXaiRuntime } from "./xai-auth.ts";
import type { XaiSearchRequest } from "./xai-request.ts";

export const XAI_SEARCH_TIMEOUT_MS = 300_000;

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

// Response bodies and transport errors are never surfaced, since either could echo request headers.
export class XaiApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`xAI API error (${status})`);
    this.name = "XaiApiError";
    this.status = status;
  }
}

export interface PostXaiSearchOptions {
  fetch: FetchLike;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function postXaiSearch(
  runtime: GuardedXaiRuntime,
  request: XaiSearchRequest,
  options: PostXaiSearchOptions,
): Promise<Record<string, unknown>> {
  if (runtime.baseUrl !== XAI_API_BASE_URL) {
    throw new Error(`Refusing to send xAI credentials to ${runtime.baseUrl}`);
  }

  const timeoutMs = options.timeoutMs ?? XAI_SEARCH_TIMEOUT_MS;
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

  let response: Response;
  try {
    // Redirects are errors so the bearer token can never follow a Location header elsewhere.
    response = await options.fetch(`${XAI_API_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${runtime.bearer.reveal()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        input: [{ role: "user", content: request.query }],
        tools: [request.xSearchTool],
        store: false,
      }),
      redirect: "error",
      signal,
    });
  } catch {
    if (options.signal?.aborted) throw new Error("xAI search was cancelled");
    if (timeout.aborted) throw new Error(`xAI search timed out after ${timeoutMs}ms`);
    throw new Error("xAI search request failed before a response was received");
  }

  if (response.redirected) {
    throw new Error("xAI API response was redirected; refusing to use it");
  }
  if (!response.ok) {
    throw new XaiApiError(response.status);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("xAI API returned an invalid JSON response");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("xAI API returned an invalid JSON response");
  }
  return result as Record<string, unknown>;
}
