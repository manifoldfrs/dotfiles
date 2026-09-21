# Research: Native OpenCode V2 parity with valued Pi features

## Summary

The reviewed document conflates two implementations: the established `packages/opencode` runtime and the in-development native V2 implementation under `packages/core` (described by `specs/v2`).
Native V2's compaction algorithm is genuinely closer to Pi than the established runtime, but V2 does not currently offer Pi-like `/reload`, and the established runtime's `experimental.session.compacting` hook must not be presented as a native V2 capability.
Bottom line: native V2 is **partial** on compaction, **no** on Pi-style hot reload, and **partial/immature** on custom plugins.

## Bottom line

| Valued Pi feature | Native OpenCode V2 | Verdict |
| --- | --- | --- |
| Compaction strategy | Recent complete turns retained by token/turn budget, oversized-turn suffix handling, previous-summary carry-forward, configurable `keep`/`buffer`; not Pi's exact retained-entry/session-tree contract | **Partial (close)** |
| Hot reload | Configuration is read once for a location and re-read only when that location is reopened; no documented Pi-like `/reload` for config or PluginV2 modules | **No** |
| Custom extensions/plugins | A native PluginV2 runtime exists, but it is a different, still-moving interface; legacy experimental compaction hooks do not establish V2 support, and Pi has the broader documented interactive extension API | **Partial** |

## Findings

1. **Claim:** The document's main framing is materially ambiguous because native V2 is not the same code path as the established OpenCode runtime. Native V2 is specified under `specs/v2` and implemented under `packages/core`; established behavior is under `packages/opencode`. **Sources:** [V2 implementation instructions](https://github.com/anomalyco/opencode/blob/dev/specs/v2/instructions.md), [native V2 compaction](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/compaction.ts), [established-runtime compaction](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/compaction.ts). **Support:** direct repository structure and implementation evidence. **Confidence:** high.

   Any statement saying simply “current OpenCode” must identify which runtime and pin a commit.
   The document currently combines native V2 configuration/compaction claims with established-runtime plugin hooks as though they form one supported product surface.

2. **Claim:** Native V2 compaction is meaningfully Pi-like, but not exact Pi parity. V2 groups messages into turns, retains complete recent turns within configured token/turn limits, can retain the suffix of an oversized turn at a message boundary, records a tail boundary, and supplies the previous summary to later compaction. Pi retains a verbatim recent tail using `keepRecentTokens`, persists `firstKeptEntryId`, carries the previous summary, protects tool-call/result boundaries, and separately summarizes a discarded oversized-turn prefix. **Sources:** [native V2 compaction](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/compaction.ts), [native V2 config](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts), [Pi compaction documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md), [Pi compaction implementation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts). **Support:** direct implementation comparison. **Confidence:** high.

   The document's V2-style `compaction.keep.tokens` and `buffer` example belongs to native V2, not the established `packages/opencode` configuration schema.
   The native approach is close in the user-visible property that recent work remains verbatim, but exact selection, persisted boundary metadata, split-turn summarization, token accounting, and session-tree reconstruction differ.
   **Researcher inference:** “close enough” is plausible only when authoritative task state lives outside the transcript and repeated/oversized-turn tests pass on the pinned V2 commit.

3. **Claim:** The established runtime has a different compaction contract and schema, so it cannot be used to validate native V2—or vice versa. The established schema exposes `auto`, `prune`, and `reserved`; it does not expose native V2's `keep.tokens`/`buffer` shape. **Sources:** [established configuration source](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts), [established compaction source](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/compaction.ts), [native V2 config](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts). **Support:** direct schema comparison. **Confidence:** high.

   **Gap, high severity:** the reviewed document presents native V2 settings immediately beside “legacy” names without clearly saying they target different runtimes and compatibility layers.

