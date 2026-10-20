import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import { findMentions } from './register'

const SKILLS: Record<string, string> = {
  '/repo/.claude/skills/prove/SKILL.md': '---\nname: prove\n---\n\nProject prove body\n',
  '/home/.claude/skills/prove/SKILL.md': '---\nname: prove\n---\n\nUser prove body\n',
  '/home/.claude/skills/testing/SKILL.md': '---\nname: testing\n---\n\nTesting body\n',
}

function engine(on: On) {
  const entered: { text: string; context?: readonly string[] }[] = []
  on('env.get', () => ({ value: '/home' }))
  on('session.root', () => ({ value: '/repo' }))
  on('fs.read', ($, e) => {
    const text = SKILLS[String(e.path)]
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('prompt.submit', ($, e) => {
    entered.push({ text: e.text, context: e.context })
    return { text: e.text, context: e.context }
  })
  return entered
}

describe('findMentions', () => {
  test('finds /name mentions outside code and paths', () => {
    expect(findMentions('use /testing and /prove, not `/dig` or /tmp/x (/testing)')).toEqual(['testing', 'prove'])
  })
})

describe('register', () => {
  test('attaches each mentioned skill, the personal copy first', async ($, on) => {
    const entered = engine(on)

    await $.prompt.submit({ text: 'fix it with /testing then /prove.', wait: false, origin: { kind: 'composer' } })

    expect(entered[0]!.text).toBe('fix it with /testing then /prove.')
    expect(entered[0]!.context).toEqual([
      '<skill name="testing" location="/home/.claude/skills/testing/SKILL.md">\nReferences are relative to /home/.claude/skills/testing.\n\nTesting body\n</skill>',
      '<skill name="prove" location="/home/.claude/skills/prove/SKILL.md">\nReferences are relative to /home/.claude/skills/prove.\n\nUser prove body\n</skill>',
    ])
  })

  test('passes prompts without known skills through unchanged', async ($, on) => {
    const entered = engine(on)

    await $.prompt.submit({ text: 'look in /tmp and /nope', wait: false, origin: { kind: 'composer' } })

    expect(entered[0]!.context).toBeUndefined()
  })
})
