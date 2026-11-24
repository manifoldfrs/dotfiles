# Frontier-model customization audit

Research date: 2026-10-06.
Scope: tracked shared skills and Pi, Claude Code, and OpenCode customizations, including the current uncommitted Pi 1.0 migration.
This records the pre-cleanup snapshot; recommendations below are historical where the approved cleanup has since changed their targets.
The subsequent cleanup fixed Pi `edits[]` capture, removed the generic Pi SDK adapter and Zsh override, simplified command/workflow adapters, and protected personalized skill ownership.
Live deployment still requires separate approval.

## Verdict

Keep tool access, user preferences, domain knowledge, and enforced safety boundaries.
Simplify compulsory process and replace custom implementations when the installed harness now supplies the capability.
Keep subagents available, but do not make delegation the default for ordinary coding work.

The evidence does not justify “frontier models made subagents obsolete.”
It does justify questioning mandatory two-reviewer recipes, a background agent for every lookup, and repeated paid judgments for routine changes.
No comparative GPT-6.1 coding benchmark or personal usage telemetry was collected, so predicted speed and cost savings remain hypotheses.

## What the primary sources establish

| Source | Finding | Implication for this setup |
| --- | --- | --- |
| [Anthropic skill-authoring principles](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices#core-principles) | Assume the model is already smart; add missing knowledge and justify context cost; match specificity to task fragility. | Keep local constraints and specialized procedures; trim generic explanations and rigid recipes for open-ended work. |
| [Google agent-scaling research](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) | Its 180-configuration study found benefits on parallelizable tasks and degradation on sequential ones. | Delegate independent work, not arbitrary stages of one tightly coupled edit. |
| [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | Breadth-first research benefited from separate agents, with substantial token overhead and limitations for interdependent work. | Broad investigations can justify delegation; a trivial lookup usually cannot. |
| [Claude SDK subagents](https://docs.claude.com/en/docs/claude-code/sdk/subagents) | Documents separate contexts, parallelization, specialized instructions, and tool restrictions. | These are architectural capabilities, not just compensation for weaker reasoning. |
| [OpenAI Agents SDK hosted multi-agent documentation](https://github.com/openai/openai-agents-python/blob/main/docs/models/index.md#hosted-multi-agent-experimental) | Documents experimental server-hosted orchestration with a GPT-5.6 root and material API/approval limitations. | Multi-agent work remains a supported direction, but this is not a demonstrated GPT-6.1 replacement for Pi orchestration. |

The performance studies concern their own models, tasks, budgets, and architectures.
They are not measurements of this user's current coding workflow.
One OpenAI prompting search was blocked by Jev screening and excluded from the recommendations.

## Inventory and ownership

The repository tracks **49 shared skills**.
The [ownership manifest](../../stow/agents/.agents/skills/.skill-sources.tsv) lists 45: 25 Matt-owned, six dmmulroy-owned, and 14 local-owned.
`jev`, `lg`, `optojr`, and `typesafe-ai` have no manifest row.
There are 45 OpenCode command adapters; these mostly invoke skills rather than maintain separate implementations.

Pi has 11 tracked local extension entry points and a twelfth in the untracked `jev-guardrails` directory.
Its [settings](../../stow/pi/.pi/agent/settings.json) reference four packages: subagents, intercom, prompt-template-model, and Plannotator.
Claude config selects seven local mods and seven marketplace plugins.
OpenCode selects three enabled local plugins plus its disabled logger.
These are configuration facts, not proof that every feature is currently loaded or used.

Pi's installed `docs/skills.md` and Anthropic's skill guidance both describe metadata-first discovery.
The complete text of all 49 skills is therefore not automatically loaded into every conversation.
Broad triggers and cascaded references are more useful cleanup targets than the raw folder count.

## Retire custom implementations after a narrow migration

These are candidates for review, not an automatic deletion list.

| Customization | Recommendation | Boundary to preserve |
| --- | --- | --- |
| Retired Pi `extensions/zsh-user-bash.ts` | Remove if the documented Bash baseline is also the actual Pi shell setup. | Its original workaround concerned interactive Zsh behavior; confirm user `!` and `!!` commands work under the intended Bash before removing it. |
| Retired Pi `extensions/typesafe-ai/index.ts` | Migrate Pi consumers to native `models.classify` and extension `modelRegistry.classify`, then retire the generic SDK wrapper. | Existing prompts expect `typesafe_evaluate`; migrate those contracts first, and retain specialized Jev MCP operations where used. |
| [Pi updater implementation](../../stow/pi/.pi/agent/extensions/update.ts) | Prefer native `pi update`; keep only a thin `/update` convenience wrapper if wanted. | Preserve approval before installation changes; test the actual install method rather than assume every manager is supported. |
| [Pi `/lg` extension](../../stow/pi/.pi/agent/extensions/lg.ts) | Consolidate its prompt with the [shared `lg` skill](../../stow/agents/.agents/skills/lg/SKILL.md), or use a native prompt template. | The extension queues a follow-up when busy; retain it if that behavior matters rather than claiming full template equivalence. |

Installed Pi 1.0.4 documentation establishes native classifier access in `docs/models.md`, reusable Markdown commands in `docs/prompt-templates.md`, and self/package/model updating in `docs/cli.md`.
These recommendations concern **Pi**.
They do not establish that the Claude or OpenCode adapters have equivalent native replacements.
The MCP adapter has already been removed in the current Pi migration; retain that native-MCP direction.

## Simplify workflow rules

| Area | Keep | Change |
| --- | --- | --- |
| [Research](../../stow/agents/.agents/skills/research/SKILL.md) | Primary sources, citations, clear uncertainties, durable findings when appropriate. | Replace the unconditional background-agent requirement with direct execution for small lookups and bounded delegation for broad investigations. |
| [Code review](../../stow/agents/.agents/skills/code-review/SKILL.md) | Standards and Spec as separate review axes. | Two axes need not mean two agents for every diff; reserve separate fresh-context reviewers for consequential or broad changes and use the actual harness API. |
| [Grilling](../../stow/agents/.agents/skills/grilling/SKILL.md) | Look up environmental facts instead of making the user do it; wait for decisions. | Do not require a subagent for every environmental fact; direct reads often suffice. |
| [Architecture improvement](../../stow/agents/.agents/skills/improve-codebase-architecture/SKILL.md) | Evidence-led repository exploration and bounded improvement suggestions. | Remove compulsory Claude `Agent`/`Explore` syntax from shared instructions; choose the available harness mechanism only when delegation helps. |
| [Design-it-twice](../../stow/agents/.agents/skills/codebase-design/DESIGN-IT-TWICE.md) | Independent alternative designs when the decision merits them. | Treat three-plus agents as an explicit exploration mode, not an ordinary design prerequisite. |
| [Effect/umbrella standards](../../stow/agents/.agents/skills/coding-standards/SKILL.md) and [TS standards](../../stow/agents/.agents/skills/coding-standards-ts/SKILL.md) | User-specific invariants and genuinely Effect-specific knowledge. | Narrow the umbrella's trigger to Effect work and load relevant references selectively instead of activating two general TS standards stacks. |
| [Diagnosis](../../stow/agents/.agents/skills/diagnosing-bugs/SKILL.md) | Reproduction, evidence, hypotheses, and verified fixes. | Reserve elaborate diagnosis and fixed hypothesis counts for hard bugs; do not make every straightforward failure a full investigation. |
| [TDD](../../stow/agents/.agents/skills/tdd/SKILL.md) | Explicit test-first mode and public-behavior tests. | Agree on the seam and workflow once; avoid repeated approval rituals when the user already authorized that scope. |
| [Discoverable code](../../stow/agents/.agents/skills/write-discoverable-code/SKILL.md) | Searchable domain vocabulary and literal errors/events. | Replace universal export-comment and rigid naming/file rules with constraints justified by the repository; do not assume every harness lacks semantic navigation. |

The shared skills sometimes prescribe Claude's tools even when used from Pi.
That portability mismatch is a stronger reason to revise them than their age.
Keep `grill-me` and `grill-with-docs` aliases if used: they are short, user-only wrappers, not large automatically loaded instruction bodies.
The local [project-aware grilling skill](../../stow/agents/.agents/skills/grill-me-with-docs/SKILL.md) uses a different interviewing mode; choose the intended mode rather than casually merging away that preference.

## Jev: retain capability, consolidate policy, hold the new coding hook

The [shared global rules](../../stow/pi/.pi/agent/AGENTS.md), [Jev skill](../../stow/agents/.agents/skills/jev/SKILL.md), first-edit reminders, and automatic hooks all prescribe related judgments.
This establishes overlapping responsibility, not a measured doubled-call rate or a known dollar cost.

My recommendation is one policy owner and clear boundaries between automatic screening, deliberate semantic decisions, and final completion review.
Typed semantic judgments and specialized Jev operations remain useful capabilities.
Do not use a second model call as a replacement for deterministic tests, exact parsing, permission checks, or approval.
If the user wants a leaner baseline, relax always-on routine judgment requirements explicitly rather than silently bypassing the existing rules.

### Reproduced edit-capture defect

The new [Pi coding hook](../../stow/pi/.pi/agent/extensions/jev-guardrails/jev-coding.ts) extracts top-level `oldText` and `newText` from successful edit inputs.
The installed Pi edit schema uses `edits[]` containing those fields.
An in-memory hook harness reproduced the mismatch with a successful edit and settlement event:

```text
Pi1 edits[]: reminders=0, classifierCalls=0, auditSkipped=true
Legacy top-level fields, positive control: reminders=1, classifierCalls=1, auditSkipped=false
```

This is a confirmed capture defect, not a live end-to-end classifier test.
Do not rely on the new hook's edit coverage until fixed and tested with actual Pi inputs.
Even after repair, it samples 2,000 characters per before/after, excludes Bash edits, and is not a whole-diff audit.
Either repair it with explicit coverage limits or prefer one optional final-diff review over a second automatic partial-edit gate.
No code was changed by this audit.

### Screening needs calibration, not a stronger-model assumption

During this research, Jev MCP screening blocked an official OpenAI prompting search at injection probability 0.83 against a 0.75 block threshold.
The blocked content was not used.
This is one observed blocking event, not a demonstrated false-positive rate or a controlled evaluation of the new native Pi screening hook.

Keep screening available and preserve the user's no-warning-annotations preference.
Before expanding fail-closed deployment, test benign instruction-containing documentation, malicious retrieved instructions, classifier outages, and long results.
Neither model intelligence nor a generic confidence threshold proves a security boundary.
Claude and Pi currently have different warning/withholding and failure behaviors; make that difference deliberate rather than assume parity.

## Keep, or retain behind an explicit usage decision

| Customization | Recommendation |
| --- | --- |
| Pi subagents | Keep available, default to the parent agent, require authorization, and use bounded independent tasks with useful returned evidence. |
| Pi intercom | Keep if multiple live sessions are part of the workflow; coordination across sessions is not native model reasoning. |
| Herdr, OptoJr Slack, Sentry, Plannotator, browser MCPs | Keep the integrations actually used; a model cannot reason its way into missing application access. |
| Pi copy-all, header, Git widget, GPT verbosity | Keep according to UX preference; these customize observable harness/provider behavior. |
| Request loggers | Keep disabled by default if useful for debugging; complete provider payloads can retain private conversation/tool data. |
| Go/Rails/TS standards, anti-slop workflows, domain modeling, architecture scan, prototype, quiz, wizard, tech spec | Retain substantive local knowledge and intentional methods; trim repetition and keep heavyweight procedures opt-in. |
| Codex fast-variants | Conditional: the default moved to `openai`, but this only justifies disabling the legacy overlay if `openai-codex` is no longer used; newer native request options do not prove replacement fidelity. |
| Prompt-template-model package | Conditional: no tracked user templates using its advanced features were identified; inspect live templates before removing model switching, chains, or loops. |
| Niche training, diagram, teaching, ticketing, and setup workflows | Make user-only or park if unused; no usage evidence supports wholesale removal. |
| Claude cost/relaunch/toast mods and OpenCode TUI conveniences | Usage- and harness-dependent; do not delete them based solely on the Pi migration or model capabilities. |
| Shared destructive-command/generated-file guardrails and live configuration approval | Keep; permission boundaries and production safety remain relevant regardless of model quality. |

Before modifying synchronized skills, decide their ownership and how updates preserve the personalization.
The [sync script](../../scripts/update_agent_skills.sh) copies upstream catalogs; ad hoc edits or deletions can be overwritten or reintroduced.
Resolve the four ownership gaps rather than infer ownership from the directory names.

## Suggested lean baseline

- One primary agent for ordinary implementation.
- Native Pi MCP, Codemode, classifier access, prompts, and updater wherever they meet the needed contract.
- Concise global rules for scope, secrets, absence, testing, approval, and communication.
- Focused language/tool skills loaded on demand, with niche workflows explicitly invoked.
- Subagents for independent investigations, costly review, or context isolation—not a fixed number of agents per task.
- One clearly scoped judgment policy, with known coverage limits and no claims that a sampled edit audit validated the final diff.

Test proposed changes against the existing setup on representative small fixes, a larger feature, a broad research request, and a consequential review.
Compare quality, actual checks passed, wall time, provider usage, unnecessary continuations, and screening outcomes.
Remove a customization when the replacement preserves behavior or measured results justify the tradeoff—not because the newest model sounds more capable.

## Validation and limitations

Repository discovery and manifest counts were checked with `git ls-files` and shell counting.
The edit-capture reproduction and legacy-input positive control both passed their assertions without network calls or file writes.
All 22 repository-relative report links resolve, the report has no trailing whitespace, and `git diff --check` passed.
Jev checked 18 factual claims: all received a supported verdict, with two initially flagged for human review; recommendations remain advisory.
Jev's advisory classifications also marked several cleanup candidates uncertain; those remain conditional or migration-dependent above.

No configuration, plugin, skill, package installation, live home configuration, or running application was modified.
This report is the only parent-written repository artifact.
The read-only scout's detailed inventory is retained in its managed output artifact.
Existing uncommitted work was preserved.

Live skill links, actual package/mod activation, marketplace internals, shared shell-guardrail internals, usage frequency, and real classifier/browser connections were not verified.
The conclusions use inspected repository code and installed Pi 1.0.4 documentation, supplemented by screened Exa/Ref primary sources.
They are not a comprehensive benchmark of GPT-6.1 or a guarantee about future provider behavior.
