---
name: council
description: Reviews a change, design, or plan with Opus, Sol, and Gemini Neon in parallel and repeats after fixes. Use when the user asks for council or council with a score target.
disable-model-invocation: true
---

# Council

From Codex, use `$pi-skill` to run the `council` skill in the dedicated Pi worker with the user's authorized scope.
The following steps are for the Pi worker.

Review one scoped change, design, or plan with three independent Pi subagents.
Only the parent decides what to change, and only within the user's authorization.

## Set the scope

Use the user's scope, or ask if the review target or intent is unclear.
If fixes are authorized, resolve known in-scope issues and failing checks before the first round.
For review only, disclose known issues in the brief instead.
Treat an argument such as `9.5` as a minimum score out of 10 for every member.

## Run a round

Use the `pi-subagents` skill and enable its tools if needed.
Run all three members unless the user explicitly changes the roster:

| Member | Model override |
| --- | --- |
| Opus 5.5 | `pi-claude-cli/claude-opus-5-5:high` |
| Sol 6.2 | `openai/gpt-6.2-sol:high` |
| Gemini 4 Neon | `antigravity/gemini-4-neon:high` |

Give all three the same brief: question, intent, scope, working directory, snapshot or plan, known issues, and observed check results.
For code, specify the base SHA and provide the diff inline or in a readable temporary artifact outside the repo; the `reviewer` agent cannot run `git diff`.
Tell each member to review only: no edits, commits, pushes, or PR updates.
Ask for an explicit approval verdict, plus evidence and the smallest suggested fix for each finding.
For code reviews or when the user supplies a target, also ask for a score out of 10.

Launch one async call per member in the same turn, substituting each exact model override:

```js
subagent({ agent: "reviewer", model: "antigravity/gemini-4-neon:high", cwd: "<repo>", async: true,
  task: "<brief>", options: { context: "fresh" } })
```

Use the run receipt to identify the model, not the reviewer's self-report.
Keep the reviewed files unchanged until all three complete, and yield for their completion notifications rather than polling.
Follow pi-subagents failure handling for a failed launch or an unusable reply; retry the same member once where appropriate and never silently substitute a model.
An explicit approval with no findings is a valid reply.

## Resolve findings

Check the evidence yourself and merge duplicate findings.
Treat each review as advice, not a vote that overrides a real defect or an authorization to expand scope.
If fixes are authorized, make justified in-scope changes, validate them, and start a fresh round with all three members on the updated version.
Carry forward the previous findings and what changed or was declined, with reasons.

Stop with approval only when all members approve the same version and meet the requested score threshold, if any.
If a member is unavailable, fixes are not authorized, or disagreement remains with no actionable next step, report the run as incomplete or unresolved rather than repeating an unchanged round.

## Report

Report the number of rounds, each member's verdict and any scores (use `no score` when none was given), what changed, and what remains unresolved or unverified.
Do not publish the report or edit a PR unless authorized.

Adapted from [Theo Browne's Council skill](https://github.com/t3dotgg/tstack/tree/main/skills/council) (MIT).
