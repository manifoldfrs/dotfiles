import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { listOf, numberOf, objectOf, parseJson, textOf, type CallJev, type Json, type JsonObject } from "./shared.ts";

// Pi's extension loader does not expose pi-mcp, and event handlers get no executeTool(),
// so the checks speak just enough MCP over stdio to call the Jev server from Pi's mcp.json.
const JEV_SERVER = "jev";
const PROTOCOL_VERSION = "2025-06-18";
const REQUEST_TIMEOUT_MS = 120_000;
const METHOD_NOT_FOUND = -32601;

type Pending = { resolve: (result: Json) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };

class StdioMcp {
  private nextId = 1;
  private buffer = "";
  private readonly pending = new Map<number, Pending>();

  constructor(private readonly child: ChildProcessWithoutNullStreams, private readonly onExit: () => void) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => this.read(chunk));
    child.stderr.resume();
    child.on("error", (error) => this.fail(error));
    // Writing to a server that already exited raises EPIPE here; unhandled, it would crash Pi.
    child.stdin.on("error", (error) => this.fail(error));
    child.on("exit", () => this.fail(new Error("Jev MCP server exited")));
  }

  request(method: string, params: JsonObject): Promise<Json> {
    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timer });
      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  notify(method: string): void {
    this.send({ jsonrpc: "2.0", method });
  }

  close(): void {
    this.child.kill();
  }

  private send(message: JsonObject): void {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private read(chunk: string): void {
    this.buffer += chunk;

    for (let end = this.buffer.indexOf("\n"); end !== -1; end = this.buffer.indexOf("\n")) {
      const line = this.buffer.slice(0, end).trim();
      this.buffer = this.buffer.slice(end + 1);

      if (line) this.handle(line);
    }
  }

  private handle(line: string): void {
    let message: JsonObject | undefined;

    try {
      message = objectOf(parseJson(line));
    } catch {
      return;
    }

    const id = message?.id;

    // The server asked us something; this client offers no capabilities, so every request is unknown.
    if (textOf(message?.method) !== undefined) {
      if (id !== undefined) this.send({ jsonrpc: "2.0", id, error: { code: METHOD_NOT_FOUND, message: "Method not found" } });

      return;
    }

    const numericId = numberOf(id);
    const waiting = numericId === undefined ? undefined : this.pending.get(numericId);

    if (numericId === undefined || !waiting) return;
    this.pending.delete(numericId);
    clearTimeout(waiting.timer);
    const error = objectOf(message?.error);

    if (error) waiting.reject(new Error(textOf(error.message) ?? "MCP request failed"));
    else waiting.resolve(message?.result ?? null);
  }

  private fail(error: Error): void {
    for (const waiting of this.pending.values()) {
      clearTimeout(waiting.timer);
      waiting.reject(error);
    }

    this.pending.clear();
    this.onExit();
  }
}

type StdioServer = { command: string; args: string[]; env: Record<string, string> };

const ENV_REFERENCE = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

// mcp.json writes secrets as ${NAME}, as Pi expands them; a `!command` value would need a shell, so it is refused.
function expandEnv(key: string, value: string): string {
  if (value.startsWith("!")) throw new Error(`Pi's mcp.json "${JEV_SERVER}" env ${key} runs a command, which the Jev checks do not support`);

  return value.replace(ENV_REFERENCE, (_match, name: string) => process.env[name] ?? "");
}

async function jevServer(): Promise<StdioServer> {
  const config = parseJson(await readFile(join(getAgentDir(), "mcp.json"), "utf8"));
  const server = objectOf(objectOf(objectOf(config)?.mcpServers)?.[JEV_SERVER]);
  const command = textOf(server?.command);

  if (!command) throw new Error(`Pi's mcp.json has no stdio "${JEV_SERVER}" server`);
  const args = listOf(server?.args).flatMap((arg) => textOf(arg) ?? []);

  const env = Object.fromEntries(Object.entries(objectOf(server?.env) ?? {}).flatMap(([key, value]) => {
    const text = textOf(value);

    return text === undefined ? [] : [[key, expandEnv(key, text)]];
  }));

  return { command, args, env };
}

let connecting: Promise<StdioMcp> | undefined;

function forget(started: Promise<StdioMcp>) {
  if (connecting === started) connecting = undefined;
}

function client(): Promise<StdioMcp> {
  if (connecting) return connecting;

  const started: Promise<StdioMcp> = (async () => {
    const server = await jevServer();
    const child = spawn(server.command, server.args, { env: { ...process.env, ...server.env }, stdio: ["pipe", "pipe", "pipe"] });
    const mcp = new StdioMcp(child, () => forget(started));
    await mcp.request("initialize", { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "pi-jev-checks", version: "1.0.0" } });
    mcp.notify("notifications/initialized");

    return mcp;
  })();

  connecting = started;
  started.catch(() => forget(started));

  return started;
}

/** Calls a Jev MCP tool for its JSON result. */
export const callJev: CallJev = async (tool, args) => {
  const result = objectOf(await (await client()).request("tools/call", { name: tool, arguments: args }));
  const block = listOf(result?.content).map(objectOf).find((part) => part?.type === "text");
  const text = textOf(block?.text);

  if (result?.isError === true || text === undefined) throw new Error(`${tool} failed${text ? `: ${text.slice(0, 200)}` : ""}`);

  return parseJson(text);
};

export async function closeJev(): Promise<void> {
  const pending = connecting;
  connecting = undefined;
  const mcp = await pending?.catch(() => undefined);
  mcp?.close();
}
