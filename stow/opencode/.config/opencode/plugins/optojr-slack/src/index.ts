import { Plugin } from "@opencode/plugin"
import {
  readOptoJrRelayCredentials,
  sendOptoJrSlackMessage,
  type OptoJrRelayMessage,
} from "./optojr-slack.ts"

const inputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["channel_id", "message"],
  properties: {
    channel_id: {
      type: "string",
      pattern: "^[CDG][A-Z0-9]+$",
      description: "Slack channel, direct-message, or group-conversation ID",
    },
    message: {
      type: "string",
      minLength: 1,
      maxLength: 5_000,
      description: "Message text to post as @OptoJr",
    },
    thread_ts: {
      type: "string",
      pattern: "^\\d+\\.\\d+$",
      description: "Parent message timestamp for a thread reply",
    },
    reply_broadcast: {
      type: "boolean",
      description: "Also show a thread reply in the channel",
    },
  },
} as const

export default Plugin.define({
  id: "frsh.optojr-slack",
  async setup(context) {
    await context.tool.transform((editor) => {
      editor.add({
        name: "optojr_slack_send",
        description:
          "Post one message as the @OptoJr Slack bot through the hosted relay. Resolve the channel ID and read thread context before calling this tool.",
        input: inputSchema,
        async execute(input, toolContext) {
          const params = input as {
            channel_id: string
            message: string
            thread_ts?: string
            reply_broadcast?: boolean
          }
          const signal = (toolContext as { signal?: AbortSignal }).signal
          const credentials = await readOptoJrRelayCredentials(signal)
          const message: OptoJrRelayMessage = {
            channelId: params.channel_id,
            message: params.message,
            ...(params.thread_ts === undefined
              ? {}
              : { threadTs: params.thread_ts }),
            ...(params.reply_broadcast === undefined
              ? {}
              : { replyBroadcast: params.reply_broadcast }),
          }
          const sent = await sendOptoJrSlackMessage(
            credentials,
            message,
            signal,
          )
          return {
            content: `Posted as @OptoJr in ${sent.channelId} at ${sent.messageTs}`,
            metadata: {
              channelId: sent.channelId,
              messageTs: sent.messageTs,
            },
          }
        },
      })
    })
  },
})
