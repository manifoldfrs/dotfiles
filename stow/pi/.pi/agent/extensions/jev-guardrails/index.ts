import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerJevCoding } from "./jev-coding.ts";

/** Register automatic edit-scope audits using Pi's native Jev classifier. */
export default function jevGuardrails(pi: ExtensionAPI): void {
  registerJevCoding(pi);
}
