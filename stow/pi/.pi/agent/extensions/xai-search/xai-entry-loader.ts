import { execFileSync } from "node:child_process";
import { accessSync, constants, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { delimiter, dirname, join } from "node:path";
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
  throw new Error("pi was not found on PATH; include the directory that contains pi");
}

const PI_PACKAGE = "@earendil-works/pi-coding-agent";

function piPackageDirectory(): string {
  const piPath = realpathSync(findPiOnPath());
  const marker = `/node_modules/${PI_PACKAGE}/`;
  const index = piPath.lastIndexOf(marker);
  if (index >= 0) return piPath.slice(0, index + marker.length - 1);

  const installed = JSON.parse(execFileSync("/usr/bin/env", ["pnpm", "list", "--global", "--depth=0", "--json"], { encoding: "utf8" })) as
    Array<{ dependencies?: Record<string, { path?: string }> }>;
  const path = installed[0]?.dependencies?.[PI_PACKAGE]?.path;
  if (!path) throw new Error(`Cannot locate the Pi package for ${piPath}`);
  return realpathSync(path);
}

export function installedPiPaths(packageDirectory = piPackageDirectory()): EntryLoaderPaths {
  const resolve = createRequire(join(packageDirectory, "package.json")).resolve;
  return {
    piCodingAgent: join(packageDirectory, "dist/index.js"),
    typebox: resolve("typebox"),
  };
}

// Loads index.ts fresh through the jiti bundled with pi, the same loader Pi uses for extensions.
export async function loadXaiSearchEntry(paths: EntryLoaderPaths, packageDirectory = piPackageDirectory()): Promise<RegisteredEntry> {
  const resolve = createRequire(join(packageDirectory, "package.json")).resolve;
  const jitiPath = join(dirname(resolve("jiti/package.json")), "lib/jiti.mjs");
  const { createJiti } = (await import(pathToFileURL(jitiPath).href)) as {
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
