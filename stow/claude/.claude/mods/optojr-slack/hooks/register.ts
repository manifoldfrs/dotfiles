import type { EngineInterface, Register } from 'claude-code'

import {
  OPTOJR_KEYCHAIN_ACCOUNT,
  OPTOJR_RELAY_KEYCHAIN_SERVICE,
  optoJrRelayRequestBody,
  parseOptoJrRelayCredentials,
  parseOptoJrRelaySendResult,
  type OptoJrRelayCredentials,
  type OptoJrRelayMessage,
} from './relay.ts'

const TOOL_NAME = 'optojr_slack_send'
const CREDENTIALS_UNAVAILABLE = 'OptoJr Slack relay credentials are unavailable'
const RELAY_FAILED = 'OptoJr Slack relay request failed'

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['channel_id', 'message'],
  properties: {
    channel_id: {
      type: 'string',
      pattern: '^[CDG][A-Z0-9]+$',
      description: 'Slack channel, direct-message, or group-conversation ID',
    },
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 5_000,
      description: 'Message text to post as @OptoJr',
    },
    thread_ts: {
      type: 'string',
      pattern: '^\\d+\\.\\d+$',
      description: 'Parent message timestamp for a thread reply',
    },
    reply_broadcast: {
      type: 'boolean',
      description: 'Also show a thread reply in the channel',
    },
  },
}

async function readCredentials($: EngineInterface): Promise<OptoJrRelayCredentials | undefined> {
  const { exitCode, stdout } = await $.process.run(
    [
      '/usr/bin/security',
      'find-generic-password',
      '-a',
      OPTOJR_KEYCHAIN_ACCOUNT,
      '-s',
      OPTOJR_RELAY_KEYCHAIN_SERVICE,
      '-w',
    ],
    { timeoutMs: 10_000 },
  )
  if (exitCode !== 0) return undefined
  return parseOptoJrRelayCredentials(stdout.trim())
}

function failed(text: string) {
  return { isError: true as const, result: text, text }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: TOOL_NAME,
      description:
        'Post one message as the @OptoJr Slack bot through the hosted relay. Resolve the channel ID and read thread context before calling this tool.',
      inputSchema,
    })

    return next(e)
  })

  on('tool.call', { tool: 'mcp__optojr-slack__optojr_slack_send' }, async ($, e) => {
    const credentials = await readCredentials($).catch(() => undefined)
    if (!credentials) return failed(CREDENTIALS_UNAVAILABLE)

    const response = await $.http
      .fetch(new URL('/internal/slack/post-message', credentials.baseUrl).href, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.authorizationToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: optoJrRelayRequestBody(e as unknown as OptoJrRelayMessage),
      })
      .catch(() => undefined)
    if (!response?.ok) return failed(RELAY_FAILED)

    let body: unknown
    try {
      body = JSON.parse(response.text)
    } catch {
      return failed(RELAY_FAILED)
    }
    const sent = parseOptoJrRelaySendResult(body)
    if (!sent) return failed(RELAY_FAILED)

    const text = `Posted as @OptoJr in ${sent.channelId} at ${sent.messageTs}`
    return { result: { ...sent, text } }
  })
}
