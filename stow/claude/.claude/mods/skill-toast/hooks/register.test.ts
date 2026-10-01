import { describe, expect, test } from 'claude-code/testing'

describe('register', () => {
  test('a loaded skill shows a toast and keeps its prompt', async ($, on) => {
    const toasts: string[] = []
    on('ui.toast', ($, e) => {
      toasts.push(e.text)
      return { value: undefined }
    })
    on('skill.prompt', ($, e) => ({ text: e.text }))

    const { text } = await $.skill.prompt({ skill: 'tdd', text: 'Do TDD.' })

    expect(text).toBe('Do TDD.')
    expect(toasts).toEqual(['Skill ready: /tdd'])
  })
})
