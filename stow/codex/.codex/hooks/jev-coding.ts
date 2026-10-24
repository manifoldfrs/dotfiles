import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { callJev, readHookInput, type JevCall } from "./jev-mcp-client.ts";

const CLASSES = [
  { id: "requested", description: "Directly carries out what the user asked, including tests or docs the request needs." },
  { id: "scope_creep", description: "Changes behavior, files, or code the request did not ask for, including unrelated refactors or reformatting." },
  { id: "speculative", description: "Adds abstraction, configuration, defaults, or defensive handling the request did not need." },
  { id: "leftover", description: "Debug output, commented-out code, TODO notes, or temporary scaffolding." },
];
const FLAGGED = new Set(["scope_creep", "speculative", "leftover"]);
const CLASSIFY_BATCH = 64;
const ITEM_CHARS = 2_000;
const RECENT_PROMPTS = 3;
const FILE_HEADER = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/;

const DECISION_REMINDER =
  "Jev decision check: if this edit carries out a choice between approaches (library, design, data model, or fix strategy) that you have not run through jev_decide, run jev_decide now with the options, the evidence, and the user's stated priorities, and report its verdict.";
const AUDIT_FAILED =
  "Automatic Jev edit-scope audit failed. Do not claim it passed; perform the normal final review and completion gate.";

export type CodeEdit = { file: string; patch: string };
export type AuditState = { prompts: string[]; edits: CodeEdit[] };
type Verdict = { id: string; classification: string; top_probability: number; decision: string };
type HookOutput =
  | { decision: "block"; reason: string }
  | { hookSpecificOutput: { hookEventName: "PostToolUse"; additionalContext: string } };

/** Split an apply_patch envelope into one edit per touched file. */
export function patchEdits(patch: string): CodeEdit[] {
  const edits: CodeEdit[] = [];
  for (const line of patch.split("\n")) {
    const header = FILE_HEADER.exec(line);
    if (header) edits.push({ file: header[1]!.trim(), patch: "" });
    else if (edits.length && line !== "*** End Patch") edits.at(-1)!.patch += `${line}\n`;
  }
  return edits;
}

function itemText(edit: CodeEdit) {
  return `${edit.file}\n${edit.patch}`.slice(0, ITEM_CHARS);
}

async function classify(call: JevCall, state: AuditState, batch: CodeEdit[], offset: number) {
  const parsed = await call("jev_classify", {
    purpose: "Judge whether each edit a coding agent made is what the user's request called for.",
    context: { request: state.prompts.join("\n---\n") },
    classes: CLASSES,
    items: batch.map((edit, index) => ({ id: String(offset + index), text: itemText(edit) })),
  });
  if (!parsed || typeof parsed !== "object" || !("results" in parsed) || !Array.isArray(parsed.results) || parsed.results.length !== batch.length) {
    throw new Error("Jev coding returned incomplete audit results");
  }
  const expected = new Set(batch.map((_, index) => String(offset + index)));
  const verdicts: Verdict[] = [];
  for (const item of parsed.results as unknown[]) {
    if (!item || typeof item !== "object" || !("id" in item) || typeof item.id !== "string" || !expected.delete(item.id)
      || !("classification" in item) || typeof item.classification !== "string" || !CLASSES.some((entry) => entry.id === item.classification)
      || !("top_probability" in item) || typeof item.top_probability !== "number" || !Number.isFinite(item.top_probability)
      || item.top_probability < 0 || item.top_probability > 1
      || !("decision" in item) || (item.decision !== "auto" && item.decision !== "review")) {
      throw new Error("Jev coding returned an invalid audit verdict");
    }
    verdicts.push({ id: item.id, classification: item.classification, top_probability: item.top_probability, decision: item.decision });
  }
  return verdicts;
}

