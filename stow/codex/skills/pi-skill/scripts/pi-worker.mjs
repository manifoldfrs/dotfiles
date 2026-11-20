import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { createInterface } from "node:readline";
import { setTimeout as delay } from "node:timers/promises";

const jobPrefix = "pi-worker-";
const signals = ["SIGINT", "SIGTERM", "SIGHUP"];

class WorkerError extends Error {
  constructor(message, status = 1) {
    super(message);
    this.status = status;
  }
}

async function readConfig() {
  const path = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "pi-worker.json");

  const config = JSON.parse(await readFile(path, "utf8").catch((error) => {
    if (error.code !== "ENOENT") throw error;
    throw new WorkerError(`create ${path} with executable, agentDir, and timeoutSeconds; see the pi-skill setup instructions`);
  }));

  const { executable, agentDir, timeoutSeconds } = config ?? {};

  try {
    if (!isAbsolute(executable) || !isAbsolute(agentDir)) throw new Error("relative path");
  } catch {
    throw new WorkerError("executable and agentDir must be absolute paths");
  }

  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 86400) {
    throw new WorkerError("timeoutSeconds must be an integer between 1 and 86400");
  }

  const state = await realpath(agentDir);
  const live = join(homedir(), ".pi", "agent");

  const liveState = await realpath(live).catch((error) => {
    if (error.code !== "ENOENT") throw error;

    return live;
  });

  if (state === liveState || !(await stat(state)).isDirectory()) {
    throw new WorkerError("agentDir must be an existing directory separate from the live Pi agent directory");
  }

  return { executable, state, timeoutSeconds };
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);

    return true;
  } catch (error) {
    if (error.code !== "ESRCH") throw error;

    return false;
  }
}

async function withJob(config, run) {
  const dir = await mkdtemp(join(config.state, jobPrefix));
  const cancelPath = join(dir, "cancel");
  let pid;
  let stopped;
  let escalation;

  function stop(error) {
    if (stopped) return;
    stopped = error;
    const group = pid;

    if (group && signalGroup(group, "SIGTERM")) {
      escalation = delay(1000).then(() => signalGroup(group, "SIGKILL"));
    }
  }

  const onSignal = () => stop(new WorkerError("cancelled", 130));

  for (const signal of signals) process.on(signal, onSignal);

  const cancellation = setInterval(() => {
    if (existsSync(cancelPath)) onSignal();
  }, 100);

  const deadline = setTimeout(() => stop(new WorkerError(`timed out after ${config.timeoutSeconds}s`, 124)), config.timeoutSeconds * 1000);

  try {
    console.error(`pi-skill: job ${basename(dir)}`);

    return await run(async (args, input, onEvent) => {
      if (stopped) throw stopped;

      const child = spawn(config.executable, args, {
        detached: true,
        env: { ...process.env, PI_CODING_AGENT_DIR: config.state },
        stdio: [input ? "pipe" : "ignore", "pipe", "inherit"],
      });

      pid = child.pid;
      const lines = createInterface({ input: child.stdout });
      lines.on("line", (line) => {
        let event;

        try {
          event = JSON.parse(line);
        } catch {
          return;
        }

        onEvent(event);
      });

      if (input) {
        child.stdin.on("error", () => child.stdin.destroy());
        child.stdin.end(`${JSON.stringify(input)}\n`);
      }

      const exit = await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => resolve({ code, signal }));
      });

      pid = undefined;

      if (stopped) throw stopped;

      return exit;
    });
  } finally {
    clearTimeout(deadline);
    clearInterval(cancellation);
    await escalation;

    for (const signal of signals) process.off(signal, onSignal);

    await rm(dir, { recursive: true, force: true });
  }
}

async function cancel(id) {
  if (!/^pi-worker-[a-zA-Z0-9]{6}$/.test(id ?? "")) throw new WorkerError("invalid job ID", 2);
  const config = await readConfig();
  await writeFile(join(config.state, id, "cancel"), "", { flag: "wx", mode: 0o600 }).catch((error) => {
    if (error.code === "ENOENT") throw new WorkerError(`job ${id} is no longer available`);

    if (error.code !== "EEXIST") throw error;
  });
  console.log("Cancellation requested");
}

async function catalog(pi, command) {
  let response;
  const id = "pi-worker-catalog";

  const exit = await pi(["--offline", "--mode", "rpc", "--no-session"], { id, type: command }, (event) => {
    if (event?.type === "response" && event.id === id) response = event;
  });

  if (exit.code !== 0 || !response?.success || !response.data) {
    throw new WorkerError(`Pi did not return its ${command} catalog`);
  }

  return response.data;
}

async function printResult(pi, prompt, route) {
  const args = ["--print", "--mode", "json", "--no-session"];

  if (route) args.push("--model", route);
  let message;

  const exit = await pi([...args, prompt], null, (event) => {
    if (event?.type === "message_end" && event.message?.role === "assistant") message = event.message;
  });

  if (message?.stopReason === "error" || message?.stopReason === "aborted" || message?.stopReason === "length") {
    throw new WorkerError(message.errorMessage || `Pi stopped: ${message.stopReason}`);
  }

  if (exit.code !== 0) throw new WorkerError(`Pi exited with ${exit.signal || exit.code}`);

  if (route && `${message?.provider}/${message?.model}` !== route) {
    throw new WorkerError(`Pi did not return a response from ${route}`);
  }

  const output = message?.content?.filter((part) => part.type === "text").map((part) => part.text).join("\n");

  if (message?.stopReason !== "stop" || !output?.trim()) throw new WorkerError("Pi exited without a final answer");
  console.log(output);
}

async function main([action, name, brief, ...extra]) {
  if (action === "cancel" && name && brief === undefined) return cancel(name);
  const listing = action === "list" && name === undefined;

  if (!listing && (!(action === "run" || action === "model") || !name || /\s/.test(name) || !brief?.trim() || extra.length)) {
    throw new WorkerError("usage: pi-skill list | run <skill> <brief> | model <provider/model> <brief> | cancel <job-id>", 2);
  }

  const config = await readConfig();
  await withJob(config, async (pi) => {
    if (action === "model") {
      const { models } = await catalog(pi, "get_available_models");

      if (!models.some((model) => `${model.provider}/${model.id}` === name)) {
        throw new WorkerError(`Pi did not load model ${name}; no fallback was attempted`);
      }

      await printResult(pi, `Task:\n${brief}`, name);

      return;
    }

    const { commands } = await catalog(pi, "get_commands");
    const skills = commands.filter((command) => command.source === "skill");

    if (listing) {
      for (const skill of skills.sort((a, b) => a.name.localeCompare(b.name))) {
        console.log(`${skill.name.slice(6)}\t${(skill.description ?? "").replace(/\s+/g, " ")}`);
      }

      return;
    }

    if (!skills.some((skill) => skill.name === `skill:${name}`)) {
      throw new WorkerError(`Pi did not load skill ${name} in this directory; run pi-skill list`);
    }

    await printResult(pi, `/skill:${name} ${brief}`);
  });
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`pi-skill: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = error instanceof WorkerError ? error.status : 1;
}
