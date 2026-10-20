import type { EngineInterface, Register } from 'claude-code'

const SCREENED_TOOLS = /^mcp__(exa__web_fetch_exa|exa__web_search_exa|exa__web_search_advanced_exa|Ref__ref_read_url|Ref__ref_search_documentation)$/
const CHUNK_CHARS = 20_000

async function screenChunk($: EngineInterface, text: string): Promise<boolean> {
  const result = await $.mcp.call('jev', 'jev_screen', { text })
  const body = result.content.find(block => block.type === 'text')?.text
  if (result.isError || body === undefined) throw new Error('Jev screening failed')

  const parsed: unknown = JSON.parse(body)
  if (!parsed || typeof parsed !== 'object' || !('recommendation' in parsed)) throw new Error('Jev screening returned an invalid result')
  if ('status' in parsed && parsed.status === 'invalid_response') throw new Error('Jev screening returned an invalid result')
  const recommendation = parsed.recommendation
  if (!recommendation || typeof recommendation !== 'object' || !('action' in recommendation)) throw new Error('Jev screening returned no action')
  if (recommendation.action === 'pass') return true
  if (recommendation.action === 'review' || recommendation.action === 'block' || recommendation.action === 'skip') return false
  throw new Error('Jev screening returned an invalid action')
}

function withheld(text: string) {
  return { isError: true as const, result: text, text }
}

export const register: Register = on => {
  on('tool.call', { tool: SCREENED_TOOLS }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined || result.isError) return result

    try {
      const payload = typeof result.result === 'string' ? result.result : JSON.stringify(result.result)
      const text = [...new Set([result.text, payload].filter((part): part is string => typeof part === 'string' && !!part.trim()))].join('\n')
      for (let offset = 0; offset < text.length; offset += CHUNK_CHARS) {
        if (!await screenChunk($, text.slice(offset, offset + CHUNK_CHARS))) {
          return withheld('Jev screening withheld this web result.')
        }
      }
      return result
    } catch {
      return withheld('Jev screening failed; this web result was withheld.')
    }
  })
}