function line(state: AuditState, verdict: Verdict) {
  const edit = state.edits[Number(verdict.id)];
  const added = edit?.patch.split("\n").find((text) => text.startsWith("+") && text.slice(1).trim()) ?? "";
  return `- ${edit?.file} (${verdict.classification}, p=${verdict.top_probability}): ${added.slice(1).trim().slice(0, 80)}`;
}

/** Classify the turn's edits and describe the ones Jev places outside the request. */
export async function review(call: JevCall, state: AuditState): Promise<string | undefined> {
  const verdicts: Verdict[] = [];
  for (let offset = 0; offset < state.edits.length; offset += CLASSIFY_BATCH) {
    verdicts.push(...(await classify(call, state, state.edits.slice(offset, offset + CLASSIFY_BATCH), offset)));
  }

  const flagged = verdicts.filter((verdict) => FLAGGED.has(verdict.classification));
  const confident = flagged.filter((verdict) => verdict.decision === "auto");
  if (!confident.length) return undefined;

  const unsure = flagged.filter((verdict) => verdict.decision !== "auto");
  return [
    "Jev classified edits from this turn as outside the request:",
    ...confident.map((verdict) => line(state, verdict)),
    ...(unsure.length ? ["Less certain:", ...unsure.map((verdict) => line(state, verdict))] : []),
    "For each one, revert it or tell the user why it was needed, then finish.",
  ].join("\n");
}

/** Advance the audit for one hook event; returns the new state and any hook output. */
export async function handle(
  input: Record<string, unknown>,
  state: AuditState,
  call: JevCall = callJev,
): Promise<{ state: AuditState; output?: HookOutput }> {
  // Subagents report the parent session id; their own tasks are not the user's request.
  if (typeof input.agent_id === "string") return { state };

  if (input.hook_event_name === "UserPromptSubmit") {
    const prompts = typeof input.prompt === "string" && input.prompt ? [...state.prompts, input.prompt] : state.prompts;
    return { state: { prompts: prompts.slice(-RECENT_PROMPTS), edits: [] } };
  }

  if (input.hook_event_name === "PostToolUse") {
    const command = (input.tool_input as { command?: unknown } | undefined)?.command;
    if (input.tool_name !== "apply_patch" || typeof command !== "string") return { state };
    const added = patchEdits(command);
    if (!added.length) return { state };
    const next = { ...state, edits: [...state.edits, ...added] };
    if (state.edits.length) return { state: next };
    return { state: next, output: { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: DECISION_REMINDER } } };
  }

  // stop_hook_active means this stop follows our own block, so each turn is checked once.
  if (input.hook_event_name === "Stop" && input.stop_hook_active !== true && state.edits.length) {
    const reason = await review(call, state).catch(() => AUDIT_FAILED);
    const next = { ...state, edits: [] };
    return reason ? { state: next, output: { decision: "block", reason } } : { state: next };
  }

  return { state };
}

function statePath(sessionId: string) {
  return join(tmpdir(), "codex-jev-coding", `${sessionId.replace(/[^\w-]/g, "_")}.json`);
}

async function loadState(path: string): Promise<AuditState> {
  try {
    const saved = JSON.parse(await readFile(path, "utf8")) as AuditState;
    if (Array.isArray(saved.prompts) && Array.isArray(saved.edits)) return saved;
  } catch {
    // A missing or unreadable file starts a fresh audit.
  }
  return { prompts: [], edits: [] };
}

if (import.meta.main) {
  const input = await readHookInput();
  if (typeof input.session_id === "string") {
    const path = statePath(input.session_id);
    const { state, output } = await handle(input, await loadState(path));
    if (state.prompts.length || state.edits.length) {
      await mkdir(join(tmpdir(), "codex-jev-coding"), { recursive: true, mode: 0o700 });
      await writeFile(path, JSON.stringify(state), { mode: 0o600 });
    } else {
      await rm(path, { force: true });
    }
    if (output) process.stdout.write(JSON.stringify(output));
  }
}
