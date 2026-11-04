import type { Register } from 'claude-code'

const MAX_LABEL_LENGTH = 100
const COUNT_NOUNS: Record<string, [string, string]> = {
  Bash: ['Ran', 'shell command'],
  Read: ['Read', 'file'],
  Grep: ['Searched', 'pattern'],
  Glob: ['Searched', 'pattern'],
}

type Call = { tool: string; input: unknown; isRunning: boolean }

const firstLine = (text: string): string => {
  const line = text.split('\n')[0] ?? ''

  return line.length > MAX_LABEL_LENGTH ? `${line.slice(0, MAX_LABEL_LENGTH)}…` : line
}

export const describeCall = ({ tool, input }: Pick<Call, 'tool' | 'input'>): string => {
  const fields = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const label = [fields.description, fields.command, fields.file_path, fields.pattern, fields.query].find(
    value => typeof value === 'string' && value !== '',
  )

  return typeof label === 'string' ? firstLine(label) : tool
}

export const summarizeCalls = (calls: readonly Pick<Call, 'tool'>[]): string => {
  const counts = new Map<string, number>()
  for (const { tool } of calls) {
    const key = tool in COUNT_NOUNS ? tool : 'other'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const parts = [...counts].map(([tool, count]) => {
    const [verb, noun] = COUNT_NOUNS[tool] ?? ['Called', 'tool']

    return `${verb} ${count} ${noun}${count === 1 ? '' : 's'}`
  })

  return parts.join(', ')
}

export const register: Register = on => {
  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    if (e.surface !== 'terminal' || !e.props.isRunning || e.props.isExpanded === true) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" marginTop={1}>
        <Box width={2} flexShrink={0}>
          <Text color="text">⏺</Text>
        </Box>
        <Text color="text">
          <Text weight="bold">{e.props.tool}</Text>({describeCall(e.props)})
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.isExpanded || e.props.isCallsOnly !== true) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const running = e.props.calls.find(call => call.isRunning)
    const label = running === undefined ? summarizeCalls(e.props.calls) : describeCall(running)

    return (
      <Box flexDirection="row" marginTop={1} paddingLeft={2}>
        <Text color="text">{label}</Text>
      </Box>
    )
  })
}
