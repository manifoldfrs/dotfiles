import assert from "node:assert";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { searchCatalog, toIdentifier } from "./runner.mjs";

const LAUNCH = path.join(path.dirname(fileURLToPath(import.meta.url)), "launch.sh");
const TOOLS = [
  { name: "Bash", description: "Executes a bash command." },
  { name: "mcp__orders__get_order", description: "Fetch one order by id." },
  { name: "mcp__chrome-devtools__click", description: "Click an element on the page." },
];

// Plays the mod's part: answers each call with handler(call) by writing the result file.
function run(code, handler = () => ({ ok: true, value: "" }), extra = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("/bin/sh", [LAUNCH], { stdio: ["pipe", "pipe", "pipe"] });
    const calls = [];
    let dir;
    let buffer = "";
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const message = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (message.t === "ready") dir = message.dir;
        if (message.t === "call") {
          calls.push(message);
          Promise.resolve(handler(message)).then((answer) => {
            fs.writeFileSync(path.join(dir, `r-${message.id}.json.tmp`), JSON.stringify(answer));
            fs.renameSync(path.join(dir, `r-${message.id}.json.tmp`), path.join(dir, `r-${message.id}.json`));
          });
        }
        if (message.t === "done") resolve({ ...message, calls, dir });
      }
    });
    child.on("exit", (code) => code !== 0 && reject(new Error(`runner exited ${code}: ${stderr}`)));
    child.stdin.end(JSON.stringify({ code, tools: TOOLS, ...extra }));
  });
}

test("returns a value with Pi's header", async () => {
  const done = await run("return 1 + 1");
  assert.ok(done.ok);
  assert.match(done.text, /^Script completed\nWall time \d+\.\d seconds\nOutput:\n2$/);
});

test("runs tool calls in parallel and resolves them to text", async () => {
  const done = await run(
    "const r = await Promise.all([1, 2, 3].map((id) => tools.mcp__orders__get_order({ id })));\nreturn r.map((t) => JSON.parse(t).id);",
    async (call) => {
      await new Promise((r) => setTimeout(r, 100));
      return { ok: true, value: JSON.stringify({ id: call.args.id }) };
    },
  );
  assert.ok(done.ok, done.text);
  assert.deepStrictEqual(done.calls.map((call) => call.tool), Array(3).fill("mcp__orders__get_order"));
  assert.match(done.text, /\[\n  1,\n  2,\n  3\n\]/);
  assert.match(done.text, /Wall time 0\.[1-4] seconds/, "three 100 ms calls should overlap");
});

test("maps non-identifier names and rejects failed calls with an Error", async () => {
  const done = await run(
    "try { await tools.mcp__chrome_devtools__click({}) } catch (e) { return [e instanceof Error, e.message] }",
    () => ({ ok: false, error: "denied by hook" }),
  );
  assert.strictEqual(done.calls[0].tool, "mcp__chrome-devtools__click");
  assert.match(done.text, /true,\n  "denied by hook"/);
});

test("keeps partial output and console lines when a script fails", async () => {
  const done = await run('text("first"); console.log("note", { a: 1 }); throw new TypeError("boom")');
  assert.ok(!done.ok);
  assert.match(done.text, /^Script failed/);
  assert.match(done.text, /first\n<console_output>\nnote {\n  "a": 1\n}\n<\/console_output>\nScript error:\nTypeError: boom$/);
});

test("numbers several text items, and exit() ends successfully", async () => {
  const done = await run('text("a"); text("b"); exit(); text("c")');
  assert.ok(done.ok);
  assert.match(done.text, /==> text 1\/2 <==\na\n==> text 2\/2 <==\nb$/);
});

test("an options line anywhere but first fails the script", async () => {
  const done = await run('return 1\n// @options: {"timeout_ms": 10}');
  assert.ok(!done.ok);
  assert.match(done.text, /must be the first line/);
});

test("timeout_ms ends a script that waits too long", async () => {
  const done = await run('// @options: {"timeout_ms": 200}\nawait tools.Bash({ command: "sleep" })', () => new Promise(() => {}));
  assert.ok(!done.ok);
  assert.match(done.text, /timed out after 200 ms/);
});

test("max_output_tokens truncates and saves the full output", async () => {
  const done = await run('// @options: {"max_output_tokens": 10}\nreturn "x".repeat(500)');
  assert.ok(done.ok);
  assert.ok(done.keepDir);
  assert.match(done.text, /truncated output/);
  assert.strictEqual(fs.readFileSync(path.join(done.dir, "output.txt"), "utf8"), "x".repeat(500));
  fs.rmSync(done.dir, { recursive: true });
});

test("store writes are reported, and load reads the given store", async () => {
  const done = await run('store("cursor", 15); store("old", undefined); return load("seen")', undefined, { store: { seen: [1, 2] } });
  assert.deepStrictEqual(done.store, { cursor: 15, old: null });
  assert.match(done.text, /\[\n  1,\n  2\n\]/);
});

test("discovery globals list, search, and describe tools", async () => {
  const done = await run(
    'return [ALL_TOOLS.length, (await searchTools("order")).map(t => t.name), (await describeTool("mcp__chrome_devtools__click")).call, (await describeNamespace("chrome-devtools")).tools]',
  );
  assert.ok(done.ok, done.text);
  assert.match(done.text, /3,\n  \[\n    "mcp__orders__get_order"\n  \],\n  "tools.mcp__chrome_devtools__click\(args\)",\n  \[\n    "mcp__chrome-devtools__click"\n  \]/);
});

test("the sandbox has no Node globals", async () => {
  const done = await run("return [typeof require, typeof process, typeof fetch, typeof setTimeout]");
  assert.match(done.text, /"undefined",\n  "undefined",\n  "undefined",\n  "undefined"/);
});

test("escaping the vm context still hits Node's permission model", async () => {
  const escape = 'const p = text.constructor.constructor("return process")();';
  const tries = [
    'p.getBuiltinModule("node:child_process").execSync("echo pwned")',
    'p.getBuiltinModule("node:fs").readFileSync("/etc/hosts")',
    'p.getBuiltinModule("node:fs").writeFileSync(p.env.HOME + "/codemode-escape-test", "x")',
  ];
  for (const attempt of tries) {
    const done = await run(`${escape}\n${attempt}\nreturn "escaped"`);
    assert.ok(!done.ok, `should be blocked: ${attempt}`);
    assert.match(done.text, /Access to this API has been restricted/);
  }
});

test("helpers", () => {
  assert.strictEqual(toIdentifier("mcp__dev-radius__search"), "mcp__dev_radius__search");
  assert.deepStrictEqual(searchCatalog(TOOLS, "click page", { namespace: "mcp__chrome-devtools" }).map((t) => t.name), ["mcp__chrome-devtools__click"]);
});
