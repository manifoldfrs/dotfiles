import assert from "node:assert/strict"
import test from "node:test"
import optoJrPlugin from "./index.ts"
import {
  parseOptoJrRelayCredentials,
  parseOptoJrRelaySendResult,
} from "./optojr-slack.ts"

test("plugin registers the OptoJr tool", async () => {
  const toolNames: string[] = []
  await optoJrPlugin.setup({
    tool: {
      transform: async (
        register: (editor: { add(tool: { name: string }): void }) => void,
      ) => register({ add: (tool) => toolNames.push(tool.name) }),
    },
  } as never)

  assert.deepEqual(toolNames, ["optojr_slack_send"])
})

test("parseOptoJrRelayCredentials accepts valid HTTPS credentials", () => {
  const credentials = parseOptoJrRelayCredentials(JSON.stringify({
    version: 1,
    baseUrl: "https://relay.example.com",
    authorizationToken: "a".repeat(32),
  }))

  assert.equal(credentials?.baseUrl.href, "https://relay.example.com/")
  assert.equal(JSON.stringify(credentials), JSON.stringify({
    version: 1,
    baseUrl: "https://relay.example.com/",
    authorizationToken: "<redacted>",
  }))
})

test("parseOptoJrRelayCredentials rejects unsafe URLs", () => {
  const credentials = parseOptoJrRelayCredentials(JSON.stringify({
    version: 1,
    baseUrl: "http://relay.example.com?token=secret",
    authorizationToken: "a".repeat(32),
  }))

  assert.equal(credentials, undefined)
})

test("parseOptoJrRelaySendResult validates relay responses", () => {
  assert.deepEqual(parseOptoJrRelaySendResult({
    ok: true,
    channel_id: "C123ABC",
    message_ts: "1234567890.123456",
  }), {
    channelId: "C123ABC",
    messageTs: "1234567890.123456",
  })
  assert.equal(parseOptoJrRelaySendResult({
    ok: true,
    channel_id: "not-a-channel",
    message_ts: "invalid",
  }), undefined)
})
