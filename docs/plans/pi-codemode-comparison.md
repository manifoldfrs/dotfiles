# Bring three useful Pi Codemode ideas to OpenCode

## Approved scope and current status

Plannotator approved Changes 1 and 2, using the section numbers below.
Change 3 (native store/load) is deferred.
After checkout discovery, you selected **Only improve Jev for now** because no OpenCode V2 core checkout was found.
Change 1 therefore remains approved in principle but blocked on a target checkout.
Change 2 was prepared in an isolated dotfiles worktree because the original TypeSafe plugin source is linked into live configuration.
After your explicit **apply it** approval, the reviewed patch was applied to the original tracked source and the new output module was linked into live configuration.
The running session hot-reloaded the plugin: its tool catalog now advertises the updated description and structured `answers`, `model`, and `usage` result.
The live linked plugin imports successfully; no shared-service restart was performed.
Typechecking, all 12 plugin contract tests, and isolated dotfiles preflight pass.
Installed-runtime validation remains blocked: OpenCode v2.0.22 times out during standalone startup in a temporary home, both with and without the fixture plugin, before making a local model request.
No claim is made that a real agent now selects Jev without reminders; that behavior still needs a live-model check with separate usage approval.
The apply approval did not include package installation, paid model calls, or a shared-service restart.

## Decision to review

Keep OpenCode's existing Code Mode and improve three things:
1. Let scripts call coding tools.
2. Add built-in `store()` and `load()` globals.
3. Make agents notice and use Jev when a task needs a typed judgment.

These are implementation targets, not features that need a separate usefulness study.
Use tests to check the changes, not to delay them.
Do not replace the runtime just to match Pi's feature list.

This plan records the approved intent and deferred options.
The current execution scope is only Change 2, as recorded above.
Applying a chosen change to live configuration requires separate approval after you review the tracked source and validation results.

## The short explanation

Both agents can let the model write a script that calls tools and returns a small answer.
Pi adds useful features around that script.
Your feedback identifies three changes worth making now.

```text
Already in your OpenCode

Model writes a script
  ├── search for a tool
  ├── call several tools at once
  ├── filter the results
  └── return the useful parts

Selected improvements inspired by Pi
  ├── include file-search and file-read tools
  ├── keep small working values between scripts
  └── guide the agent to use Jev for typed judgments

Already possible, but not easy enough to discover
  └── call Jev from a script: improve instructions and examples
```

**Tool catalog** means the tools available inside a script.
**Direct tool** means a tool the model calls without a script.
**Runtime** means the engine that runs the script.
**Machine-local state** includes saved working values; it must stay outside version control.

## Compare the options

| Idea from Pi | What you gain | What OpenCode already has | Recommendation |
|---|---|---|---|
| Call coding tools inside scripts | Search files, read matches, then return selected evidence in one script | Plugins can change tool routing; ordinary coding tools are currently direct | **Implement**, preserve direct access where possible |
| Keep small values between scripts | Reuse IDs or page cursors without printing them into the conversation | Durable plugin storage, but no built-in `store()` / `load()` script globals | **Implement native globals in core** |
| Call classifiers inside scripts | Fetch items, judge them with Jev, return a shortlist | Existing TypeSafe plugin and Jev tools are script-callable | **Improve guidance, discovery, and output contracts** |
| Better tool discovery | Find the right tool with fewer failed searches | Search by path, description, namespace, and pagination | **Measure before changing search** |
| Per-script limits | Bound runtime, tool-call count, and returned output | Runtime supports limits, but the reviewed core integration does not pass them | **Consider a focused core proposal** |
| Use QuickJS instead of OpenCode's interpreter | Broader JavaScript behavior and Pi's worker/VM design | A confined JavaScript-subset interpreter | **Defer unless an actual script fails on unsupported syntax** |

Moving tools is not the same as adding dual access.
OpenCode's current routing puts each registration on one side; Pi can expose a tool both directly and inside scripts.
The target is dual access, not loss of direct tools.

## Change 1: call coding tools inside scripts

**Why not just update it?** We can.
A plugin can move a tool into Code Mode today.
The limitation is that moving a tool removes its direct declaration; it does not expose both routes.
The preferred change is to support both routes through the same execution pipeline.

```text
Current
  model → grep → results in conversation
  model → read → file content in conversation
  model → read → more file content in conversation
  model → selects evidence

Candidate
  model → execute
            grep
              → read matching files concurrently
                → select relevant lines
                  → return paths, line numbers, and excerpts
```

