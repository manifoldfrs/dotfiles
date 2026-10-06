import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Builds the steering prompt that tells the agent to recover its task from the session log and keep going. */
export function buildResumeAfterCompactionPrompt(sessionFile: string | undefined, compactionEntryId: string): string {
  const history = sessionFile === undefined
    ? "This session is ephemeral, so only the compaction summary is available."
    : `The full session history is in ${JSON.stringify(sessionFile)}; read it with the read and bash tools, following parentId links from compaction entry ${JSON.stringify(compactionEntryId)} so abandoned branches are ignored.`;

  return `Automatic compaction just finished. Resume the task without waiting for the user.

${history}

1. Recover the goal, the user's constraints and decisions, files changed, commands and tests run, open problems, and the intended next step, focusing on the messages just before compaction.
2. Treat the working tree as authoritative for file state and the session history as authoritative for user intent.
3. State the recovered context in two or three sentences, then perform the next unfinished step.
Ask the user only if the history is unavailable or genuinely ambiguous.`;
}

/**
 * Resumes work after automatic compaction, which otherwise leaves a long task stalled until the user prompts again.
 * Manual /compact is left alone because the user is already steering.
 * Adapted from dmmulroy's dotfiles (continue-after-compaction.ts).
 */
export default function (pi: ExtensionAPI) {
  pi.on("session_compact", (event, ctx) => {
    if (event.reason === "manual") return;
    const prompt = buildResumeAfterCompactionPrompt(ctx.sessionManager.getSessionFile(), event.compactionEntry.id);
    // Deferred so compaction finishes reconnecting the agent runtime before the steer is queued.
    setTimeout(() => pi.sendUserMessage(prompt, { deliverAs: "steer" }), 0);
  });
}
