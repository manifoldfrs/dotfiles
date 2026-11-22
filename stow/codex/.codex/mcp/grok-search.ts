import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { XaiSearchRequest } from '../../../../mcp/xai-search/xai-request.ts'

const execute = promisify(execFile)

interface SearchEvent {
  type?: string
  toolCallId?: string
  toolName?: string
  status?: string
  data?: string
  stopReason?: string
}

function readSearchResult(stdout: string, tools: string[]) {
  let events: SearchEvent[]
  try {
    events = stdout.trim().split('\n').map(line => JSON.parse(line))
  } catch {
    throw new Error('Grok returned an invalid search event stream.')
  }
  const last = events.at(-1)
  if (last?.type !== 'end' || last.stopReason !== 'EndTurn') throw new Error('Grok did not finish its search.')

  for (const tool of tools) {
    const calls = events.filter(event => event.type === 'tool_call' && event.toolName === tool)
    const completed = calls.some(call => call.status === 'completed' || events.some(event =>
      event.type === 'tool_call_update' && event.toolCallId === call.toolCallId && event.status === 'completed',
    ))
    if (!completed) throw new Error(`Grok did not report a completed ${tool} call.`)
  }

  const text = events.filter(event => event.type === 'text').map(event => event.data ?? '').join('').trim()
  if (!text) throw new Error('Grok returned an empty search result.')
  return text
}

export async function runGrokSearch(request: XaiSearchRequest, signal: AbortSignal) {
  if (request.maxOutputTokens !== undefined || request.tools.some(tool => Object.keys(tool).length > 1)) {
    throw new Error('Exact filters and output-token limits require the xAI API route. Remove those options to use the Grok sign-in.')
  }

  const userHome = homedir()
  const grokHome = process.env.GROK_HOME ?? join(userHome, '.grok')
  const installed = join(grokHome, 'bin', 'grok')
  const executable = existsSync(installed) ? installed : 'grok'
  const tools = request.sources.map(source => source === 'x' ? 'x_search' : 'web_search')
  const args = [
    '--no-auto-update', '--no-memory', '--no-subagents', '--sandbox', 'read-only',
    '--permission-mode', 'dontAsk', '--output-format', 'streaming-json',
    '--model', request.model,
  ]
  if (request.maxTurns !== undefined) args.push('--max-turns', String(request.maxTurns))

  const cwd = await mkdtemp(join(tmpdir(), 'codex-xai-search-'))
  try {
    const prompt = join(cwd, 'query.txt')
    const agent = join(cwd, 'search.md')
    await writeFile(prompt, request.query, { mode: 0o600 })
    await writeFile(agent, [
      '---', 'name: codex-xai-search', 'description: Search for source links',
      `tools: ${JSON.stringify(tools)}`, 'mcpServers: []', '---',
      'Use the enabled search tools to answer the query and cite the source URLs.',
    ].join('\n'), { mode: 0o600 })
    args.push('--agent', agent, '--prompt-file', prompt)
    let stdout: string
    try {
      ({ stdout } = await execute(executable, args, {
        cwd, signal, timeout: 300_000,
        env: { HOME: userHome, GROK_HOME: grokHome, PATH: process.env.PATH },
      }))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Install Grok Build and run grok login to enable subscription X search.')
      }
      if (signal.aborted) throw error
      throw new Error('Grok Build did not complete. Check grok login and model availability.')
    }
    return readSearchResult(stdout, tools)
  } finally {
    await rm(cwd, { recursive: true, force: true })
  }
}
