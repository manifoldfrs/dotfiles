import type { EngineInterface, Register } from 'claude-code'

import { errorResult, mcpJson } from './mcp.ts'
import { PIPELINE_DESCRIPTION, errorText, parseJson, parsePipelineInput, pipelineInputSchema, runPipeline, type PipelinePorts } from './jev-shared.ts'

const TOOL_NAME = 'run'

const inputSchema = pipelineInputSchema({
  server: 'MCP server name as /mcp lists it, e.g. "claude.ai Linear"',
  tool: 'Tool name on that server, without the mcp__ prefix',
})

async function resultsFile($: EngineInterface) {
  const dir = (await $.env.get('TMPDIR')) || '/tmp/'

  return `${dir.replace(/\/?$/, '/')}jev-pipeline-${await $.session.id()}-${await $.clock.now()}.json`
}

function ports($: EngineInterface): PipelinePorts {
  return {
    call: async (step, args) => mcpJson(await $.mcp.call(step.server, step.tool, args)),
    saveResults: async json => {
      const path = await resultsFile($)

      await $.fs.write(path, json)

      return path
    },
  }
}

export const registerPipeline: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.tool.register({ name: TOOL_NAME, description: PIPELINE_DESCRIPTION, inputSchema })

    return next(e)
  })

  on('tool.call', { tool: /^mcp__jev-checks__run$/ }, async ($, e) => {
    try {
      return { result: JSON.stringify(await runPipeline(ports($), parsePipelineInput(parseJson(JSON.stringify(e))))) }
    } catch (error) {
      return errorResult(`jev-pipeline failed: ${errorText(error)}`)
    }
  })
}