Implementation:
1. Locate the actual OpenCode checkout and confirm its version before selecting source files to edit.
2. Add an explicit dual-exposure option to core tool routing, with backward-compatible behavior for existing registrations.
3. Enable dual access for the file tools used by the coding workflow: `read`, `glob`, `grep`, and the model-appropriate edit/write/patch tools.
4. Use the same registered executors, validation, permission checks, and hooks for direct and scripted calls.
5. Preserve model-specific tool selection; do not expose a patch tool to models that would not normally receive it.
6. Keep shell, interactive tools, and subagents outside the first change to avoid mixing separate execution concerns.

Do not copy tool implementations or invoke their executors outside the normal pipeline.
If a core checkout is not available, ask where this core work should live.
A temporary plugin that moves tools is a fallback only if you explicitly accept losing direct access for those tools.

Check:
- The answer includes every expected match and usable source references.
- Both versions handle large results without silently losing evidence.
- Permission denial and external-directory checks still work.
- Tool hooks still run, and cancellation stops pending work.
- Direct-tool tasks still work; scripted access does not remove their declarations.
- A scripted edit requires the same approval and produces the same file change as a direct edit.
- Model-specific tools remain correctly filtered.

**Acceptance:** Both routes work with identical safety checks, usable evidence, and no regression in direct tool use.

## Change 2: make Jev easier for agents to use

**Why change this if Jev already works?** Availability is not enough.
You often have to remind the agent to use it.
Improve the agent-facing guidance and tool contract, not just the runtime.

```text
Fetch fixture items
  → call existing TypeSafe/Jev tool
    → select a shortlist
      → return the shortlist plus reasons
```

Implementation:
1. Keep the existing TypeSafe tool and credential handling.
2. Add a compact session-context instruction through the plugin: use Jev for semantic classification, ranking, extraction, verification, and yes/no judgments; use ordinary code for exact matching, parsing, and arithmetic.
3. Include one short, schema-correct example of calling the actual tool inside `execute` and processing its answers.
4. Make the tool description state these use cases clearly and pin its catalog listing if that improves visibility without excessive context cost.
5. Add a declared structured output contract so scripts can consume answers without parsing serialized tool text.
6. Preserve a readable result for direct or other supported consumers, and preserve existing model and usage metadata.

Start with a compact instruction and clear tool contract.
Do not force a classifier call on every task or hide a paid call inside an automatic hook.
If reminders are still needed, evaluate a task-aware reminder as a separate follow-up rather than adding one by assumption.

Use synthetic, non-sensitive data and recorded classifier responses for deterministic tests.
Request approval before tests that incur model usage costs.

The tracked TypeSafe plugin currently returns serialized text, not a declared structured output value.
Replace that avoidable parsing step with a validated structured result.
Do not rebuild Pi's model registry or add another credential store.

Acceptance checks:
- A script reads Choice, Score, and Noul answers from the structured result.
- Invalid requests, provider errors, and cancellation remain explicit.
- A representative semantic task selects Jev without a user reminder.
- A deterministic parsing or arithmetic task does not make an unnecessary classifier call.
- Guidance is visible after context compaction without repeated copies in a single request.

Agent tool choice is probabilistic.
Use a small behavior check to assess reminders; do not claim instructions guarantee compliance.

## Change 3: built-in `store()` and `load()`

**Why not just add the globals?** We should, but in OpenCode core.
The runtime library accepts host extensions, but the built-in `execute` integration does not expose a public plugin hook for adding globals.
Registering `state.get` and `state.set` tools would be a different interface, not the built-in globals you asked for.

Implementation:
1. Add synchronous `store(key, value)` and `load(key)` globals to the built-in script runtime.
2. Load a JSON snapshot from the current session history before each execution.
3. Keep writes local to that execution; `load()` sees its staged writes.
4. Commit writes to session history only after successful execution.
5. Discard writes on script failure or cancellation.
6. Define how the snapshot follows session resume and each supported branch/fork or history-revert operation.
7. Serialize commits or detect concurrent history changes so scripts do not silently overwrite each other's state.
8. Treat `store(key, undefined)` as deletion; return `undefined` for an absent key.
9. Define value-size and total-size limits, cleanup, and secret-handling rules before implementation.

```text
Simple plugin storage
  script A → save IDs now
  script B → load IDs later
  risk: saves can survive a failed script

Pi's stronger behavior
  script A → stage saved values
             ├── success → commit to session history
             └── failure → discard staged values
  later script → load values from its branch history
```

