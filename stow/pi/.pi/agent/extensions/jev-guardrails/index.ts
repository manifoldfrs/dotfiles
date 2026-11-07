import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import type { ImageContent, JsonValue, Message, TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, ExtensionToolContext } from "@earendil-works/pi-coding-agent";
import {
  DECISION_REMINDER,
  MAX_EVIDENCE,
  PIPELINE_DESCRIPTION,
  RECENT_PROMPTS,
  errorText,
  isSecretFile,
  isSentLink,
  listOf,
  objectOf,
  parseJson,
  parsePipelineInput,
  pipelineInputSchema,
  reviewTurn,
  runPipeline,
  screenText,
  textOf,
  toolEvidence,
  withoutSecrets,
  type CallJev,
  type CodeEdit,
  type Evidence,
  type Json,
  type PipelinePorts,
} from "./shared.ts";

const SCREENED_TOOLS = new Set([
  "mcp__exa__web_fetch_exa",
  "mcp__exa__web_search_exa",
  "mcp__exa__web_search_advanced_exa",
  "mcp__Ref__ref_read_url",
  "mcp__Ref__ref_search_documentation",
]);

const PIPELINE_TOOL = "jev_pipeline";
const EXTRACT_TIMEOUT_MS = 60_000;

type Content = (TextContent | ImageContent)[];

/** What the checks need from outside Pi: Jev's MCP tools, and a stateless model call for claim extraction. */
export type JevChecksDeps = {
  readonly callJev: CallJev;
  readonly generate: (ctx: ExtensionContext, prompt: string) => Promise<string>;
};

function contentText(content: Content) {
  return content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
}

function resultText(content: Content, structured: JsonValue | undefined) {
  const text = contentText(content);

  return structured === undefined ? text : `${text}\n${JSON.stringify(structured)}`;
}

// Tool input arrives as Pi's validated arguments; reading it as Json keeps malformed nested calls out of the audit.
function editsOf(toolName: string, input: Json): CodeEdit[] {
  const args = objectOf(input);
  const file = textOf(args?.path);

  if (file === undefined) return [];

  if (toolName === "write") {
    const after = textOf(args?.content);

    return after === undefined ? [] : [{ file, before: "", after }];
  }

  if (toolName !== "edit") return [];

  return listOf(args?.edits).flatMap((item) => {
    const replacement = objectOf(item);
    const before = textOf(replacement?.oldText);
    const after = textOf(replacement?.newText);

    return before === undefined || after === undefined ? [] : [{ file, before, after }];
  });
}

function lastAnswer(messages: readonly Message[]) {
  const last = messages.findLast((message) => message.role === "assistant");

  if (last?.role !== "assistant") return undefined;

  return last.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
}

function notify(ctx: ExtensionContext, note: string) {
  if (ctx.hasUI) ctx.ui.notify(note, "warning");
}

// Claude Code extracts claims with a fresh model call; with the session in view, a claim the user asked for reads as coming from them.
async function generateStateless(ctx: ExtensionContext, prompt: string) {
  if (!ctx.model) throw new Error("no active model for claim extraction");
  const timeout = AbortSignal.timeout(EXTRACT_TIMEOUT_MS);
  const signal = ctx.signal ? AbortSignal.any([ctx.signal, timeout]) : timeout;
  const reply = await ctx.modelRegistry.complete(ctx.model, { messages: [{ role: "user", content: prompt, timestamp: Date.now() }] }, { signal });

  if (reply.stopReason === "error" || reply.stopReason === "aborted") throw new Error(`claim extraction failed: ${reply.errorMessage ?? reply.stopReason}`);

  return contentText(reply.content.filter((part): part is TextContent => part.type === "text"));
}

function pipelinePorts(ctx: ExtensionToolContext): PipelinePorts {
  return {
    call: async (step, args) => {
      const outcome = await ctx.executeTool(`mcp__${step.server}__${step.tool}`, args);
      const text = contentText(outcome.result.content);

      if (outcome.isError) throw new Error(`${step.server}/${step.tool}: ${text || "call failed"}`);

      return outcome.result.structuredContent === undefined ? parseJson(text) : parseJson(JSON.stringify(outcome.result.structuredContent));
    },
    saveResults: async (json) => {
      const path = join(tmpdir(), `jev-pipeline-${ctx.sessionManager.getSessionId()}-${Date.now()}.json`);
      await writeFile(path, json);

      return path;
    },
  };
}

