import { execFile } from "node:child_process"
import { inspect } from "node:util"

const OPTOJR_KEYCHAIN_ACCOUNT = "optojr"
const OPTOJR_RELAY_KEYCHAIN_SERVICE = "pi-optojr-slack-relay-credentials"
const SLACK_RELAY_REQUEST_TIMEOUT_MS = 60_000

class RedactedValue<T> {
  readonly #value: T

  constructor(value: T) {
    this.#value = value
  }

  reveal(): T {
    return this.#value
  }

  toJSON(): string {
    return "<redacted>"
  }

  toString(): string {
    return "<redacted>"
  }

  [inspect.custom](): string {
    return "<redacted>"
  }
}

export type OptoJrRelayCredentials = {
  readonly version: 1
  readonly baseUrl: URL
  readonly authorizationToken: RedactedValue<string>
}

export type OptoJrRelayMessage = {
  readonly channelId: string
  readonly message: string
  readonly threadTs?: string
  readonly replyBroadcast?: boolean
}

export type OptoJrRelaySendResult = {
  readonly channelId: string
  readonly messageTs: string
}

export function parseOptoJrRelayCredentials(
  input: string,
): OptoJrRelayCredentials | undefined {
  const serialized =
    input.length % 2 === 0 && /^[a-f0-9]+$/i.test(input)
      ? Buffer.from(input, "hex").toString("utf8")
      : input
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    return undefined
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
    return undefined
  }
  let baseUrl: URL
  try {
    baseUrl = new URL(parsed.baseUrl)
  } catch {
    return undefined
  }
  if (
    baseUrl.protocol !== "https:" ||
    baseUrl.username !== "" ||
    baseUrl.password !== "" ||
    baseUrl.search !== "" ||
    baseUrl.hash !== ""
  ) {
    return undefined
  }
  return {
    version: 1,
    baseUrl,
    authorizationToken: new RedactedValue(parsed.authorizationToken),
  }
}

export function parseOptoJrRelaySendResult(
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
    return undefined
  }
  return { channelId: input.channel_id, messageTs: input.message_ts }
}

export async function readOptoJrRelayCredentials(
  signal?: AbortSignal,
): Promise<OptoJrRelayCredentials> {
  const output = await new Promise<string>((resolve, reject) => {
    execFile(
      "/usr/bin/security",
      [
        "find-generic-password",
        "-a",
        OPTOJR_KEYCHAIN_ACCOUNT,
        "-s",
        OPTOJR_RELAY_KEYCHAIN_SERVICE,
        "-w",
      ],
      { timeout: 10_000, signal },
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout.trim())
      },
    )
  }).catch(() => {
    throw new Error("OptoJr Slack relay credentials are unavailable")
  })

  const credentials = parseOptoJrRelayCredentials(output)
  if (!credentials) {
    throw new Error("OptoJr Slack relay credentials are unavailable")
  }
  return credentials
}

export async function sendOptoJrSlackMessage(
  credentials: OptoJrRelayCredentials,
  message: OptoJrRelayMessage,
  signal?: AbortSignal,
): Promise<OptoJrRelaySendResult> {
  const timeoutSignal = AbortSignal.timeout(SLACK_RELAY_REQUEST_TIMEOUT_MS)
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal
  try {
    const response = await fetch(
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
    )
    const result = parseOptoJrRelaySendResult(await response.json())
    if (!response.ok || !result) throw new Error()
    return result
  } catch {
    throw new Error("OptoJr Slack relay request failed")
  }
}
