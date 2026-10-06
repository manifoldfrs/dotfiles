import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { classifyWithJev } from "./jev-classifier.ts";

const EDIT_CHARS = 2_000;
const AUDIT_BATCH = 32;
const EDIT_CLASSES = {
  requested: "Directly implements the user's request, including necessary tests and documentation.",
  scope_creep: "Changes unrelated behavior or adds an unrequested refactor or reformatting.",
  speculative: "Adds abstraction, defaults, configuration, or defensive handling without a current requirement.",
  leftover: "Adds debug output, commented-out code, TODO notes, or temporary scaffolding.",
};
type RecordedEdit = { path: string; before: string | null; after: string };

/** Audit successful edit/write calls once per user request, including nested Codemode calls. */
export function registerJevCoding(pi: ExtensionAPI): void {
  let request = "";
  let edits: RecordedEdit[] = [];
  let reviewed = false;

  pi.on("before_agent_start", (event) => {
    request = event.prompt;
    edits = [];
    reviewed = false;
  });

  pi.on("tool_result", (event) => {
    if (event.isError || (event.toolName !== "edit" && event.toolName !== "write")) return;
    const { path, content } = event.input;
    if (typeof path !== "string") return;
    if (event.toolName === "write") {
      if (typeof content === "string") edits.push({ path, before: null, after: content });
      return;
    }
    if (!Array.isArray(event.input.edits)) return;
    const replacements: unknown[] = event.input.edits;
    for (const replacement of replacements) {
      if (typeof replacement !== "object" || replacement === null) continue;
      if (!("oldText" in replacement) || !("newText" in replacement)) continue;
      const { oldText, newText } = replacement;
      if (typeof oldText !== "string" || typeof newText !== "string") continue;
      edits.push({ path, before: oldText, after: newText });
    }
  });

  pi.on("agent_before_settle", async (event, ctx) => {
    if (reviewed || !edits.length || event.outcome !== "completed" || ctx.signal?.aborted) return;
    reviewed = true;
    const flagged: string[] = [];
    try {
      for (let offset = 0; offset < edits.length; offset += AUDIT_BATCH) {
        const batch = edits.slice(offset, offset + AUDIT_BATCH);
        const result = await classifyWithJev(ctx, {
          state: {
            request,
            edits: batch.map((edit, index) => ({
              id: String(index),
              path: edit.path,
              before: edit.before === null ? null : edit.before.slice(0, EDIT_CHARS),
              after: edit.after.slice(0, EDIT_CHARS),
            })),
          },
          questions: Object.fromEntries(batch.map((_, index) => [String(index), {
            type: "choice" as const,
            instructions: `Classify edit ${index} against the user's request. Necessary supporting changes count as requested.`,
            criteria: EDIT_CLASSES,
          }])),
        });
        for (const [index, edit] of batch.entries()) {
          const answer = result.answers[String(index)];
          if (answer?.type !== "choice" || !(answer.choice in EDIT_CLASSES)) {
            throw new Error("Jev coding: invalid audit answer");
          }
          if (answer.choice !== "requested" && answer.confidence >= 0.8) {
            flagged.push(`${edit.path}: ${answer.choice} (p=${answer.confidence.toFixed(2)})`);
          }
        }
      }
    } catch {
      if (ctx.signal?.aborted) return;
      return {
        entries: [{
          type: "custom_message" as const,
          customType: "jev-coding-failure",
          content: "Automatic Jev edit-scope audit failed. Do not claim it passed; perform the normal final review and completion gate.",
          display: false,
        }],
        continue: true,
      };
    }
    if (!flagged.length || ctx.signal?.aborted) return;
    return {
      entries: [{
        type: "custom_message" as const,
        customType: "jev-coding-review",
        content: `Jev flagged edits for review:\n${flagged.join("\n")}\nCheck each against the request. Correct only changes you own that are unnecessary, or explain why they are needed. Do not revert unrelated user changes.`,
        display: false,
      }],
      continue: true,
    };
  });
}
