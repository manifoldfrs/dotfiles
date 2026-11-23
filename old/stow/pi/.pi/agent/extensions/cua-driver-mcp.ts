import { existsSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// cua-driver's browser tools keep their attachment per connection, so they need one persistent MCP server rather than
// one-off `cua-driver call` runs. It only exists on the Mac, which is why it isn't in the shared mcp.json.
const CUA_DRIVER = "/opt/homebrew/bin/cua-driver";

export default function cuaDriverMcp(pi: ExtensionAPI): void {
  if (process.platform !== "darwin" || !existsSync(CUA_DRIVER)) return;

  pi.registerMcpServer("cua-driver", {
    command: CUA_DRIVER,
    args: ["mcp"],
    exposure: "codemode",
    description: "Drive native Mac apps and a dedicated signed-in Chrome profile for agents",
  });
}
