// Runs one codemode script for the Claude Code codemode mod.
// Usage: node --permission ... runner.mjs RUN_DIR, with the request as JSON on stdin.
// Protocol: NDJSON on stdout ({ t: "call" } then { t: "done" }); the mod answers each call by
// writing RUN_DIR/r-<id>.json, because the mod can hand a child stdin only once.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_OUTPUT_TOKENS = 10_000;
const DEFAULT_SEARCH_LIMIT = 8;
const RESULT_POLL_MS = 25;
const OPTIONS_LINE = /^\s*\/\/\s*@options:\s*(.*)$/;

const runDir = process.argv[2];
const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);

export function parseOptions(code) {
  const lines = code.split("\n");
  for (let i = 1; i < lines.length; i++) {
    if (OPTIONS_LINE.test(lines[i])) throw new Error("The // @options: line must be the first line of the script.");
  }
  const match = OPTIONS_LINE.exec(lines[0] ?? "");
  if (!match) return {};
  const options = JSON.parse(match[1]);
  if (typeof options !== "object" || options === null || Array.isArray(options)) throw new Error("// @options: must be a JSON object.");
  return options;
}

export function toIdentifier(name) {
  const id = name.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[0-9]/.test(id) ? `_${id}` : id;
}

function namespaceOf(name) {
  const match = /^mcp__(.+?)__/.exec(name);
  return match ? match[1] : undefined;
}

function terms(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((term) => term.length > 1);
}

export function searchCatalog(catalog, query, { limit = DEFAULT_SEARCH_LIMIT, namespace } = {}) {
  const wanted = terms(String(query));
  const pool = namespace ? catalog.filter((tool) => toIdentifier(namespaceOf(tool.name) ?? "") === toIdentifier(namespace.replace(/^mcp__/, ""))) : catalog;
  const scored = pool.map((tool) => {
    const nameTerms = terms(tool.name);
    const descriptionTerms = terms(tool.description);
    let score = 0;
    for (const term of wanted) {
      if (nameTerms.includes(term)) score += 3;
      score += descriptionTerms.filter((word) => word === term).length / (1 + descriptionTerms.length / 50);
    }
    return { tool, score };
  });
  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, limit)
    .map((entry) => ({ name: entry.tool.name, description: entry.tool.description }));
}

function describe(tool) {
  return {
    name: tool.name,
    description: tool.description,
    call: `tools.${toIdentifier(tool.name)}(args)`,
    resolvesTo: "the tool's text output as a string (MCP JSON results arrive as a JSON string)",
    inputSchema: `Not visible to scripts; load it with ToolSearch "select:${tool.name}" before writing the call.`,
  };
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? String(value);
}

function formatError(error) {
  if (error && typeof error === "object" && "message" in error) {
    const name = typeof error.name === "string" && error.name !== "Error" ? `${error.name}: ` : "Error: ";
    return `${name}${error.message}`;
  }
  return String(error);
}

export function composeOutput(items, consoleLines) {
  const parts = items.map((item, index) => (items.length > 1 ? `==> text ${index + 1}/${items.length} <==\n${item}` : item));
  if (consoleLines.length > 0) parts.push(`<console_output>\n${consoleLines.join("\n")}\n</console_output>`);
  return parts.join("\n");
}

export function truncate(text, maxTokens, saveFull) {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  const fullPath = saveFull(text);
  const half = Math.floor(maxChars / 2);
  const removed = text.length - 2 * half;
  return `Warning: truncated output (original token count: ${Math.ceil(text.length / CHARS_PER_TOKEN)}); full output: ${fullPath}\n\n${text.slice(0, half)}…${Math.ceil(removed / CHARS_PER_TOKEN)} tokens truncated…${text.slice(text.length - half)}`;
}

class ExitSignal {}

function createResultWatcher(dir, pending) {
  const consume = (file) => {
    const match = /^r-(\d+)\.json$/.exec(file);
    if (!match) return;
    const full = path.join(dir, file);
    let raw;
    try {
      raw = fs.readFileSync(full, "utf8");
      fs.unlinkSync(full);
    } catch {
      return;
    }
    const id = Number(match[1]);
    const waiter = pending.get(id);
    if (!waiter) return;
    pending.delete(id);
    const answer = JSON.parse(raw);
    if (answer.ok) waiter.resolve(answer.value);
    else waiter.reject(answer.error);
  };
  const sweep = () => {
    for (const file of fs.readdirSync(dir)) consume(file);
  };
  const watcher = fs.watch(dir, (_event, file) => file && consume(String(file)));
  const poll = setInterval(sweep, RESULT_POLL_MS);
  return () => {
    watcher.close();
    clearInterval(poll);
  };
}

