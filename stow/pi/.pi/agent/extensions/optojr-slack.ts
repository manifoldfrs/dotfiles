import { inspect } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const OPTOJR_KEYCHAIN_ACCOUNT = "optojr";
const OPTOJR_RELAY_KEYCHAIN_SERVICE = "pi-optojr-slack-relay-credentials";
const SLACK_RELAY_REQUEST_TIMEOUT_MS = 60_000;

class RedactedValue<T> {
  readonly _tag = "RedactedValue" as const;
  readonly #value: T;

  constructor(value: T) {
    this.#value = value;
  }

  reveal(): T {
    return this.#value;
  }

  toJSON(): string {
    return "<redacted>";
  }

  toString(): string {
    return "<redacted>";
  }

  [inspect.custom](): string {
    return "<redacted>";
  }
}

type OptoJrRelayCredentials = {
  readonly version: 1;
  readonly baseUrl: URL;
  readonly authorizationToken: RedactedValue<string>;
};

type OptoJrRelayCredentialFailure = {
  readonly _tag: "OptoJrRelayCredentialFailure";
  readonly message: "OptoJr Slack relay credentials are unavailable";
};

type OptoJrRelaySendFailure = {
  readonly _tag: "OptoJrRelaySendFailure";
  readonly message: "OptoJr Slack relay request failed";
};

type Result<T, E> =
  | { readonly _tag: "ok"; readonly value: T }
  | { readonly _tag: "err"; readonly error: E };

type OptoJrRelayMessage = {
  readonly channelId: string;
  readonly message: string;
  readonly threadTs?: string;
  readonly replyBroadcast?: boolean;
};

type OptoJrRelaySendResult = {
  readonly channelId: string;
  readonly messageTs: string;
};

/** Reads the independent machine credential used only by the hosted OptoJr relay. */
export interface OptoJrRelayCredentialStore {
  /** Read and parse relay credentials without exposing them in diagnostics. */
  readCredentials(
    pi: ExtensionAPI,
    signal?: AbortSignal,
  ): Promise<Result<OptoJrRelayCredentials, OptoJrRelayCredentialFailure>>;
}

/** Sends Pi-authored Slack messages through the single service that owns Slack OAuth. */
export class OptoJrSlackRelayClient {
  /** Build a relay client around the configured HTTP implementation. */
  constructor(private readonly fetchImplementation: typeof fetch = fetch) {}

