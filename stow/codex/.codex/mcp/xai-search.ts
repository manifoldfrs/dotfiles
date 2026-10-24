import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const TOOL_NAME = "xai_search";
// The Pi extension owns the xAI auth guards and request bounds; this server only adapts its runner.
const RUNNER = fileURLToPath(new URL("../../../pi/.pi/agent/extensions/xai-search/run-xai-search.ts", import.meta.url));
// The runner's own request timeout is 300 s.
const RUNNER_TIMEOUT_MS = 330_000;
const RUNNER_FAILED = "xai_search runner failed";

const handleList = (description: string) => ({
  type: "array",
  items: { type: "string", minLength: 1, description: "X handle, with or without a leading @" },
  minItems: 1,
  maxItems: 20,
  uniqueItems: true,
  description,
});

const inputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["query"],
  properties: {
    query: { type: "string", minLength: 1, description: "What to search for on X (Twitter)" },
    model: { type: "string", minLength: 1, description: "xAI model override; uses the configured model when omitted" },
    from_date: { type: "string", description: "Inclusive start date, YYYY-MM-DD, from 00:00 UTC" },
    to_date: {
      type: "string",
      description: "Exclusive end date, YYYY-MM-DD, UTC. Posts on this date are not included; to search one day, set to_date to the following day.",
    },
    allowed_x_handles: handleList("Only consider posts from these X handles (maximum 20)"),
    excluded_x_handles: handleList("Exclude posts from these X handles (maximum 20)"),
    enable_image_understanding: { type: "boolean", description: "Allow xAI to analyze images in X posts" },
    enable_video_understanding: { type: "boolean", description: "Allow xAI to analyze videos in X posts" },
    max_turns: { type: "integer", minimum: 1, description: "Maximum xAI assistant/tool-call turns for this search" },
    max_output_tokens: { type: "integer", minimum: 1, description: "Maximum output tokens for the final answer" },
  },
};
const PARAM_NAMES = Object.keys(inputSchema.properties);

const TOOL = {
  name: TOOL_NAME,
  description:
    "Search live X (Twitter) posts with xAI's x_search over Pi's SuperGrok/X Premium sign-in. Supports date ranges (to_date is exclusive), handle filters, image/video understanding, and turn/output limits.",
  inputSchema,
  // Codex runs read-only tools without an approval prompt, as it does for exa and Ref.
  annotations: { readOnlyHint: true, openWorldHint: true },
};

export type RunResult = { exitCode: number | null; stdout: string; stderr: string };
export type RunRunner = (stdin: string) => Promise<RunResult>;
type ToolResult = { content: { type: "text"; text: string }[]; isError?: true };
type Request = { id?: number | string; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const runRunner: RunRunner = (stdin) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [RUNNER, "--interactive", "--params", "/dev/stdin"], { stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  const timer = setTimeout(() => child.kill(), RUNNER_TIMEOUT_MS);
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", (error) => {
    clearTimeout(timer);
    reject(error);
  });
  child.on("close", (exitCode) => {
    clearTimeout(timer);
    resolve({ exitCode, stdout, stderr });
  });
  child.stdin.end(stdin);
});

function failed(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

/** Run one xai_search call through the Pi runner. */
export async function search(args: Record<string, unknown>, run: RunRunner = runRunner): Promise<ToolResult> {
  const params = Object.fromEntries(PARAM_NAMES.filter((name) => args[name] !== undefined).map((name) => [name, args[name]]));
  const result = await run(JSON.stringify(params)).catch(() => undefined);
  if (!result) return failed(RUNNER_FAILED);
  // The runner's errors are already sanitized of credential detail.
  if (result.exitCode !== 0) return failed(result.stderr.trim() || RUNNER_FAILED);

  let output: { text?: unknown };
  try {
    output = JSON.parse(result.stdout);
  } catch {
    return failed(RUNNER_FAILED);
  }
  if (typeof output.text !== "string") return failed(RUNNER_FAILED);
  return { content: [{ type: "text", text: output.text }] };
}

/** Answer one MCP JSON-RPC request; notifications return undefined. */
export async function respond(request: Request, run: RunRunner = runRunner): Promise<unknown> {
  if (request.id === undefined) return undefined;
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: request.id, result });

  switch (request.method) {
    case "initialize":
      return reply({
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "xai-search", version: "1.0.0" },
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: [TOOL] });
    case "tools/call":
      if (request.params?.name !== TOOL_NAME) {
        return { jsonrpc: "2.0", id: request.id, error: { code: -32602, message: `Unknown tool: ${request.params?.name}` } };
      }
      return reply(await search(request.params.arguments ?? {}, run));
    default:
      return { jsonrpc: "2.0", id: request.id, error: { code: -32601, message: `Method not found: ${request.method}` } };
  }
}

if (import.meta.main) {
  createInterface({ input: process.stdin }).on("line", async (line) => {
    let request: Request;
    try {
      request = JSON.parse(line);
    } catch {
      return;
    }
    const response = await respond(request);
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  });
}
