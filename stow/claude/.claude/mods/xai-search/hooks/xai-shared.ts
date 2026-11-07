// xai_search definition for Claude Code and OpenCode. The xai-search mod and the OpenCode plugin both import this one file.
// Claude Code refuses imports from outside a mod's folder, so it lives here. Keep it free of imports and harness APIs.

export const TOOL_NAME = 'xai_search'

export const TOOL_DESCRIPTION =
  "Search live X (Twitter) posts with xAI's x_search over Pi's SuperGrok/X Premium sign-in. Supports date ranges (to_date is exclusive), handle filters, image/video understanding, and turn/output limits."

// The Pi extension owns the xAI auth guards and request bounds; this mod only adapts its runner.
const RUNNER = '../../../../pi/.pi/agent/extensions/xai-search/run-xai-search.ts'

// Pinned so a project's Node version cannot pick a runtime without native TypeScript.
const NODE = '/opt/homebrew/bin/node'

// The runner's own request timeout is 300 s.
export const RUNNER_TIMEOUT_MS = 330_000
export const RUNNER_FAILED = 'xai_search runner failed'

const handleList = (description: string) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, description: 'X handle, with or without a leading @' },
  minItems: 1,
  maxItems: 20,
  uniqueItems: true,
  description,
})

export const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 1, description: 'What to search for on X (Twitter)' },
    model: { type: 'string', minLength: 1, description: 'xAI model override; uses the configured model when omitted' },
    from_date: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD, from 00:00 UTC' },
    to_date: {
      type: 'string',
      description:
        'Exclusive end date, YYYY-MM-DD, UTC. Posts on this date are not included; to search one day, set to_date to the following day.',
    },
    allowed_x_handles: handleList('Only consider posts from these X handles (maximum 20)'),
    excluded_x_handles: handleList('Exclude posts from these X handles (maximum 20)'),
    enable_image_understanding: { type: 'boolean', description: 'Allow xAI to analyze images in X posts' },
    enable_video_understanding: { type: 'boolean', description: 'Allow xAI to analyze videos in X posts' },
    max_turns: { type: 'integer', minimum: 1, description: 'Maximum xAI assistant/tool-call turns for this search' },
    max_output_tokens: { type: 'integer', minimum: 1, description: 'Maximum output tokens for the final answer' },
  },
}

const PARAM_NAMES = Object.keys(inputSchema.properties)

export type RunnerRun = { readonly exitCode: number; readonly stdout: string; readonly stderr: string }

export type RunnerOutcome = { readonly ok: boolean; readonly text: string }

export function runnerArgv(modRoot: string): [string, ...string[]] {
  return [NODE, `${modRoot}/${RUNNER}`, '--interactive', '--params', '/dev/stdin']
}

export function runnerStdin(call: object) {
  return JSON.stringify(Object.fromEntries(Object.entries(call).filter(([name, value]) => PARAM_NAMES.includes(name) && value !== undefined)))
}

export function runnerOutcome(run: RunnerRun): RunnerOutcome {
  // The runner's errors are already sanitized of credential detail.
  if (run.exitCode !== 0) return { ok: false, text: run.stderr.trim() || RUNNER_FAILED }

  let output: { text?: unknown }

  try {
    output = JSON.parse(run.stdout)
  } catch {
    return { ok: false, text: RUNNER_FAILED }
  }

  if (String(output.text) !== output.text) return { ok: false, text: RUNNER_FAILED }

  return { ok: true, text: output.text }
}
