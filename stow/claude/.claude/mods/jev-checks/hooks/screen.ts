import type { Register } from 'claude-code'

import { errorResult, jevCaller } from './mcp.ts'
import { recentUserPrompts, showNote } from './coding.ts'
import { isSentLink, screenText } from './jev-shared.ts'

const SCREENED_TOOLS = /^mcp__(exa__web_fetch_exa|exa__web_search_exa|exa__web_search_advanced_exa|claude_ai_Exa__web_fetch_exa|claude_ai_Exa__web_search_exa|claude_ai_Exa__agent_run|Ref__ref_read_url|Ref__ref_search_documentation)$/

export const registerScreen: Register = on => {
  on('tool.call', { tool: SCREENED_TOOLS }, async ($, e, next) => {
    const result = await next(e)

    if (result.deny !== undefined || result.isError) return result

    const payload = String(result.result) === result.result ? result.result : JSON.stringify(result.result)
    const text = [...new Set([result.text, payload].flatMap(part => part?.trim() ? [part] : []))].join('\n')
    const outcome = await screenText(jevCaller($), note => showNote($, note), text, isSentLink(e.tool, JSON.stringify(e), recentUserPrompts()))

    if (outcome.kind === 'withhold') return errorResult(outcome.text)

    if (outcome.kind === 'warn') return { ...result, context: [...(result.context ?? []), outcome.warning] }

    return result
  })
}
