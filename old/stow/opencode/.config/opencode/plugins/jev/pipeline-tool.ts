import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mcpToolName, type ToolCaller } from "./jev.ts"
import { parsePipelineInput, pipelineInputSchema, runPipeline, type Json, type PipelinePorts } from "./shared.ts"

export const PIPELINE_TOOL = "jev_pipeline"

export const PIPELINE_INPUT = pipelineInputSchema({
  server: "MCP server name as configured under mcp.servers, e.g. \"hey\"",
  tool: "Tool name on that server, as the server names it",
})

function ports(call: ToolCaller, sessionID: string): PipelinePorts {
  return {
    call: (step, args) => call(mcpToolName(step.server, step.tool), args),
    saveResults: async json => {
      const path = join(tmpdir(), `jev-pipeline-${sessionID}-${Date.now()}.json`)

      await writeFile(path, json)

      return path
    },
  }
}

export function runPipelineTool(call: ToolCaller, sessionID: string, input: Json) {
  return runPipeline(ports(call, sessionID), parsePipelineInput(input))
}
