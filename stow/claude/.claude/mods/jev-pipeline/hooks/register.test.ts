import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const TOOL = 'mcp__jev-pipeline__run'

function mcpText(value: unknown) {
  return { value: { content: [{ type: 'text' as const, text: JSON.stringify(value) }], isError: false } }
}

const ISSUES = {
  issues: [
    { identifier: 'PI-1', title: 'CPU spikes', description: 'High CPU on macOS' },
    { identifier: 'PI-2', title: 'README', description: 'Add install docs' },
    { identifier: 'PI-3', title: 'Stuck', description: 'Working... forever' },
  ],
}

const COMMENTS: Record<string, unknown> = {
  'PI-1': { comments: [{ body: 'this is infuriating' }] },
  'PI-2': { comments: [] },
  'PI-3': { comments: [{ body: 'please fix' }, { body: 'still broken' }] },
}

function engine(on: On, files: Map<string, string>, calls: { tool: string; args: any }[]) {
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('tool.register', ($, e) => ({ value: { tool: `mcp__jev-pipeline__${e.name}` } }))
  on('session.id', () => ({ value: 's1' }))
  mock.env(on, { TMPDIR: '/tmp/x/' })
  mock.clock(on, { now: 42 })
  on('fs.write', ($, e) => {
    files.set(e.path, e.text)
    return { value: undefined }
  })
  on('mcp.call', ($, e) => {
    calls.push({ tool: `${e.server}/${e.tool}`, args: e.args })
    if (e.tool === 'list_issues') return mcpText(ISSUES)
    if (e.tool === 'list_comments') return mcpText(COMMENTS[e.args.issueId as string])
    if (e.tool === 'jev_classify') {
      const items = e.args.items as { id: string; text: string }[]
      return mcpText({
        results: items.map(item => ({
          id: item.id,
          classification: item.text.includes('infuriating') ? 'high' : 'none',
          top_probability: item.text.includes('broken') ? 0.6 : 0.95,
          decision: item.text.includes('broken') ? 'review' : 'auto',
        })),
      })
    }
    if (e.tool === 'jev_rerank') {
      const candidates = e.args.candidates as { id: string; text: string }[]
      return mcpText({ ranked: candidates.map(item => ({ id: item.id, relevance: item.text.includes('CPU') ? 0.9 : 0.1 })) })
    }
    return { value: { content: [{ type: 'text' as const, text: 'unknown tool' }], isError: true } }
  })
}

describe('register', () => {
  test('fetches, enriches, and classifies without returning the raw items', async ($, on) => {
    const files = new Map<string, string>()
    const calls: { tool: string; args: any }[] = []
    engine(on, files, calls)

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({
      tool: TOOL,
      source: { server: 'linear', tool: 'list_issues', args: { state: 'open' }, items: 'issues' },
      fields: { id: 'identifier', title: 'title', text: ['title', 'description'] },
      enrich: { server: 'linear', tool: 'list_comments', args: { issueId: '{{identifier}}' }, items: 'comments', text: ['body'] },
      judge: { kind: 'classify', classes: [{ id: 'none', description: 'calm' }, { id: 'high', description: 'angry' }] },
      limit: 1,
    })

    expect(ran.isError).toBeUndefined()
    expect(ran.result).toEqual({
      total: 3,
      results_file: '/tmp/x/jev-pipeline-s1-42.json',
      by_class: {
        high: { count: 1, review: 0, top: ['PI-1 CPU spikes (p=0.95)'] },
        none: { count: 2, review: 1, top: ['PI-2 README (p=0.95)'] },
      },
    })
    expect(calls.filter(call => call.tool === 'linear/list_comments').map(call => call.args)).toEqual([
      { issueId: 'PI-1' },
      { issueId: 'PI-2' },
      { issueId: 'PI-3' },
    ])
    const saved = JSON.parse(files.get('/tmp/x/jev-pipeline-s1-42.json') ?? '[]')
    expect(saved.find((item: { id: string }) => item.id === 'PI-3').text).toBe('Stuck\nWorking... forever\nplease fix\nstill broken')
  })

  test('reranks across items and lists the top ones', async ($, on) => {
    const files = new Map<string, string>()
    const calls: { tool: string; args: any }[] = []
    engine(on, files, calls)

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({
      tool: TOOL,
      source: { server: 'linear', tool: 'list_issues', items: 'issues' },
      fields: { id: 'identifier', title: 'title', text: ['description'] },
      judge: { kind: 'rerank', query: 'performance complaints' },
      limit: 1,
    })

    expect((ran.result as { top: string[] }).top).toEqual(['PI-1 CPU spikes (relevance=0.9)'])
  })

  test('reports a source that is not a list', async ($, on) => {
    const calls: { tool: string; args: any }[] = []
    engine(on, new Map(), calls)

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    const ran = await $.tool.call({
      tool: TOOL,
      source: { server: 'linear', tool: 'list_issues', items: 'nodes' },
      fields: { text: ['title'] },
      judge: { kind: 'rerank', query: 'x' },
      limit: 5,
    })

    expect(ran.isError).toBe(true)
    expect(ran.text).toBe('jev-pipeline failed: No array at "nodes" in the MCP result')
    expect(calls.map(call => call.tool)).toEqual(['linear/list_issues'])
  })
})
