import { describe, expect, test } from 'claude-code/testing'

const TOOL = 'mcp__optojr-slack__optojr_slack_send'
const TOKEN = 'x'.repeat(40)
const CREDENTIALS = JSON.stringify({ version: 1, baseUrl: 'https://relay.example', authorizationToken: TOKEN })

function hex(text: string) {
  return [...new TextEncoder().encode(text)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

describe('register', () => {
  test('posts through the relay with hex keychain credentials', async ($, on) => {
    const requests: { url: string; body?: string; auth?: string }[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__optojr-slack__${e.name}` } }))
    on('process.run', () => ({
      value: { exitCode: 0, stdout: `${hex(CREDENTIALS)}\n`, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
    }))
    on('http.fetch', ($, e) => {
      requests.push({ url: e.url, body: e.init?.body, auth: e.init?.headers?.Authorization })
      return {
        value: { status: 200, ok: true, headers: {}, text: JSON.stringify({ ok: true, channel_id: 'C123', message_ts: '1.2' }) },
      }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, channel_id: 'C123', message: 'hi', thread_ts: '1.0' })

    expect(ran.isError).toBeUndefined()
    expect(JSON.stringify(ran.result)).toContain('Posted as @OptoJr in C123 at 1.2')
    expect(requests).toEqual([
      {
        url: 'https://relay.example/internal/slack/post-message',
        body: JSON.stringify({ channel_id: 'C123', message: 'hi', thread_ts: '1.0' }),
        auth: `Bearer ${TOKEN}`,
      },
    ])
  })

  test('missing keychain item fails without calling the relay', async ($, on) => {
    let fetched = false
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__optojr-slack__${e.name}` } }))
    on('process.run', () => ({
      value: { exitCode: 44, stdout: '', stderr: 'not found', isStdoutTruncated: false, isStderrTruncated: false },
    }))
    on('http.fetch', () => {
      fetched = true
      return { value: { status: 500, ok: false, headers: {}, text: '' } }
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, channel_id: 'C123', message: 'hi' })

    expect(ran.isError).toBe(true)
    expect(ran.text).toBe('OptoJr Slack relay credentials are unavailable')
    expect(fetched).toBe(false)
  })
})
