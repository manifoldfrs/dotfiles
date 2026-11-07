import type { Register } from 'claude-code'

const BOLD_COLOR = '#7AA2F7'
const CODE_COLOR = '#7DCFFF'
const BOLD_SPAN = /\*\*(?=\S).+?(?<=\S)\*\*/
const INLINE_TOKEN = /(\*\*(?=\S).+?(?<=\S)\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/
const SAFE_LINK_TARGET = /^(https?|file):/i
const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/
const FENCE = /^\s*(```|~~~)/
const MARKDOWN_ONLY_LINE = /^\s*(\||#{1,6}\s|>|```|~~~)/
const ITALIC = /(^|[^*\w])[*_][^*_\s][^*_\n]*[*_]($|[^*\w])/

export type Block = { kind: 'markdown' | 'rich'; text: string }
export type Token =
  | { kind: 'plain' | 'bold' | 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

const isRich = (chunk: string): boolean =>
  BOLD_SPAN.test(chunk) &&
  !chunk.split('\n').some(line => MARKDOWN_ONLY_LINE.test(line)) &&
  !ITALIC.test(chunk.replace(new RegExp(BOLD_SPAN, 'g'), ''))

const splitChunks = (text: string): string[] => {
  const chunks: string[] = []
  let current: string[] = []
  let isInFence = false

  for (const line of text.split('\n')) {
    if (FENCE.test(line)) {
      isInFence = !isInFence
    }
    if (line.trim() === '' && !isInFence) {
      chunks.push(current.join('\n'))
      current = []
      continue
    }
    current.push(line)
  }
  chunks.push(current.join('\n'))

  return chunks.filter(chunk => chunk !== '')
}

export const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = []

  for (const chunk of splitChunks(text)) {
    const kind = isRich(chunk) ? 'rich' : 'markdown'
    const previous = blocks.at(-1)
    if (kind === 'markdown' && previous?.kind === 'markdown') {
      previous.text = `${previous.text}\n\n${chunk}`
      continue
    }
    blocks.push({ kind, text: chunk })
  }

  return blocks
}

export const parseInline = (line: string): Token[] =>
  line
    .split(INLINE_TOKEN)
    .filter(part => part !== '')
    .map((part): Token => {
      const link = LINK.exec(part)
      if (link !== null && SAFE_LINK_TARGET.test(link[2] ?? '')) {
        return { kind: 'link', text: link[1] ?? '', href: link[2] ?? '' }
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return { kind: 'bold', text: part.slice(2, -2).replaceAll('`', '') }
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return { kind: 'code', text: part.slice(1, -1) }
      }

      return { kind: 'plain', text: part }
    })

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    if (e.surface !== 'terminal' || !BOLD_SPAN.test(e.props.text)) {
      return next(e)
    }

    const blocks = parseBlocks(e.props.text)
    if (!blocks.some(block => block.kind === 'rich')) {
      return next(e)
    }

    const { Box, Link, Markdown, Text } = $.ui.resolve(e)

    const inline = (line: string) =>
      parseInline(line).map(token => {
        if (token.kind === 'bold') {
          return <Text color={BOLD_COLOR} weight="bold">{token.text}</Text>
        }
        if (token.kind === 'code') {
          return <Text color={CODE_COLOR}>{token.text}</Text>
        }
        if (token.kind === 'link') {
          return <Link href={token.href}>{token.text}</Link>
        }

        return token.text
      })

    const richLine = (line: string) => {
      const item = LIST_ITEM.exec(line)
      if (item === null) {
        return <Text>{inline(line)}</Text>
      }

      return (
        <Box flexDirection="row" paddingLeft={(item[1] ?? '').length}>
          <Text>{`${item[2] ?? ''} `}</Text>
          <Text>{inline(item[3] ?? '')}</Text>
        </Box>
      )
    }

    const body = blocks.map((block, index) => (
      <Box flexDirection="column" marginTop={index === 0 ? 0 : 1}>
        {block.kind === 'markdown' ? (
          <Markdown text={block.text} />
        ) : (
          block.text.split('\n').map(richLine)
        )}
      </Box>
    ))

    return (
      <Box flexDirection="row" marginTop={1}>
        <Box width={2} flexShrink={0}>
          <Text color="text">{e.props.isFirstOfReply ? '⏺' : ' '}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>{body}</Box>
      </Box>
    )
  })
}
