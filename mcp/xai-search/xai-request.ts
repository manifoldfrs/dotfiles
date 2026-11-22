const MAX_X_HANDLES = 20;
const MAX_DOMAINS = 5;
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Where Grok searches: posts on X, the public web, or both. */
export type XaiSearchSource = "x" | "web";
const SOURCES: readonly XaiSearchSource[] = ["x", "web"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const X_HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

export interface XaiSearchParams {
  query: string;
  sources?: string[];
  allowed_domains?: string[];
  excluded_domains?: string[];
  model?: string;
  from_date?: string;
  to_date?: string;
  allowed_x_handles?: string[];
  excluded_x_handles?: string[];
  enable_image_understanding?: boolean;
  enable_video_understanding?: boolean;
  max_turns?: number;
  max_output_tokens?: number;
}

export interface XaiSearchRequest {
  model: string;
  query: string;
  sources: XaiSearchSource[];
  tools: Record<string, unknown>[];
  maxTurns?: number;
  maxOutputTokens?: number;
}

function normalizePositiveInteger(
  value: number | undefined,
  field: "max_turns" | "max_output_tokens",
): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 1) throw new Error(`${field} must be a positive integer`);
  return value;
}

function normalizeDate(value: string | undefined, field: "from_date" | "to_date"): string | undefined {
  if (value === undefined) return undefined;

  const date = value.trim();
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`${field} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`${field} must be a valid calendar date`);
  }
  return date;
}

function normalizeHandles(
  values: string[] | undefined,
  field: "allowed_x_handles" | "excluded_x_handles",
): string[] | undefined {
  if (values === undefined) return undefined;
  if (values.length === 0 || values.length > MAX_X_HANDLES) {
    throw new Error(`${field} must contain between 1 and ${MAX_X_HANDLES} handles`);
  }

  const seen = new Set<string>();
  return values.map((value, index) => {
    const handle = value.trim().replace(/^@/, "");
    if (!X_HANDLE_PATTERN.test(handle)) {
      throw new Error(`${field}[${index}] must be a valid X handle`);
    }
    const key = handle.toLowerCase();
    if (seen.has(key)) throw new Error(`${field} must not contain duplicate handles`);
    seen.add(key);
    return handle;
  });
}

function normalizeSources(values: string[] | undefined): XaiSearchSource[] {
  if (values === undefined) return ["x"];
  if (values.length === 0) throw new Error("sources must contain x, web, or both");

  const sources = SOURCES.filter((source) => values.includes(source));
  const unknown = values.filter((value) => !SOURCES.some((source) => source === value));
  if (unknown.length > 0) throw new Error(`sources may contain only x and web, got ${unknown.join(", ")}`);
  if (sources.length !== values.length) throw new Error("sources must not contain duplicates");
  return sources;
}

function normalizeDomains(values: string[] | undefined, field: "allowed_domains" | "excluded_domains"): string[] | undefined {
  if (values === undefined) return undefined;
  if (values.length === 0 || values.length > MAX_DOMAINS) {
    throw new Error(`${field} must contain between 1 and ${MAX_DOMAINS} domains`);
  }

  const domains = values.map((value, index) => {
    const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMAIN_PATTERN.test(domain)) throw new Error(`${field}[${index}] must be a domain such as example.com`);
    return domain;
  });
  if (new Set(domains).size !== domains.length) throw new Error(`${field} must not contain duplicate domains`);
  return domains;
}

// Options for one source are refused when that source is not searched, so a filter never silently does nothing.
function requireSource(sources: readonly XaiSearchSource[], source: XaiSearchSource, fields: Record<string, unknown>): void {
  if (sources.includes(source)) return;
  const used = Object.entries(fields).filter(([, value]) => value !== undefined).map(([field]) => field);
  if (used.length > 0) throw new Error(`${used.join(", ")} need "${source}" in sources`);
}

// xAI applies from_date from 00:00 UTC and treats to_date as exclusive, so dates pass through unchanged.
export function buildXaiSearchRequest(params: XaiSearchParams, defaultModel: string): XaiSearchRequest {
  const query = params.query.trim();
  if (!query) throw new Error("query must not be empty");

  const model = (params.model ?? defaultModel).trim();
  if (!model) throw new Error("model must not be empty");

  const fromDate = normalizeDate(params.from_date, "from_date");
  const toDate = normalizeDate(params.to_date, "to_date");
  if (fromDate && toDate && fromDate >= toDate) {
    throw new Error(
      "from_date must be before to_date; to_date is exclusive, so to search one day set to_date to the following day",
    );
  }

  const allowedHandles = normalizeHandles(params.allowed_x_handles, "allowed_x_handles");
  const excludedHandles = normalizeHandles(params.excluded_x_handles, "excluded_x_handles");
  if (allowedHandles && excludedHandles) {
    throw new Error("allowed_x_handles and excluded_x_handles cannot be used together");
  }

  const sources = normalizeSources(params.sources);
  const allowedDomains = normalizeDomains(params.allowed_domains, "allowed_domains");
  const excludedDomains = normalizeDomains(params.excluded_domains, "excluded_domains");
  if (allowedDomains && excludedDomains) {
    throw new Error("allowed_domains and excluded_domains cannot be used together");
  }

  requireSource(sources, "x", {
    from_date: fromDate,
    to_date: toDate,
    allowed_x_handles: allowedHandles,
    excluded_x_handles: excludedHandles,
    enable_video_understanding: params.enable_video_understanding,
  });
  requireSource(sources, "web", { allowed_domains: allowedDomains, excluded_domains: excludedDomains });

  const xSearchTool: Record<string, unknown> = { type: "x_search" };
  if (fromDate) xSearchTool.from_date = fromDate;
  if (toDate) xSearchTool.to_date = toDate;
  if (allowedHandles) xSearchTool.allowed_x_handles = allowedHandles;
  if (excludedHandles) xSearchTool.excluded_x_handles = excludedHandles;
  if (params.enable_image_understanding !== undefined) {
    xSearchTool.enable_image_understanding = params.enable_image_understanding;
  }
  if (params.enable_video_understanding !== undefined) {
    xSearchTool.enable_video_understanding = params.enable_video_understanding;
  }

  const webSearchTool: Record<string, unknown> = { type: "web_search" };
  if (allowedDomains) webSearchTool.filters = { allowed_domains: allowedDomains };
  if (excludedDomains) webSearchTool.filters = { excluded_domains: excludedDomains };
  if (params.enable_image_understanding !== undefined) {
    webSearchTool.enable_image_understanding = params.enable_image_understanding;
  }

  const tools = sources.map((source) => (source === "x" ? xSearchTool : webSearchTool));

  const maxTurns = normalizePositiveInteger(params.max_turns, "max_turns");
  const maxOutputTokens = normalizePositiveInteger(params.max_output_tokens, "max_output_tokens");

  return {
    model,
    query,
    sources,
    tools,
    ...(maxTurns !== undefined ? { maxTurns } : {}),
    ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
  };
}