export async function runScript(request, { dir, emit }) {
  const started = Date.now();
  const items = [];
  const consoleLines = [];
  const storeWrites = {};
  const store = { ...(request.store ?? {}) };
  const catalog = request.tools ?? [];
  const byIdentifier = new Map(catalog.map((tool) => [toIdentifier(tool.name), tool.name]));
  const pending = new Map();
  let nextId = 1;
  let ok = true;
  let error;
  let options = {};

  const context = vm.createContext({});
  const ContextError = vm.runInContext("Error", context);
  const toContext = vm.runInContext("(json) => json === undefined ? undefined : JSON.parse(json)", context);
  const intoContext = (value) => toContext(JSON.stringify(value));

  const callTool = (name, args) => {
    if (args !== undefined && (typeof args !== "object" || args === null || Array.isArray(args))) {
      return Promise.reject(new ContextError(`tools.${toIdentifier(name)} takes one object of arguments`));
    }
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject: (message) => reject(new ContextError(message)) });
      emit({ t: "call", id, tool: name, args: args ?? {} });
    });
  };

  const tools = new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key !== "string") return undefined;
        const name = byIdentifier.get(key) ?? (catalog.some((tool) => tool.name === key) ? key : undefined);
        if (!name) return undefined;
        return (args) => callTool(name, args);
      },
      has(_target, key) {
        return typeof key === "string" && byIdentifier.has(key);
      },
      ownKeys() {
        return [...byIdentifier.keys()];
      },
      getOwnPropertyDescriptor(_target, key) {
        return byIdentifier.has(key) ? { enumerable: true, configurable: true } : undefined;
      },
    },
  );

  const log = (...args) => consoleLines.push(args.map((arg) => formatValue(arg)).join(" "));
  Object.assign(context, {
    tools,
    text: (value) => items.push(formatValue(value)),
    console: intoContext({}),
    exit: () => {
      throw new ExitSignal();
    },
    store: (key, value) => {
      if (value === undefined) delete store[key];
      else store[key] = JSON.parse(JSON.stringify(value));
      storeWrites[key] = value === undefined ? null : store[key];
    },
    load: (key) => intoContext(store[key]),
    ALL_TOOLS: intoContext(catalog.map((tool) => ({ name: tool.name, description: tool.description }))),
    searchTools: async (query, searchOptions) => intoContext(searchCatalog(catalog, query, searchOptions ?? {})),
    describeTool: async (name) => {
      const tool = catalog.find((entry) => entry.name === name || toIdentifier(entry.name) === name);
      return tool ? intoContext(describe(tool)) : undefined;
    },
    describeNamespace: async (name) => {
      const wanted = toIdentifier(String(name).replace(/^mcp__/, ""));
      const members = catalog.filter((tool) => toIdentifier(namespaceOf(tool.name) ?? "") === wanted);
      return members.length > 0 ? intoContext({ name: `mcp__${wanted}`, tools: members.map((tool) => tool.name) }) : undefined;
    },
  });
  for (const level of ["log", "info", "warn", "error", "debug"]) context.console[level] = log;

  const stopWatching = createResultWatcher(dir, pending);
  try {
    options = parseOptions(request.code);
    const source = `(async () => {\n${request.code}\n})()`;
    const timeoutMs = Number.isInteger(options.timeout_ms) && options.timeout_ms > 0 ? options.timeout_ms : undefined;
    const run = vm.runInContext(source, context, { filename: "codemode.js", timeout: timeoutMs });
    const deadline = timeoutMs
      ? new Promise((_, reject) => setTimeout(() => reject(new Error(`Script timed out after ${timeoutMs} ms`)), timeoutMs).unref())
      : undefined;
    const value = await (deadline ? Promise.race([run, deadline]) : run);
    if (value !== undefined) items.push(formatValue(value));
  } catch (caught) {
    if (!(caught instanceof ExitSignal)) {
      ok = false;
      error = formatError(caught);
    }
  } finally {
    stopWatching();
  }

  const maxTokens = Number.isInteger(options.max_output_tokens) && options.max_output_tokens > 0 ? options.max_output_tokens : DEFAULT_MAX_OUTPUT_TOKENS;
  const saveFull = (text) => {
    const full = path.join(dir, "output.txt");
    fs.writeFileSync(full, text);
    return full;
  };
  let body = truncate(composeOutput(items, consoleLines), maxTokens, saveFull);
  if (!ok) body = `${body}${body ? "\n" : ""}Script error:\n${error}`;
  const wall = ((Date.now() - started) / 1000).toFixed(1);
  return {
    t: "done",
    ok,
    text: `${ok ? "Script completed" : "Script failed"}\nWall time ${wall} seconds\nOutput:\n${body}`,
    store: ok ? storeWrites : {},
    keepDir: fs.existsSync(path.join(dir, "output.txt")),
  };
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Unawaited promises that reject are discarded, as Pi's codemode does.
  process.on("unhandledRejection", () => {});
  const request = JSON.parse(await readStdin());
  send({ t: "ready", dir: runDir });
  const done = await runScript(request, { dir: runDir, emit: send });
  send(done);
  process.exit(0);
}
