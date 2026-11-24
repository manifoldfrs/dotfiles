import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executable = fileURLToPath(new URL("../stow/bin/.local/bin/artifact-review", import.meta.url));
const run = promisify(execFile);

test("the review returns one decision tied to the HTML snapshot it served", { timeout: 5000 }, async (t) => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), "artifact-review-")));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const target = join(dir, "review.html");
  const original = '<h1 id="retry">Retry for 30 seconds</h1>';
  await writeFile(target, original);

  const { review, finish, result, output } = await startReview(t, ["--no-open", target]);
  await writeFile(target, '<h1 id="retry">Retry for 60 seconds</h1>');
  const artifact = await fetch(new URL("artifact", review));
  assert.equal(artifact.status, 200);
  assert.equal(await artifact.text(), original);

  const anchor = {
    kind: "text",
    id: "retry-policy",
    selector: "#retry",
    quote: "30 seconds",
    source: "worker.js:42",
    comment: "Explain this deadline.",
  };
  const decision = { decision: "annotated", annotations: [anchor] };

  assert.equal(await finish("https://example.invalid", decision), 403);
  assert.equal(await finish(review.origin, { ...decision, annotations: [] }), 400);
  assert.equal(output(), "");
  assert.equal(await finish(review.origin, decision), 200);
  assert.deepEqual(await result(), {
    target,
    revision: createHash("sha256").update(original).digest("hex"),
    ...decision,
  });
});

async function startReview(t, args, env = process.env) {
  const child = spawn(process.execPath, [executable, ...args], { env, stdio: ["ignore", "pipe", "pipe"] });
  const closed = once(child, "close");
  let output = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
  const lines = createInterface({ input: child.stderr });
  t.after(async () => {
    lines.close();
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  });

  const { value } = await lines[Symbol.asyncIterator]().next();
  assert.match(value, /^Review URL: http:\/\/127\.0\.0\.1:\d+\//);
  const review = new URL(value.slice("Review URL: ".length));
  const finish = async (origin, body) => {
    const response = await fetch(new URL("finish", review), {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await response.text();
    return response.status;
  };

  return { review, finish, output: () => output, result: async () => {
    assert.deepEqual(await closed, [0, null]);
    return JSON.parse(output);
  } };
}

test("sending feedback queues one message in the originating Codex thread", { timeout: 5000 }, async (t) => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), "artifact-notify-test-")));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const target = join(dir, "review.html");
  const log = join(dir, "queued.json");
  await writeFile(target, "<h1>Review this</h1>");
  await writeFile(join(dir, "codex"), `#!/usr/bin/env node
const fs = require("node:fs");
const log = ${JSON.stringify(log)};
if (!fs.existsSync(log)) {
  fs.writeFileSync(log, "first attempt failed");
  process.exit(1);
}
fs.writeFileSync(log, JSON.stringify(process.argv.slice(2)));
`, { mode: 0o700 });
  const thread = "12345678-1234-1234-1234-123456789012";
  const { review, finish, result, output } = await startReview(t, ["--notify-codex", "--no-open", target], {
    ...process.env,
    PATH: dir + ":" + process.env.PATH,
    CODEX_THREAD_ID: thread,
    TMPDIR: dir,
  });
  const annotation = { kind: "document", id: "", selector: "", quote: "", source: "", comment: "Clarify the plan." };
  const decision = { decision: "annotated", annotations: [annotation] };
  assert.equal(await finish(review.origin, decision), 502);
  assert.equal(output(), "");
  assert.equal(await finish(review.origin, decision), 200);
  const [command, threadFlag, queuedThread, messageFlag, message] = JSON.parse(await readFile(log, "utf8"));
  assert.deepEqual([command, threadFlag, queuedThread, messageFlag], ["queue", "--thread", thread, "--message"]);
  const feedbackPath = JSON.parse(message.match(/Read the JSON at ("[^"]+")./)[1]);
  assert.ok(feedbackPath.startsWith(join(dir, "agent-artifacts", "artifact-review", thread) + "/"));
  assert.deepEqual(JSON.parse(await readFile(feedbackPath, "utf8")), await result());
});

test("cleanup removes only the current thread's workspace and can be repeated", async (t) => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), "artifact-clean-test-")));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const current = "12345678-1234-1234-1234-123456789012";
  const other = "87654321-4321-4321-4321-210987654321";
  const command = (action, thread) => run(process.execPath, [executable, action], {
    env: { ...process.env, TMPDIR: dir, CODEX_THREAD_ID: thread },
  });
  const workspace = (await command("workspace", current)).stdout.trim();
  const neighbor = (await command("workspace", other)).stdout.trim();
  const ownedFile = join(workspace, "review.html");
  const outsideFile = join(dir, "keep.html");
  await writeFile(ownedFile, "<h1>Draft</h1>");
  await writeFile(outsideFile, "<h1>Keep</h1>");
  await symlink(outsideFile, join(workspace, "linked.html"));

  await command("clean", current);
  await command("clean", current);
  await assert.rejects(stat(workspace), { code: "ENOENT" });
  assert.equal((await stat(neighbor)).isDirectory(), true);
  assert.equal(await readFile(outsideFile, "utf8"), "<h1>Keep</h1>");

  await symlink(dir, workspace, "dir");
  await assert.rejects(command("clean", current), /real directory/);
  await assert.rejects(command("clean", ".."), /valid CODEX_THREAD_ID/);
  assert.equal(await readFile(outsideFile, "utf8"), "<h1>Keep</h1>");
});

test("SessionEnd cleans the ended thread once its feedback is handled", async (t) => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), "artifact-exit-test-")));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const thread = "12345678-1234-1234-1234-123456789012";
  const other = "87654321-4321-4321-4321-210987654321";
  const env = { ...process.env, TMPDIR: dir, CODEX_THREAD_ID: thread };
  const workspace = (await run(process.execPath, [executable, "workspace"], { env })).stdout.trim();
  const neighbor = (await run(process.execPath, [executable, "workspace"], {
    env: { ...env, CODEX_THREAD_ID: other },
  })).stdout.trim();
  const review = join(workspace, "review.html");
  await writeFile(review, "<h1>Draft</h1>");
  const pending = await mkdtemp(join(workspace, "feedback-"));
  const feedback = join(pending, "feedback.json");
  await writeFile(feedback, "{}");

  const emit = (event) => execFileSync(process.execPath, [executable, "session-end"], {
    env: { ...env, CODEX_THREAD_ID: other },
    input: JSON.stringify({ hook_event_name: event, session_id: thread }),
  });
  emit("Stop");
  emit("SessionEnd");
  assert.equal(await readFile(review, "utf8"), "<h1>Draft</h1>");
  await assert.rejects(run(process.execPath, [executable, "acknowledge", feedback], {
    env: { ...env, CODEX_THREAD_ID: other },
  }));
  assert.equal(await readFile(feedback, "utf8"), "{}");

  await run(process.execPath, [executable, "acknowledge", feedback], { env });
  emit("SessionEnd");
  emit("SessionEnd");
  await assert.rejects(stat(workspace), { code: "ENOENT" });
  assert.equal((await stat(neighbor)).isDirectory(), true);
});
