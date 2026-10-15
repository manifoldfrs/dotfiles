import { readFile } from "node:fs/promises";

export const XAI_SEARCH_CONFIG_FILENAME = "pi-xai-search.json";
export const DEFAULT_XAI_SEARCH_MODEL = "grok-4.5";

export interface XaiSearchConfig {
  enabled: boolean;
  model: string;
  warnings: string[];
}

function disabled(warnings: string[]): XaiSearchConfig {
  return { enabled: false, model: DEFAULT_XAI_SEARCH_MODEL, warnings };
}

// Anything other than a literal `"enabled": true` keeps credentialed requests off.
export function parseXaiSearchConfig(value: unknown): XaiSearchConfig {
  if (value === undefined) return disabled([]);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return disabled(["xai_search config must be a JSON object; search stays disabled"]);
  }

  const record = value as Record<string, unknown>;
  const warnings: string[] = [];
  if (record.enabled !== undefined && typeof record.enabled !== "boolean") {
    warnings.push('xai_search config "enabled" must be true or false; search stays disabled');
  }

  let model = DEFAULT_XAI_SEARCH_MODEL;
  if (record.model !== undefined) {
    if (typeof record.model === "string" && record.model.trim()) model = record.model.trim();
    else warnings.push(`xai_search config "model" must be a non-empty string; using ${DEFAULT_XAI_SEARCH_MODEL}`);
  }

  return { enabled: record.enabled === true, model, warnings };
}

export async function loadXaiSearchConfig(path: string): Promise<XaiSearchConfig> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return parseXaiSearchConfig(undefined);
    return disabled([`Could not read ${path}; search stays disabled`]);
  }

  try {
    return parseXaiSearchConfig(JSON.parse(content));
  } catch {
    return disabled([`Could not parse ${path}; search stays disabled`]);
  }
}
