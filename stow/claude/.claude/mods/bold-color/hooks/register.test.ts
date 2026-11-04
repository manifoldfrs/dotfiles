import { describe, expect, test } from 'claude-code/testing'
import { parseBlocks, parseInline } from './register'

describe('parseBlocks', () => {
  test('marks bold paragraphs rich and merges the rest', () => {
    expect(parseBlocks('one\n\ntwo\n\na **b** c\n\n- **d:** e')).toEqual([
      { kind: 'markdown', text: 'one\n\ntwo' },
      { kind: 'rich', text: 'a **b** c' },
      { kind: 'rich', text: '- **d:** e' },
    ])
  })

  test('leaves tables, headings, fences and italics to Markdown', () => {
    for (const text of ['| **a** |\n| --- |', '## **a**', '```\n**a**\n\nb\n```', '*a* and **b**']) {
      expect(parseBlocks(text)).toEqual([{ kind: 'markdown', text }])
    }
  })
})

describe('parseInline', () => {
  test('splits bold, code, and links', () => {
    expect(parseInline('a **b** `c` [d](https://e.f) g')).toEqual([
      { kind: 'plain', text: 'a ' },
      { kind: 'bold', text: 'b' },
      { kind: 'plain', text: ' ' },
      { kind: 'code', text: 'c' },
      { kind: 'plain', text: ' ' },
      { kind: 'link', text: 'd', href: 'https://e.f' },
      { kind: 'plain', text: ' g' },
    ])
  })

  test('keeps links with other schemes as plain text', () => {
    expect(parseInline('[a](javascript:b)')).toEqual([{ kind: 'plain', text: '[a](javascript:b)' }])
    expect(parseInline('[a](file:///b)')).toEqual([{ kind: 'link', text: 'a', href: 'file:///b' }])
  })
})
