import { join } from "node:path";
import { formatSize, getAgentDir, truncateHead, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { assertFirstPartyXaiSubscriptionProvider } from "./xai-auth.ts";
import { loadXaiSearchConfig, XAI_SEARCH_CONFIG_FILENAME } from "./xai-config.ts";
import type { XaiSearchDetails } from "./xai-format.ts";
import { runXaiSearch } from "./xai-search.ts";

const handleList = (description: string) =>
  Type.Optional(
    Type.Array(Type.String({ description: "X handle, with or without a leading @", minLength: 1 }), {
      description,
      minItems: 1,
      maxItems: 20,
      uniqueItems: true,
    }),
  );

const xaiSearchSchema = Type.Object(
  {
    query: Type.String({ description: "What to search for on X (Twitter)", minLength: 1 }),
    model: Type.Optional(Type.String({ description: "xAI model override; uses the configured model when omitted", minLength: 1 })),
    from_date: Type.Optional(Type.String({ description: "Inclusive start date, YYYY-MM-DD, from 00:00 UTC" })),
    to_date: Type.Optional(
      Type.String({
        description:
          "Exclusive end date, YYYY-MM-DD, UTC. Posts on this date are not included; to search one day, set to_date to the following day.",
      }),
    ),
    allowed_x_handles: handleList("Only consider posts from these X handles (maximum 20)"),
    excluded_x_handles: handleList("Exclude posts from these X handles (maximum 20)"),
    enable_image_understanding: Type.Optional(Type.Boolean({ description: "Allow xAI to analyze images in X posts" })),
    enable_video_understanding: Type.Optional(Type.Boolean({ description: "Allow xAI to analyze videos in X posts" })),
    max_turns: Type.Optional(
      Type.Integer({ description: "Maximum xAI assistant/tool-call turns for this search", minimum: 1 }),
    ),
    max_output_tokens: Type.Optional(
      Type.Integer({ description: "Maximum output tokens for the final answer", minimum: 1 }),
    ),
  },
  { additionalProperties: false },
);

export default function registerXaiSearch(pi: ExtensionAPI): void {
  const configPath = join(getAgentDir(), XAI_SEARCH_CONFIG_FILENAME);

  pi.registerCommand("xai-search", {
    description: "Show xai_search status without contacting xAI",
    async handler(_args, ctx) {
      const config = await loadXaiSearchConfig(configPath);
      for (const warning of config.warnings) ctx.ui.notify(warning, "warning");

      let auth = "eligible: stored OAuth sign-in on the built-in subscription provider (token not resolved until a search runs)";
      try {
        assertFirstPartyXaiSubscriptionProvider(ctx.modelRegistry);
      } catch (error) {
        auth = error instanceof Error ? error.message : String(error);
      }

      ctx.ui.notify(`xai_search\nModel: ${config.model}\nAuth: ${auth}\nConfig: ${configPath}`, "info");
    },
  });

  pi.registerTool<typeof xaiSearchSchema, XaiSearchDetails>({
    name: "xai_search",
    label: "xAI X Search",
    description:
      "Search live X (Twitter) posts with xAI's x_search over Pi's SuperGrok/X Premium sign-in. Supports date ranges (to_date is exclusive), handle filters, image/video understanding, and turn/output limits.",
    promptSnippet: "Search live X posts through xAI",
    promptGuidelines: [
      "Use xai_search when the user needs current posts, discussions, reactions, profiles, or threads from X (Twitter).",
    ],
    parameters: xaiSearchSchema,
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const config = await loadXaiSearchConfig(configPath);
      const result = await runXaiSearch({
        registry: ctx.modelRegistry,
        config,
        params,
        fetch: globalThis.fetch,
        ...(signal ? { signal } : {}),
      });

      const truncated = truncateHead(result.text);
      const suffix = truncated.truncated
        ? `\n\n[Output truncated to ${truncated.outputLines} lines / ${formatSize(truncated.outputBytes)}]`
        : "";
      return {
        content: [{ type: "text", text: `${truncated.content}${suffix}` }],
        details: result.details,
      };
    },
  });
}