Follow Pi's success-only and history-aware behavior rather than using a plugin-wide key-value cache.
Tool side effects are not rolled back even when stored values are discarded.
Saved working values remain machine-local state, not tracked source.

Acceptance checks:
- Values survive successful calls and session resume.
- Failed and cancelled scripts do not commit writes.
- Read-after-write, deletion, and absent values behave as specified.
- Sessions and supported branches do not leak values to each other.
- Oversized values fail clearly; concurrent commits cannot silently lose writes.
- Session cleanup handles stored values, and compaction does not erase them accidentally.

## Deferred: tool search, limits, and runtime replacement

### Tool search

Build a small set of queries from the actual non-sensitive tool names and descriptions.
Include exact names, task descriptions, similar tools, namespace filters, and no-match queries.
Compare OpenCode's current weighted matching with Pi's BM25 ranking.
Measure correct-tool rank and failed selections.
Do not assume BM25 is better merely because Pi uses it.
Keep exact callable paths and permission filtering intact.

### Script limits

Check the OpenCode version actually used before drafting a patch.
The reviewed runtime accepts `timeoutMs`, `maxToolCalls`, and `maxOutputBytes`; the reviewed built-in integration does not supply them.
Test infinite loops, hanging tools, excessive calls, oversized output, and cancellation in an isolated harness.
If needed, propose a small change to expose these limits, not a runtime replacement.
Do not invent default limits without agreeing on expected workloads.

## Where changes would belong, if selected

```text
dotfiles tracked source
  existing typesafe-ai plugin → guidance, visibility, structured answers
  documentation             → examples, scope, validation, and apply instructions

OpenCode upstream/core
  tool routing              → dual direct/script access for coding tools
  Code Mode integration     → native store/load and success-only commit
  session history           → persistence and branch/revert behavior

live configuration
  unchanged until separate apply approval
```

Use temporary test locations and an isolated OpenCode process for validation.
Tracked plugin files may already be linked into live configuration; confirm link ownership before editing them.
Do not treat editing an active linked plugin as an isolated test.
Do not modify the unrelated local changes already present in this repository.

## Implementation order and remaining decisions

1. Confirm the target OpenCode checkout/version and whether this is local fork work or an upstream contribution.
2. Improve Jev guidance and structured answers in an isolated copy of the existing plugin.
3. Add dual coding-tool access in OpenCode core.
4. Add native store/load with session-history persistence in core.
5. Run targeted tests and a short end-to-end walkthrough; present the patch and results for review.
6. Apply only the approved live changes after separate permission.

Before core implementation, resolve:
- Which OpenCode checkout should receive the changes?
- Which session branch/revert operations must preserve or reset stored values?
- What per-value and total storage limits should apply?

Search-ranking changes, script-limit configuration, and QuickJS replacement remain outside this implementation scope.
Approval of this plan authorizes the selected implementation scope, not package installation, a service restart, or applying tracked source to live configuration.

## Evidence and review limits

Pi is pinned to v1.0.0.
OpenCode source is pinned to `d9d094a54378a8af4852a6c3594e0a8a91e2d498` on the V2 branch.
This plan is based on source inspection, not completed integration tests.
The installed OpenCode version and plugin compatibility must be checked before implementation.

- [Pi Codemode behavior](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/docs/codemode.md)
- [Pi execution and stored values](https://github.com/earendil-works/pi/blob/v1.0.0/packages/coding-agent/src/extensions/codemode/execute.ts)
- [OpenCode direct/Code Mode routing](https://github.com/anomalyco/opencode/blob/d9d094a54378a8af4852a6c3594e0a8a91e2d498/packages/core/src/tool.ts)
- [OpenCode runtime integration](https://github.com/anomalyco/opencode/blob/d9d094a54378a8af4852a6c3594e0a8a91e2d498/packages/core/src/codemode/tool.ts)
- [OpenCode search](https://github.com/anomalyco/opencode/blob/d9d094a54378a8af4852a6c3594e0a8a91e2d498/packages/codemode/src/tool-runtime.ts)
- [OpenCode runtime limits](https://github.com/anomalyco/opencode/blob/d9d094a54378a8af4852a6c3594e0a8a91e2d498/packages/codemode/README.md#execution-limits)
- [OpenCode plugin API](https://opencode.ai/v2/docs/build/plugins)
- [Existing TypeSafe tool](../../stow/opencode/.config/opencode/plugins/typesafe-ai/src/index.ts)
