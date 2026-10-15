const X_SEARCH_USAGE_KEYS = ["x_search_calls", "x_posts_fetched", "x_users_fetched"] as const;
const X_SEARCH_FUNCTIONS = new Set(["x_keyword_search", "x_semantic_search", "x_user_search", "x_thread_fetch"]);

export type XSearchUsage = Partial<Record<(typeof X_SEARCH_USAGE_KEYS)[number], number>>;

export interface XaiSearchDetails {
  model: string;
  citations: string[];
  searchCount: number;
  xSearchUsage: XSearchUsage;
}

export interface FormattedXaiSearch {
  text: string;
  details: XaiSearchDetails;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

// Only counters xAI actually reported are kept; a missing counter is unknown, not zero.
export function readXSearchUsage(response: UnknownRecord): XSearchUsage {
  const usage = isRecord(response.usage) ? response.usage : undefined;
  const details = usage && isRecord(usage.server_side_tool_usage_details) ? usage.server_side_tool_usage_details : undefined;
  if (!details) return {};

  const counters: XSearchUsage = {};
  for (const key of X_SEARCH_USAGE_KEYS) {
    const count = finiteNumber(details[key]);
    if (count !== undefined) counters[key] = count;
  }
  return counters;
}

function describeSearchCall(item: UnknownRecord): string | undefined {
  if (item.type === "custom_tool_call") {
    const name = nonEmptyString(item.name);
    if (!name || !X_SEARCH_FUNCTIONS.has(name)) return undefined;
    const status = nonEmptyString(item.status);
    return `- ${name}${status ? ` [${status}]` : ""}`;
  }
  if (item.type === "x_search_call") {
    const query = isRecord(item.action) ? nonEmptyString(item.action.query) : undefined;
    const status = nonEmptyString(item.status);
    return `- x_search${query ? `: “${query}”` : ""}${status ? ` [${status}]` : ""}`;
  }
  return undefined;
}

function collectCitations(response: UnknownRecord, output: unknown[]): string[] {
  const citations = new Set<string>();
  if (Array.isArray(response.citations)) {
    for (const citation of response.citations) {
      const url = nonEmptyString(citation);
      if (url) citations.add(url);
    }
  }
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        const url = isRecord(annotation) ? nonEmptyString(annotation.url) : undefined;
        if (url) citations.add(url);
      }
    }
  }
  return [...citations];
}

function formatTokenUsage(response: UnknownRecord): string | undefined {
  if (!isRecord(response.usage)) return undefined;
  const input = finiteNumber(response.usage.input_tokens);
  const output = finiteNumber(response.usage.output_tokens);
  if (input === undefined && output === undefined) return undefined;
  return `Tokens: ${input ?? "not reported"} in / ${output ?? "not reported"} out`;
}

function formatXSearchUsage(usage: XSearchUsage): string {
  const entries = Object.entries(usage);
  if (entries.length === 0) return "X search usage: not reported by xAI";
  return `X search usage: ${entries.map(([key, count]) => `${key}=${count}`).join(", ")}`;
}

export function formatXaiSearchResponse(response: UnknownRecord, requestedModel: string): FormattedXaiSearch {
  const output = Array.isArray(response.output) ? response.output : [];
  const textParts: string[] = [];
  const searches: string[] = [];

  for (const item of output) {
    if (!isRecord(item)) continue;
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const content of item.content) {
        const text = isRecord(content) && content.type === "output_text" ? nonEmptyString(content.text) : undefined;
        if (text) textParts.push(text);
      }
      continue;
    }
    const search = describeSearchCall(item);
    if (search) searches.push(search);
  }

  const model = nonEmptyString(response.model) ?? requestedModel;
  const citations = collectCitations(response, output);
  const xSearchUsage = readXSearchUsage(response);
  const tokenUsage = formatTokenUsage(response);

  const sections = [`**xAI X Search** (${model})`, textParts.join("\n").trim() || "(no text output)"];
  if (searches.length > 0) sections.push(`**Searches performed**\n${searches.join("\n")}`);
  if (tokenUsage) sections.push(tokenUsage);
  sections.push(formatXSearchUsage(xSearchUsage));
  if (citations.length > 0) {
    sections.push(`**Sources**\n${citations.map((url, index) => `${index + 1}. ${url}`).join("\n")}`);
  }

  return {
    text: sections.join("\n\n"),
    details: { model, citations, searchCount: searches.length, xSearchUsage },
  };
}
