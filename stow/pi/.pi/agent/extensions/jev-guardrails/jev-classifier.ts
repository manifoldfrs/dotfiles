import type { ClassifierContext, ClassifierResult } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

/** Run a native Jev classifier with the active operation's cancellation signal. */
export async function classifyWithJev(
  ctx: ExtensionContext,
  input: ClassifierContext,
): Promise<ClassifierResult> {
  const model = ctx.modelRegistry.findOfType("classifier", "typesafe", "jev-latest");
  if (!model) throw new Error("Jev guardrails: classifier is unavailable");
  const result = await ctx.modelRegistry.classify(model, input, ctx.signal ? { signal: ctx.signal } : undefined);
  if (result.stopReason !== "stop") throw new Error("Jev guardrails: classification failed");
  return result;
}
