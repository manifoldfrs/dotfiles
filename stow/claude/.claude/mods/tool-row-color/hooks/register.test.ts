import { describe, expect, test } from 'claude-code/testing'
import { describeCall, summarizeCalls } from './register'

describe('describeCall', () => {
  test('prefers the description, then the command', () => {
    expect(describeCall({ tool: 'Bash', input: { description: 'List files', command: 'ls' } })).toBe('List files')
    expect(describeCall({ tool: 'Bash', input: { command: 'ls\npwd' } })).toBe('ls')
  })

  test('falls back to the tool name', () => {
    expect(describeCall({ tool: 'Agent', input: null })).toBe('Agent')
  })
})

describe('summarizeCalls', () => {
  test('counts calls by kind', () => {
    expect(summarizeCalls([{ tool: 'Read' }, { tool: 'Read' }, { tool: 'Bash' }, { tool: 'Jev' }])).toBe(
      'Read 2 files, Ran 1 shell command, Called 1 tool',
    )
  })
})