4. **Claim:** Native V2 does not currently provide Pi-style hot reload. Its config source states that configuration is read once until the location is reopened. Pi explicitly provides `/reload` to reload extensions during development. **Sources:** [native V2 config lifecycle](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts), [V2 instructions](https://github.com/anomalyco/opencode/blob/dev/specs/v2/instructions.md), [Pi extensions documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md). **Support:** direct evidence. **Confidence:** high.

   For native V2, opening/reopening a location is the supported config-refresh boundary shown by source; it is not arbitrary live reload.
   Plugin code, plugin-list changes, provider/auth setup, and initialization-time changes should be treated as requiring location reopen or process restart unless a pinned build demonstrates a narrower supported refresh path.
   There is no user-facing native V2 equivalent to Pi's documented `/reload` that reloads extensions in place.

5. **Claim:** The document's proposed compaction plugin combines incompatible surfaces. `experimental.session.compacting` belongs to the established plugin API; `experimental.compaction.autocontinue` is not in the current established hook types; neither hook is evidence of a native PluginV2 capability. **Sources:** [established plugin API](https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts), [native PluginV2 runtime](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/plugin.ts), [V2 instructions](https://github.com/anomalyco/opencode/blob/dev/specs/v2/instructions.md). **Support:** direct API/source comparison. **Confidence:** high on the runtime distinction and missing established autocontinue hook; medium on PluginV2's rapidly changing complete surface.

   **Gap, blocker severity:** the recommendation to use “a small pinned plugin” for V2 compaction is not implementable as written unless the pinned native PluginV2 interface independently exposes equivalent hooks.
   A hook with the same purpose in `packages/plugin` does not automatically run in `packages/core`.

6. **Claim:** Custom code is strong in both ecosystems, but native V2 plugin stability and breadth do not yet equal Pi's documented extension contract. Pi extensions can register tools, commands, keyboard shortcuts, CLI flags, providers, lifecycle handlers, and custom UI; Pi also documents `/reload`. The established OpenCode plugin API supports tools, providers/auth, events, chat/tool/permission interception, environment shaping, and experimental transforms, while native V2 uses the separate PluginV2 runtime. **Sources:** [Pi extensions documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md), [Pi extension examples](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent/examples/extensions), [established OpenCode plugins documentation](https://opencode.ai/docs/plugins/), [established OpenCode plugin types](https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts), [native PluginV2 runtime](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/plugin.ts). **Support:** direct evidence and source interpretation. **Confidence:** medium-high.

   **Researcher inference:** PluginV2 is adequate only after verifying the exact hooks needed by OptoJr on a pinned commit.
   It should presently be treated as an evolving trusted-code interface, not a compatibility layer for established plugins or a Pi-extension drop-in.

7. **Claim:** The reviewed document has material gaps/outdated claims in `docs/research/opencode-v2-and-pi-for-optojr.md`. **Sources:** all primary sources above. **Support:** audit comparison. **Confidence:** high.

   - **Blocker:** It imports established-runtime experimental hooks into the native V2 recommendation without proving PluginV2 implements them.
   - **High:** It does not cover reload behavior; native V2 config is read once per opened location and V2 has no Pi-like `/reload` contract.
   - **High:** It calls `experimental.compaction.autocontinue` available, but that hook is absent from current established plugin types and is not established for PluginV2.
   - **High:** It fails to label `packages/core` V2 claims separately from `packages/opencode` established-runtime claims.
   - **Medium:** Moving `dev` URLs cannot substantiate a recommendation to pin a release/commit; all behavioral claims need one chosen commit permalink before implementation.
   - **Medium:** Its Pi links use `earendil-works/pi`, while current upstream Pi is `badlogic/pi-mono`; fork-specific behavior should be identified or replaced.
   - **Medium:** It calls plugins “experimental” too broadly. The important distinction is between the established plugin mechanism, explicitly `experimental.*` hooks, and the separate native PluginV2 runtime.
   - **Medium:** It omits Pi's broader interactive extension API and explicit reload development loop.

## Contradictions

- Native V2 source supports the document's recent-tail compaction description, while the established runtime schema does not. These are different implementations, not evidence that one source is simply stale.
- The document claims an autocontinue hook; current established plugin types do not list it, and native V2 uses PluginV2 rather than that interface.
- The document implies plugin/config hot iteration is available enough for a small customization layer, but native V2 config explicitly has a read-once-per-location lifecycle and Pi alone documents `/reload` among the compared sources.

## Missing evidence

- Native V2 is moving on `dev`; this audit could not identify a released, stability-guaranteed PluginV2 contract.
- No primary source promises hot reload for native V2 PluginV2 modules.
- The exact native V2 behavior after “reopening” a location—especially whether all imported plugin module state is recreated—needs an end-to-end test on the pinned commit.
- No primary-source benchmark compares OpenCode V2 and Pi summary fidelity, overflow recovery, cost, or repeated-compaction drift.
- The OptoJr-required PluginV2 capabilities have not been mapped hook-by-hook against a pinned commit.

## Sources

- Kept: [V2 instructions](https://github.com/anomalyco/opencode/blob/dev/specs/v2/instructions.md) — identifies native V2 scope and development contract.
- Kept: [native V2 config](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/config.ts) — config schema and read-once lifecycle.
- Kept: [native V2 compaction](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/session/compaction.ts) — actual recent-turn algorithm.
- Kept: [native PluginV2 runtime](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/plugin.ts) — V2 plugin implementation boundary.
- Kept: [established config](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts), [compaction](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/compaction.ts), and [plugin types](https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts) — proves the separate legacy/stable behavior surface.
- Kept: [Pi compaction docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/compaction.md), [implementation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts), and [extension docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md) — current upstream comparison.
- Rejected/deprioritized: unqualified “OpenCode v2” claims — ambiguous unless they identify `packages/core` native V2 versus an SDK v2 or established runtime.
- Rejected/deprioritized: `earendil-works/pi` links — not current upstream Pi and fork provenance was not established.

## Next steps

Pin a native V2 commit, then test three things before adoption: repeated and oversized-turn compaction; config/plugin changes before and after location reopen; and the exact PluginV2 hooks required for structured compaction and continuation control.
Until those pass, remove the proposed compaction plugin from the recommendation and plan on reopen/restart for runtime changes.
