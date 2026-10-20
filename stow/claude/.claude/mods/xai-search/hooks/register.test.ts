import { describe, expect, test } from 'claude-code/testing'

const TOOL = 'mcp__xai-search__xai_search'

function processResult(exitCode: number, stdout: string, stderr = '') {
  return { value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } }
}

describe('register', () => {
  test('runs the Pi runner with the call params on stdin', async ($, on) => {
    const runs: { argv: readonly string[]; stdin?: string }[] = []
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__xai-search__${e.name}` } }))
    on('process.run', ($, e) => {
      runs.push({ argv: e.argv, stdin: e.init?.stdin })
      return processResult(0, JSON.stringify({ text: 'Top posts', details: { x_search_calls: 2 } }))
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, query: 'agents', from_date: '2026-10-14', to_date: '2026-10-16' })

    expect(ran.isError).toBeUndefined()
    expect(ran.result).toBe('Top posts')
    expect(runs).toHaveLength(1)
    expect(runs[0]!.argv[0]).toBe('/opt/homebrew/bin/node')
    expect(runs[0]!.argv[1]).toMatch(/\/pi\/\.pi\/agent\/extensions\/xai-search\/run-xai-search\.ts$/)
    expect(runs[0]!.argv.slice(2)).toEqual(['--interactive', '--params', '/dev/stdin'])
    expect(JSON.parse(runs[0]!.stdin ?? '')).toEqual({ query: 'agents', from_date: '2026-10-14', to_date: '2026-10-16' })
  })

  test('exposes and forwards Pi image, video, and search-limit options', async ($, on) => {
    let schema: unknown
    let params: unknown
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => {
      schema = e.inputSchema
      return { value: { tool: `mcp__xai-search__${e.name}` } }
    })
    on('process.run', ($, e) => {
      params = JSON.parse(e.init?.stdin ?? '{}')
      return processResult(0, JSON.stringify({ text: 'Posts' }))
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.tool.call({ tool: TOOL, query: 'agents', enable_image_understanding: false, enable_video_understanding: true, max_turns: 6, max_output_tokens: 4_000 })

    expect(schema).toMatchObject({ properties: {
      enable_image_understanding: { type: 'boolean' },
      enable_video_understanding: { type: 'boolean' },
      max_turns: { type: 'integer', minimum: 1 },
      max_output_tokens: { type: 'integer', minimum: 1 },
    } })
    expect(params).toEqual({ query: 'agents', enable_image_understanding: false, enable_video_understanding: true, max_turns: 6, max_output_tokens: 4_000 })
  })

  test('surfaces the runner error message', async ($, on) => {
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__xai-search__${e.name}` } }))
    on('process.run', () => processResult(1, '', 'No xAI sign-in found.\n'))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, query: 'agents' })

    expect(ran.isError).toBe(true)
    expect(ran.text).toBe('No xAI sign-in found.')
  })
})
