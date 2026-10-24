import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

// Same server command as [mcp_servers.jev] in config.toml; hooks run outside Codex's MCP host.
const JEV_COMMAND = ["npx", "-y", "@jkudish/jev-mcp"];
const CALL_TIMEOUT_MS = 60_000;

export type JevCall = (tool: string, args: Record<string, unknown>, timeoutMs?: number) => Promise<unknown>;

type RpcMessage = { id?: number; result?: unknown; error?: { message?: string } };
type ToolResult = { isError?: boolean; content?: { type: string; text?: string }[] };

/** Call one Jev tool over a short-lived stdio MCP session and return its parsed JSON body. */
export const callJev: JevCall = (tool, args, timeoutMs = CALL_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const child = spawn(JEV_COMMAND[0]!, JEV_COMMAND.slice(1), { stdio: ["pipe", "pipe", "ignore"] });
  const pending = new Map<number, (message: RpcMessage) => void>();
  const timer = setTimeout(() => finish(new Error("Jev call timed out")), timeoutMs);
  let done = false;

  function finish(error: Error | undefined, value?: unknown) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    child.kill();
    if (error) reject(error);
    else resolve(value);
  }

  function request(id: number, method: string, params: unknown) {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return new Promise<RpcMessage>((settle) => pending.set(id, settle));
  }

  child.on("error", (error) => finish(error));
  child.on("exit", () => finish(new Error("Jev server exited early")));
  createInterface({ input: child.stdout }).on("line", (line) => {
    let message: RpcMessage;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (typeof message.id === "number") pending.get(message.id)?.(message);
  });

  (async () => {
    const init = await request(1, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "codex-jev-hooks", version: "1.0.0" },
    });
    if (init.error) throw new Error("Jev initialize failed");
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

    const call = await request(2, "tools/call", { name: tool, arguments: args });
    const result = call.result as ToolResult | undefined;
    const body = result?.content?.find((block) => block.type === "text")?.text;
    if (call.error || !result || result.isError || body === undefined) throw new Error(`${tool} failed`);
    finish(undefined, JSON.parse(body));
  })().catch((error: Error) => finish(error));
});

/** Read a hook's JSON input from stdin. */
export async function readHookInput(): Promise<Record<string, unknown>> {
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return JSON.parse(text);
}
