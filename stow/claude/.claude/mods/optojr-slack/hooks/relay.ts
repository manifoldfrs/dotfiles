export const OPTOJR_KEYCHAIN_ACCOUNT = 'optojr'
export const OPTOJR_RELAY_KEYCHAIN_SERVICE = 'pi-optojr-slack-relay-credentials'

export type OptoJrRelayCredentials = {
  readonly baseUrl: URL
  readonly authorizationToken: string
}

export type OptoJrRelayMessage = {
  readonly channel_id: string
  readonly message: string
  readonly thread_ts?: string
  readonly reply_broadcast?: boolean
}

export type OptoJrRelaySendResult = {
  readonly channelId: string
  readonly messageTs: string
}

function decodeHex(input: string): string {
  const bytes = new Uint8Array(input.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(input.slice(index * 2, index * 2 + 2), 16)
  }
  return new TextDecoder().decode(bytes)
}

// `security -w` prints the password as hex when it holds non-printable bytes.
export function parseOptoJrRelayCredentials(input: string): OptoJrRelayCredentials | undefined {
  const serialized = input.length % 2 === 0 && /^[a-f0-9]+$/i.test(input) ? decodeHex(input) : input
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    return undefined
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    parsed.version !== 1 ||
    !('baseUrl' in parsed) ||
    typeof parsed.baseUrl !== 'string' ||
    !('authorizationToken' in parsed) ||
    typeof parsed.authorizationToken !== 'string' ||
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
    baseUrl.protocol !== 'https:' ||
    baseUrl.username !== '' ||
    baseUrl.password !== '' ||
    baseUrl.search !== '' ||
    baseUrl.hash !== ''
  ) {
    return undefined
  }
  return { baseUrl, authorizationToken: parsed.authorizationToken }
}

export function parseOptoJrRelaySendResult(input: unknown): OptoJrRelaySendResult | undefined {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('ok' in input) ||
    input.ok !== true ||
    !('channel_id' in input) ||
    typeof input.channel_id !== 'string' ||
    !/^[CDG][A-Z0-9]+$/.test(input.channel_id) ||
    !('message_ts' in input) ||
    typeof input.message_ts !== 'string' ||
    !/^\d+\.\d+$/.test(input.message_ts)
  ) {
    return undefined
  }
  return { channelId: input.channel_id, messageTs: input.message_ts }
}

export function optoJrRelayRequestBody(message: OptoJrRelayMessage): string {
  return JSON.stringify({
    channel_id: message.channel_id,
    message: message.message,
    ...(message.thread_ts === undefined ? {} : { thread_ts: message.thread_ts }),
    ...(message.reply_broadcast === undefined ? {} : { reply_broadcast: message.reply_broadcast }),
  })
}
