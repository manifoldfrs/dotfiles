import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { installedPiPaths, loadXaiSearchEntry, type EntryLoaderPaths, type RegisteredEntry } from "./xai-entry-loader.ts";

// Test-only: Pi's API is replaced by a stub whose getAgentDir points at a temporary directory.
export function stubbedPiPaths(agentDir: string): EntryLoaderPaths {
  const stubPath = join(agentDir, "pi-coding-agent-stub.mjs");
  writeFileSync(
    stubPath,
    [
      `export const getAgentDir = () => ${JSON.stringify(agentDir)};`,
      "export const truncateHead = (content) => ({ content, truncated: false, outputLines: 0, outputBytes: 0 });",
      "export const formatSize = (bytes) => `${bytes}B`;",
    ].join("\n"),
  );
  return { piCodingAgent: stubPath, typebox: installedPiPaths().typebox };
}

export function loadStubbedEntry(agentDir: string): Promise<RegisteredEntry> {
  return loadXaiSearchEntry(stubbedPiPaths(agentDir));
}
