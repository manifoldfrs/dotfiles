import { describe, expect, test } from 'claude-code/testing'

const TOOL = 'mcp__codex-reviewer__reviewer'
const DEFINITION = '---\nname: reviewer\nmodel: inherit\n---\n\nYou are a disciplined review subagent.\n'

function processResult(exitCode: number, stdout: string, stderr = '') {
  return { value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } }
}

describe('register', () => {
  test('runs a read-only Codex review with the reviewer instructions and the task', async ($, on) => {
    const runs: { argv: readonly string[]; stdin?: string }[] = []
    let readPath = ''
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__codex-reviewer__${e.name}` } }))
    on('session.cwd', () => ({ value: '/work' }))
    on('fs.read', ($, e) => {
      readPath = String(e.path)
      return { value: DEFINITION }
    })
    on('process.run', ($, e) => {
      runs.push({ argv: e.argv, stdin: e.init?.stdin })
      return processResult(0, 'No findings.\n', 'tokens used')
    })

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, prompt: 'Review the diff in /tmp/d.patch' })

    expect(ran.isError).toBeUndefined()
    expect(ran.result).toBe('No findings.')
    expect(readPath).toMatch(/\/agents\/reviewer\.md$/)
    expect(runs[0]!.argv).toEqual([
      'codex', 'exec', '-s', 'read-only', '--ephemeral', '--skip-git-repo-check', '-c', 'model_reasoning_effort="high"', '-C', '/work', '-',
    ])
    expect(runs[0]!.stdin).toBe('You are a disciplined review subagent.\n\n## Review task\n\nReview the diff in /tmp/d.patch')
  })

  test('reports a failed Codex run as an error', async ($, on) => {
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('tool.register', ($, e) => ({ value: { tool: `mcp__codex-reviewer__${e.name}` } }))
    on('session.cwd', () => ({ value: '/work' }))
    on('fs.read', () => ({ value: DEFINITION }))
    on('process.run', () => processResult(1, '', 'error: not logged in'))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({ tool: TOOL, prompt: 'Review' })

    expect(ran.isError).toBe(true)
    expect(ran.text).toBe('Codex reviewer failed: error: not logged in')
  })

  test('hides the same-model reviewer agent', async ($, on) => {
    on('agent.offer', () => ({ isOffered: true }))

    const offer = await $.agent.offer({ agent: 'reviewer', description: 'Read-only review specialist', source: 'userSettings', provider: { plugin: 'engine', tier: 'core' } })
    const other = await $.agent.offer({ agent: 'Explore', description: 'Search', source: 'built-in', provider: { plugin: 'engine', tier: 'core' } })

    expect(offer.isOffered).toBe(false)
    expect(other.isOffered).toBe(true)
  })
})