/** Screens web results, audits edits and fact-checks the answer once per turn, and adds the jev_pipeline tool. */
export function registerJevChecks(pi: ExtensionAPI, deps: JevChecksDeps): void {
  let prompts: string[] = [];
  let edits: CodeEdit[] = [];
  let evidence: Evidence[] = [];
  let sequence = 0;
  let ranTool = false;
  let reminded = false;
  let checked = false;

  function recordEvidence(tool: string, args: string, output: string) {
    ranTool = true;
    sequence += 1;
    evidence = [...evidence, toolEvidence(sequence, tool, args, output)].slice(-MAX_EVIDENCE);
  }

  pi.on("before_agent_start", (event) => {
    if (event.messageType === "user") prompts = [...prompts, event.prompt].slice(-RECENT_PROMPTS);
    edits = [];
    ranTool = false;
    reminded = false;
    checked = false;
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName.startsWith("mcp__jev__") || event.toolName === PIPELINE_TOOL) return;
    const args = JSON.stringify(event.input);
    const secret = isSecretFile(args);
    const text = resultText(event.content, event.structuredContent);
    let content = event.content;

    if (SCREENED_TOOLS.has(event.toolName) && !event.isError && text.trim()) {
      const outcome = await screenText(deps.callJev, (note) => notify(ctx, note), secret ? withoutSecrets(text) : text, isSentLink(event.toolName, args, prompts));

      if (outcome.kind === "withhold") {
        if (!secret) recordEvidence(event.toolName, args, outcome.text);

        return { content: [{ type: "text", text: outcome.text }], details: undefined, isError: true };
      }

      if (outcome.kind === "warn") content = [...content, { type: "text", text: outcome.warning }];
    }

    if (!secret) recordEvidence(event.toolName, args, event.isError ? `Error: ${text}` : text);

    const made = event.isError ? [] : editsOf(event.toolName, parseJson(args)).filter((edit) => !isSecretFile(edit.file));
    edits.push(...made);

    if (made.length && !reminded) {
      reminded = true;
      content = [...content, { type: "text", text: DECISION_REMINDER }];
    }

    if (content === event.content) return;

    return event.structuredContent === undefined ? { content } : { content, structuredContent: event.structuredContent };
  });



  pi.on("agent_before_settle", async (event, ctx) => {
    if (checked || event.outcome !== "completed" || ctx.signal?.aborted) return;
    checked = true;
    const turn = { prompts, edits, answer: lastAnswer(event.context.llmMessages), evidence, ranTool };
    edits = [];
    ranTool = false;
    const review = await reviewTurn(deps.callJev, (prompt) => deps.generate(ctx, prompt), turn);

    for (const note of review.person) notify(ctx, note);

    if (!review.agent || ctx.signal?.aborted) return;

    return {
      entries: [...event.entries, { type: "custom_message" as const, customType: "jev-checks", content: review.agent, display: false }],
      continue: true,
    };
  });

  pi.registerTool({
    name: PIPELINE_TOOL,
    label: "Jev pipeline",
    description: PIPELINE_DESCRIPTION,
    parameters: pipelineInputSchema({
      server: "MCP server name as /mcp lists it, e.g. \"hey\"",
      tool: "Tool name on that server, without the mcp__<server>__ prefix",
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      try {
        const result = await runPipeline(pipelinePorts(ctx), parsePipelineInput(parseJson(JSON.stringify(params))));

        return { content: [{ type: "text", text: JSON.stringify(result) }], details: undefined };
      } catch (error) {
        throw new Error(`jev-pipeline failed: ${errorText(error)}`);
      }
    },
  });
}

export default function jevChecks(pi: ExtensionAPI): void {
  const mcp = () => import("./jev-mcp.ts");
  registerJevChecks(pi, { callJev: async (tool, args) => (await mcp()).callJev(tool, args), generate: generateStateless });
  pi.on("session_shutdown", async () => (await mcp()).closeJev());
}
