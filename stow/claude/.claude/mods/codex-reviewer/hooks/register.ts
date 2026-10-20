import type { Register } from 'claude-code'

const TOOL_NAME = 'reviewer'
const AGENT_NAME = 'reviewer'
// The Claude reviewer agent's definition stays the one source of the review instructions.
const REVIEWER_PROMPT = '../../agents/reviewer.md'
// Matches the reviewer agent's `effort: high` and Pi's `thinking: high`.
const CODEX_ARGS = ['codex', 'exec', '-s', 'read-only', '--ephemeral', '--skip-git-repo-check', '-c', 'model_reasoning_effort="high"']
// The most `$.process.run` allows.
const CODEX_TIMEOUT_MS = 10 * 60_000
const CODEX_FAILED = 'Codex reviewer failed'
const FRONTMATTER = /^---\n[\s\S]*?\n---\n/

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt'],
  properties: {
    prompt: {
      type: 'string',
      minLength: 1,
      description: 'The review task: the exact diff or the files and plan to review, the requirements, and what to check',
    },
  },
}

function failed(text: string) {
  return { isError: true as const, result: text, text }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({
      name: TOOL_NAME,
      description:
        'Read-only review specialist on GPT (Codex) for code diffs, plans, proposed solutions, codebase health, and PR/issue validation: a reviewer from a different model family than you. Pass the exact diff or the files and plan to review in the prompt. Returns findings; applies no fixes.',
      inputSchema,
    })

    return next(e)
  })

  // Pi pins its reviewer to the other provider; here the GPT tool replaces the same-model agent.
  on('agent.offer', { agent: AGENT_NAME }, () => ({ isOffered: false }))

  on('tool.call', { tool: 'mcp__codex-reviewer__reviewer' }, async ($, e) => {
    const task = String((e as unknown as { prompt?: unknown }).prompt ?? '')
    const definition = await $.fs.read(`${$.plugin.root}/${REVIEWER_PROMPT}`).catch(() => undefined)
    if (definition === undefined) return failed(`${CODEX_FAILED}: reviewer.md is missing`)
    const instructions = definition.replace(FRONTMATTER, '').trim()
    const cwd = await $.session.cwd()

    const run = await $.process
      .run([...CODEX_ARGS, '-C', cwd, '-'], {
        stdin: `${instructions}\n\n## Review task\n\n${task}`,
        timeoutMs: CODEX_TIMEOUT_MS,
      })
      .catch(() => undefined)
    if (!run) return failed(CODEX_FAILED)
    // Codex prints progress to stderr and only its final answer to stdout.
    const answer = run.stdout.trim()
    if (run.exitCode !== 0 || !answer) return failed(`${CODEX_FAILED}: ${run.stderr.trim().split('\n').slice(-5).join('\n')}`)

    return { result: answer }
  })
}
