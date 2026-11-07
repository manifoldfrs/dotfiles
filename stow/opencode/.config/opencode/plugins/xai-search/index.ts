import { Plugin } from "@opencode/plugin"
import { runProcess, xaiSearchTool } from "./tool.ts"

export default Plugin.define({
  id: "xai-search",
  async setup(ctx) {
    await ctx.tool.transform(editor => {
      editor.add(xaiSearchTool(runProcess))
    })
  },
})
