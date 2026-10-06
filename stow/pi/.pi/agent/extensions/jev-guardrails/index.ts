import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerJevCoding } from "./jev-coding.ts";
import { registerJevScreen } from "./jev-screen.ts";

/** Register automatic web screening and edit-scope audits using Pi's native Jev classifier. */
export default function jevGuardrails(pi: ExtensionAPI): void {
  registerJevScreen(pi);
  registerJevCoding(pi);
}
