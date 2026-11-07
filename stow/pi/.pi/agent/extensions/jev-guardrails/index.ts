import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { generateStateless, registerJevChecks } from "./checks.ts";
import { callJev, closeJev } from "./jev-mcp.ts";

/** Pi entry point: the checks live in checks.ts so tests can load them without Pi's runtime. */
export default function jevChecks(pi: ExtensionAPI): void {
  registerJevChecks(pi, { callJev, generate: generateStateless });
  pi.on("session_shutdown", () => closeJev());
}
