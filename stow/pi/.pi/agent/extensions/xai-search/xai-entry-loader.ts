import { accessSync, constants, realpathSync } from "node:fs";
import { delimiter, join } from "node:path";
import { pathToFileURL } from "node:url";

export interface RegisteredTool {
  name: string;
  parameters: { properties?: Record<string, unknown> };
  execute: (
    toolCallId: string,
    params: unknown,
    signal: AbortSignal | undefined,
    onUpdate: undefined,
    ctx: unknown,
  ) => Promise<{ content: { type: string; text: string }[]; details: unknown }>;
}

export interface RegisteredCommand {
  handler: (args: string, ctx: unknown) => Promise<void>;
}

export interface RegisteredEntry {
  tools: RegisteredTool[];
  commands: Map<string, RegisteredCommand>;
}

export interface EntryLoaderPaths {
  piCodingAgent: string;
  typebox: string;
}

// Searches PATH directly instead of a login shell, so scheduled runs have no shell-startup side effects.
function findPiOnPath(): string {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, "pi");
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("pi was not found on PATH; include the directory that contains pi, such as ~/.bun/bin");
}

export function piNodeModules(): string {
  const piPath = realpathSync(findPiOnPath());
  const marker = "/node_modules/";
  const index = piPath.lastIndexOf(marker, piPath.indexOf("/@earendil-works/"));
  if (index < 0) throw new Error(`Cannot locate node_modules for ${piPath}`);
  return piPath.slice(0, index + marker.length - 1);
}

export function installedPiPaths(nodeModules = piNodeModules()): EntryLoaderPaths {
  return {
    piCodingAgent: join(nodeModules, "@earendil-works/pi-coding-agent/dist/index.js"),
    typebox: join(nodeModules, "typebox/build/index.mjs"),
  };
}

// Loads index.ts fresh through the jiti bundled with pi, the same loader Pi uses for extensions.
export async function loadXaiSearchEntry(paths: EntryLoaderPaths, nodeModules = piNodeModules()): Promise<RegisteredEntry> {
  const { createJiti } = (await import(pathToFileURL(join(nodeModules, "jiti/lib/jiti.mjs")).href)) as {
    createJiti: (from: string, options: object) => { import: (id: string, options?: object) => Promise<unknown> };
  };
  const jiti = createJiti(import.meta.url, {
    moduleCache: false,
    alias: { "@earendil-works/pi-coding-agent": paths.piCodingAgent, typebox: paths.typebox },
  });
  const factory = (await jiti.import(new URL("./index.ts", import.meta.url).pathname, { default: true })) as (
    pi: unknown,
  ) => void;

  const entry: RegisteredEntry = { tools: [], commands: new Map() };
  factory({
    registerTool: (tool: RegisteredTool) => entry.tools.push(tool),
    registerCommand: (name: string, command: RegisteredCommand) => entry.commands.set(name, command),
    on: () => undefined,
  });
  return entry;
}
