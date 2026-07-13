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

export default function (pi: ExtensionAPI) {
  pi.on("before_provider_request", (event) => {
    if (!RESPONSES_APIS.has(event.model.api)) return;
    if (!event.model.id.startsWith("gpt-5")) return;

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