  /** Send one message without automatic retries that could duplicate a Slack post. */
  async sendMessage(
    credentials: OptoJrRelayCredentials,
    message: OptoJrRelayMessage,
    signal?: AbortSignal,
  ): Promise<Result<OptoJrRelaySendResult, OptoJrRelaySendFailure>> {
    const requestTimeoutSignal = AbortSignal.timeout(
      SLACK_RELAY_REQUEST_TIMEOUT_MS,
    );
    const requestSignal =
      signal === undefined
        ? requestTimeoutSignal
        : AbortSignal.any([signal, requestTimeoutSignal]);
    try {
      const response = await this.fetchImplementation(
        new URL("/internal/slack/post-message", credentials.baseUrl),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.authorizationToken.reveal()}`,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            channel_id: message.channelId,
            message: message.message,
            ...(message.threadTs === undefined
              ? {}
              : { thread_ts: message.threadTs }),
            ...(message.replyBroadcast === undefined
              ? {}
              : { reply_broadcast: message.replyBroadcast }),
          }),
          signal: requestSignal,
        },
      );
      const body: unknown = await response.json();
      const parsed = parseOptoJrRelaySendResult(body);
      return response.ok && parsed !== undefined
        ? { _tag: "ok", value: parsed }
        : relaySendFailure();
    } catch {
      return relaySendFailure();
    }
  }
}

const keychainRelayCredentialStore: OptoJrRelayCredentialStore = {
  async readCredentials(pi, signal) {
    const result = await pi.exec(
      "/usr/bin/security",
      [
        "find-generic-password",
        "-a",
        OPTOJR_KEYCHAIN_ACCOUNT,
        "-s",
        OPTOJR_RELAY_KEYCHAIN_SERVICE,
        "-w",
      ],
      {
        timeout: 10_000,
        ...(signal === undefined ? {} : { signal }),
      },
    );
    if (result.code !== 0) return relayCredentialFailure();
    return parseOptoJrRelayCredentials(result.stdout.trim());
  },
};

/** Register the Pi tool that delegates OptoJr posts to the hosted Slack relay. */
export function registerOptoJrSlackExtension(
  pi: ExtensionAPI,
  credentialStore: OptoJrRelayCredentialStore = keychainRelayCredentialStore,
  relayClient = new OptoJrSlackRelayClient(),
): void {
  pi.registerTool({
    name: "optojr_slack_send",
    label: "Send as OptoJr",
    description:
      "Post one message as the @OptoJr Slack bot through the hosted relay. Use Slack MCP tools to resolve channel IDs and read thread context before calling this tool.",
    promptSnippet: "Post a Slack channel message or thread reply as @OptoJr",
    promptGuidelines: [
      "Use optojr_slack_send instead of Slack MCP send tools whenever the OptoJr skill asks to send or reply as @OptoJr.",
    ],
    parameters: Type.Object({
      channel_id: Type.String({
        pattern: "^[CDG][A-Z0-9]+$",
        description: "Slack channel, direct-message, or group-conversation ID",
      }),
      message: Type.String({
        minLength: 1,
        maxLength: 5000,
        description: "Message text to post as @OptoJr",
      }),
      thread_ts: Type.Optional(
        Type.String({
          pattern: "^\\d+\\.\\d+$",
          description: "Parent message timestamp for a thread reply",
        }),
      ),
      reply_broadcast: Type.Optional(
        Type.Boolean({ description: "Also show a thread reply in the channel" }),
      ),
    }),
    async execute(_toolCallId, params, signal) {
      const credentials = await credentialStore.readCredentials(pi, signal);
      if (credentials._tag === "err") {
        throw new Error(credentials.error.message);
      }
      const sent = await relayClient.sendMessage(
        credentials.value,
        {
          channelId: params.channel_id,
          message: params.message,
          ...(params.thread_ts === undefined
            ? {}
            : { threadTs: params.thread_ts }),
          ...(params.reply_broadcast === undefined
            ? {}
            : { replyBroadcast: params.reply_broadcast }),
        },
        signal,
      );
      if (sent._tag === "err") throw new Error(sent.error.message);
      return {
        content: [
          {
            type: "text",
            text: `Posted as @OptoJr in ${sent.value.channelId} at ${sent.value.messageTs}`,
          },
        ],
        details: {
          channelId: sent.value.channelId,
          messageTs: sent.value.messageTs,
        },
      };
    },
  });
}

function parseOptoJrRelayCredentials(
  input: string,
): Result<OptoJrRelayCredentials, OptoJrRelayCredentialFailure> {
  const serializedCredentials =
    input.length % 2 === 0 && /^[a-f0-9]+$/i.test(input)
      ? Buffer.from(input, "hex").toString("utf8")
      : input;
  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedCredentials);
  } catch {
    return relayCredentialFailure();
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    parsed.version !== 1 ||
    !("baseUrl" in parsed) ||
    typeof parsed.baseUrl !== "string" ||
    !("authorizationToken" in parsed) ||
    typeof parsed.authorizationToken !== "string" ||
    parsed.authorizationToken.length < 32
  ) {
    return relayCredentialFailure();
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(parsed.baseUrl);
  } catch {
    return relayCredentialFailure();
  }
  if (
    baseUrl.protocol !== "https:" ||
    baseUrl.username !== "" ||
    baseUrl.password !== "" ||
    baseUrl.search !== "" ||
    baseUrl.hash !== ""
  ) {
    return relayCredentialFailure();
  }
  return {
    _tag: "ok",
    value: {
      version: 1,
      baseUrl,
      authorizationToken: new RedactedValue(parsed.authorizationToken),
    },
  };
}

function parseOptoJrRelaySendResult(
  input: unknown,
): OptoJrRelaySendResult | undefined {
  if (
    typeof input !== "object" ||
    input === null ||
    !("ok" in input) ||
    input.ok !== true ||
    !("channel_id" in input) ||
    typeof input.channel_id !== "string" ||
    !/^[CDG][A-Z0-9]+$/.test(input.channel_id) ||
    !("message_ts" in input) ||
    typeof input.message_ts !== "string" ||
    !/^\d+\.\d+$/.test(input.message_ts)
  ) {
    return undefined;
  }
  return { channelId: input.channel_id, messageTs: input.message_ts };
}

function relayCredentialFailure(): Result<never, OptoJrRelayCredentialFailure> {
  return {
    _tag: "err",
    error: {
      _tag: "OptoJrRelayCredentialFailure",
      message: "OptoJr Slack relay credentials are unavailable",
    },
  };
}

function relaySendFailure(): Result<never, OptoJrRelaySendFailure> {
  return {
    _tag: "err",
    error: {
      _tag: "OptoJrRelaySendFailure",
      message: "OptoJr Slack relay request failed",
    },
  };
}

/** Load the hosted OptoJr Slack relay tool into Pi. */
export default function (pi: ExtensionAPI): void {
  registerOptoJrSlackExtension(pi);
}
