import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Verbosity = "low" | "medium" | "high";

type ResponsesPayload = {
  text?: {
    verbosity?: Verbosity;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const RESPONSES_APIS = new Set(["openai-responses", "openai-codex-responses"]);
const GPT6_VERBOSITY_MODELS = new Set(["gpt-6-astra", "gpt-6-sol", "gpt-6.1-sol"]);

export default function (pi: ExtensionAPI) {
  pi.on("before_provider_request", (event, ctx) => {
    if (!ctx.model) return;
    if (!RESPONSES_APIS.has(ctx.model.api)) return;
    if (!ctx.model.id.startsWith("gpt-5") && !GPT6_VERBOSITY_MODELS.has(ctx.model.id)) return;

    const payload = event.payload as ResponsesPayload;
    return {
      ...payload,
      text: {
        ...payload.text,
        verbosity: "low",
      },
    };
  });
}
