---
name: council
description: Reviews a change, design, or plan with Opus, Sol, and Gemini Neon in parallel and repeats after fixes. Use when the user asks for council or council with a score target.
disable-model-invocation: true
---

# Council

From Codex, run the Opus and Sol reviewers through `$pi-skill` in the dedicated Pi worker and run Neon directly with the signed-in Antigravity CLI.
The parent coordinates all three independent reviews of the same change, design, or plan.
From interactive Pi, launch Opus and Sol with `pi-subagents` and run the same standalone Antigravity command for Neon.
Only the parent decides what to change, and only within the user's authorization.

## Set the scope

Use the user's scope, or ask if the review target or intent is unclear.
If fixes are authorized, resolve known in-scope issues and failing checks before the first round.
For review only, disclose known issues in the brief instead.
Treat an argument such as `9.5` as a minimum score out of 10 for every member.

## Run a round

Run all three members unless the user explicitly changes the roster.
Use `pi-subagents` for the Pi reviewers and enable its tools if needed.

| Member | Route |
| --- | --- |
| Opus 5.5 | Pi `pi-claude-cli/claude-opus-5-5:high` |
| Sol 6.2 | Pi `openai/gpt-6.2-sol:high` |
| Gemini 4 Neon | Antigravity CLI `gemini-4-neon-high` |

Give all three the same brief: question, intent, scope, working directory, snapshot or plan, known issues, and observed check results.
For code, specify the base SHA and put the diff inline so all three reviewers can inspect the same snapshot.
The Pi `reviewer` cannot run `git diff`.
Tell each member to review only: no edits, commits, pushes, or PR updates.
Ask for an explicit approval verdict, plus evidence and the smallest suggested fix for each finding.
For code reviews or when the user supplies a target, also ask for a score out of 10.

Launch both Pi reviewers and the standalone Neon review in parallel.
When delegating from Codex, tell the Pi worker it owns the two Pi reviewers and supply the shared brief.
For each Pi reviewer, use its exact model override:

```js
subagent({ agent: "reviewer", model: "openai/gpt-6.2-sol:high", cwd: "<repo>", async: true,
  task: "<brief>", options: { context: "fresh" } })
```

For Neon, check the exact model in `agy models` and run this from a disposable directory with the same self-contained review brief.
Put the brief in `review_brief` and direct Neon to answer from that material without tools.

```bash
agy --model gemini-4-neon-high --effort high --mode plan --sandbox \
  --output-format json --print-timeout 420s -p="$review_brief"
```

Use Pi run receipts to identify Opus and Sol.
Record Neon's explicit CLI model selection and conversation ID.
Require JSON status `SUCCESS` and a nonempty response with a verdict and any requested score.
Keep the reviewed files unchanged until all three complete and wait for completion notifications.
Follow each route's failure handling and retry the same member once where appropriate.
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
