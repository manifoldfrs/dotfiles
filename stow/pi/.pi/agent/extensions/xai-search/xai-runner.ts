import { assertFirstPartyXaiSubscriptionProvider, XAI_API_BASE_URL, type XaiAuthRegistry } from "./xai-auth.ts";
import type { FetchLike } from "./xai-client.ts";
import type { RegisteredEntry, RegisteredTool } from "./xai-entry-loader.ts";

export const RUNNER_MAX_TURNS = 4;
export const RUNNER_MAX_OUTPUT_TOKENS = 3000;
const DRY_RUN_TOKEN = "dry-run-placeholder";

const RUNNER_USAGE =
  "Usage: run-xai-search.ts --schema | --check | --dry-run --params <file.json> | --params <file.json> [--out <file.json>]";

// Runner calls always carry these values, so a scheduled digest cannot run unbounded.
const FORCED_PARAMS = {
  max_turns: RUNNER_MAX_TURNS,
  max_output_tokens: RUNNER_MAX_OUTPUT_TOKENS,
  enable_image_understanding: false,
  enable_video_understanding: false,
} as const;

export type RunnerMode = "schema" | "check" | "dry-run" | "run";

export interface RunnerArgs {
  mode: RunnerMode;
  paramsPath?: string;
  outPath?: string;
}

export interface RunnerDeps {
  readFile: (path: string) => Promise<string>;
  writeOutput: (text: string, outPath?: string) => Promise<void>;
  writeError: (text: string) => void;
  loadEntry: () => Promise<RegisteredEntry>;
  createRegistry: () => Promise<XaiAuthRegistry>;
  fetch: FetchLike;
  // The registered tool calls globalThis.fetch, so the runner swaps it for the duration of one call.
  installFetch: (fetch: FetchLike) => () => void;
}

export function parseRunnerArgs(argv: string[]): RunnerArgs {
  const flags = new Set<string>();
  let paramsPath: string | undefined;
  let outPath: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--schema" || arg === "--check" || arg === "--dry-run") flags.add(arg);
    else if (arg === "--params" || arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} needs a file path\n${RUNNER_USAGE}`);
      if (arg === "--params") paramsPath = value;
      else outPath = value;
      index += 1;
    } else throw new Error(`Unknown argument ${arg}\n${RUNNER_USAGE}`);
  }

  for (const standalone of ["--schema", "--check"] as const) {
    if (!flags.has(standalone)) continue;
    if (flags.size > 1 || paramsPath || outPath) throw new Error(`${standalone} takes no other arguments\n${RUNNER_USAGE}`);
    return { mode: standalone === "--schema" ? "schema" : "check" };
  }
  if (!paramsPath) throw new Error(`--params is required\n${RUNNER_USAGE}`);
  return {
    mode: flags.has("--dry-run") ? "dry-run" : "run",
    paramsPath,
    ...(outPath ? { outPath } : {}),
  };
}

export function boundRunnerParams(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Params file must contain a JSON object");
  }
  const params = value as Record<string, unknown>;
  if (typeof params.query !== "string") throw new Error("Params file needs a string query");

  for (const [key, forced] of Object.entries(FORCED_PARAMS)) {
    if (params[key] !== undefined && params[key] !== forced) {
      throw new Error(`The runner always sends ${key}=${forced}; remove it from the params file`);
    }
  }
  return { ...params, ...FORCED_PARAMS };
}

function findTool(entry: RegisteredEntry): RegisteredTool {
  const tools = entry.tools.filter((tool) => tool.name === "xai_search");
  if (tools.length !== 1 || entry.tools.length !== 1) {
    throw new Error(`Expected the entry to register exactly one xai_search tool, got ${entry.tools.length}`);
  }
  return tools[0]!;
}

function assertBoundedSchema(tool: RegisteredTool): string[] {
  const properties = Object.keys(tool.parameters.properties ?? {});
  for (const required of ["max_turns", "max_output_tokens"]) {
    if (!properties.includes(required)) throw new Error(`Loaded xai_search schema is missing ${required}`);
  }
  return properties;
}

// A registry that passes every guard with a placeholder token, for dry runs only.
function dryRunRegistry(): XaiAuthRegistry {
  return {
    getRegisteredNativeProvider: () => undefined,
    getRegisteredProviderConfig: () => undefined,
    getProvider: () => ({
      baseUrl: XAI_API_BASE_URL,
      auth: { oauth: { isSubscription: true } },
      getModels: () => [{ provider: "xai", id: "dry-run" }],
    }),
    getProviderAuthStatus: () => ({ configured: true, source: "stored" }),
    isUsingOAuth: () => true,
    getProviderAuth: async () => ({ auth: { apiKey: DRY_RUN_TOKEN }, source: "OAuth" }),
  } as unknown as XaiAuthRegistry;
}

async function readParams(path: string, deps: RunnerDeps): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await deps.readFile(path));
  } catch {
    throw new Error(`Could not read JSON params from ${path}`);
  }
  return boundRunnerParams(parsed);
}

async function executeTool(
  tool: RegisteredTool,
  params: Record<string, unknown>,
  registry: XaiAuthRegistry,
  fetch: FetchLike,
  deps: RunnerDeps,
) {
  const restore = deps.installFetch(fetch);
  try {
    return await tool.execute("xai-runner", params, undefined, undefined, { modelRegistry: registry });
  } finally {
    restore();
  }
}

async function dryRun(tool: RegisteredTool, params: Record<string, unknown>, deps: RunnerDeps) {
  const captured: { url: string; body: unknown; redirect?: RequestRedirect }[] = [];
  const capture: FetchLike = async (url, init) => {
    captured.push({ url, body: JSON.parse(String(init.body)), ...(init.redirect ? { redirect: init.redirect } : {}) });
    return new Response(JSON.stringify({ output: [] }), { status: 200 });
  };
  await executeTool(tool, params, dryRunRegistry(), capture, deps);
  if (captured.length !== 1) throw new Error(`Dry run expected one request, captured ${captured.length}`);
  return { dryRun: true, liveRequest: false, ...captured[0] };
}

async function execute(args: RunnerArgs, deps: RunnerDeps): Promise<Record<string, unknown>> {
  if (args.mode === "check") {
    assertFirstPartyXaiSubscriptionProvider(await deps.createRegistry());
    return { eligible: true, credentialResolved: false };
  }

  const tool = findTool(await deps.loadEntry());
  const properties = assertBoundedSchema(tool);
  if (args.mode === "schema") return { tool: tool.name, parameters: properties };

  const params = await readParams(args.paramsPath!, deps);
  if (args.mode === "dry-run") return dryRun(tool, params, deps);

  const result = await executeTool(tool, params, await deps.createRegistry(), deps.fetch, deps);
  return { text: result.content.map((part) => part.text).join("\n"), details: result.details };
}

export async function runRunner(argv: string[], deps: RunnerDeps): Promise<number> {
  let args: RunnerArgs;
  try {
    args = parseRunnerArgs(argv);
  } catch (error) {
    deps.writeError(error instanceof Error ? error.message : String(error));
    return 2;
  }

  try {
    const output = await execute(args, deps);
    await deps.writeOutput(`${JSON.stringify(output, null, 2)}\n`, args.outPath);
    return 0;
  } catch (error) {
    deps.writeError(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
