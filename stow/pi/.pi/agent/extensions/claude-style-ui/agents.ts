// pi-subagents announces background runs on Pi's shared event bus.
export const SUBAGENT_STARTED_EVENT = "subagent:async-started";
export const SUBAGENT_COMPLETE_EVENT = "subagent:async-complete";

function recordOf(data: unknown): Record<string, unknown> | undefined {
  return data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
}

/** Background subagent runs still going, counted the way pi-subagents' own Herdr status counts them. */
export class BackgroundAgents {
  private readonly running = new Set<string>();

  started(data: unknown): void {
    const run = recordOf(data);
    // A workflow coordinator is not a worker; each of its leaves announces itself separately.
    if (typeof run?.id !== "string" || run.id === "" || run.mode === "workflow") return;
    this.running.add(run.id);
  }

  completed(data: unknown): void {
    const run = recordOf(data);
    const id = typeof run?.runId === "string" ? run.runId : run?.id;
    if (typeof id === "string") this.running.delete(id);
  }

  count(): number {
    return this.running.size;
  }
}
