import { readFile } from "node:fs/promises";

export const XAI_SEARCH_CONFIG_FILENAME = "pi-xai-search.json";
export const DEFAULT_XAI_SEARCH_MODEL = "grok-4.5";

export interface XaiSearchConfig {
  model: string;
  warnings: string[];
}

function defaults(warnings: string[]): XaiSearchConfig {
  return { model: DEFAULT_XAI_SEARCH_MODEL, warnings };
}

export function parseXaiSearchConfig(value: unknown): XaiSearchConfig {
  if (value === undefined) return defaults([]);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults([`xai_search config must be a JSON object; using ${DEFAULT_XAI_SEARCH_MODEL}`]);
  }

  const model = (value as Record<string, unknown>).model;
  if (model === undefined) return defaults([]);
  if (typeof model === "string" && model.trim()) return { model: model.trim(), warnings: [] };
  return defaults([`xai_search config "model" must be a non-empty string; using ${DEFAULT_XAI_SEARCH_MODEL}`]);
}

export async function loadXaiSearchConfig(path: string): Promise<XaiSearchConfig> {
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return parseXaiSearchConfig(undefined);
    return defaults([`Could not read ${path}; using ${DEFAULT_XAI_SEARCH_MODEL}`]);
  }

  try {
    return parseXaiSearchConfig(JSON.parse(content));
  } catch {
    return defaults([`Could not parse ${path}; using ${DEFAULT_XAI_SEARCH_MODEL}`]);
  }
}
