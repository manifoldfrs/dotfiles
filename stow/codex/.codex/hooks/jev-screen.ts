import { callJev, readHookInput, type JevCall } from "./jev-mcp-client.ts";

const SCREENED_TOOLS = new Set([
  "mcp__exa__web_fetch_exa",
  "mcp__exa__web_search_exa",
  "mcp__exa__web_search_advanced_exa",
  "mcp__Ref__ref_read_url",
  "mcp__Ref__ref_search_documentation",
]);
const CHUNK_CHARS = 20_000;
// Stays under the 120 s hook timeout in hooks.json: a killed hook leaves the unscreened result in place.
const SCREEN_BUDGET_MS = 100_000;

type HookOutput = { decision: "block"; reason: string };

// Error results are screened too, since their text can still carry fetched page content.
function responseText(response: unknown): string {
  if (!response || typeof response !== "object") return typeof response === "string" ? response : "";
  const { content, structuredContent } = response as {
    content?: unknown;
    structuredContent?: unknown;
  };
  if (!Array.isArray(content)) return JSON.stringify(response);
  const text = content
    .filter((block): block is { type: "text"; text: string } => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n");
  return structuredContent === undefined ? text : `${text}\n${JSON.stringify(structuredContent)}`;
}

async function passes(call: JevCall, text: string, timeoutMs: number): Promise<boolean> {
  const parsed = await call("jev_screen", { text }, timeoutMs);
  if (!parsed || typeof parsed !== "object" || !("recommendation" in parsed)) throw new Error("invalid screen result");
  if ("status" in parsed && parsed.status === "invalid_response") throw new Error("invalid screen result");
  const recommendation = parsed.recommendation as { action?: unknown } | null;
  const action = recommendation?.action;
  if (action === "pass") return true;
  if (action === "review" || action === "block" || action === "skip") return false;
  throw new Error("invalid screen action");
}

/** Return a blocking hook result when Jev does not pass a screened web result. */
export async function screen(
  input: Record<string, unknown>,
  call: JevCall = callJev,
  budgetMs = SCREEN_BUDGET_MS,
  now: () => number = Date.now,
): Promise<HookOutput | undefined> {
  if (typeof input.tool_name !== "string" || !SCREENED_TOOLS.has(input.tool_name)) return undefined;
  const text = responseText(input.tool_response);
  if (!text.trim()) return undefined;

  const deadline = now() + budgetMs;
  try {
    for (let offset = 0; offset < text.length; offset += CHUNK_CHARS) {
      const remaining = deadline - now();
      if (remaining <= 0) throw new Error("screening budget exhausted");
      if (!await passes(call, text.slice(offset, offset + CHUNK_CHARS), remaining)) {
        return { decision: "block", reason: "Jev screening withheld this web result." };
      }
    }
    return undefined;
  } catch {
    return { decision: "block", reason: "Jev screening failed; this web result was withheld." };
  }
}

if (import.meta.main) {
  // A failed hook lets Codex keep the unscreened result, so unreadable input also withholds.
  const output = await readHookInput().then((input) => screen(input), () => ({
    decision: "block" as const,
    reason: "Jev screening failed; this web result was withheld.",
  }));
  if (output) process.stdout.write(JSON.stringify(output));
}
