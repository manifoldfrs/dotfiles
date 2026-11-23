---
name: council
description: Reviews a change, design, or plan with Opus, Sol, and Gemini Neon in parallel and repeats after fixes. Use when the user asks for council or council with a score target.
disable-model-invocation: true
---

# Council

From Codex, run all three reviewers through their own command-line tools.
The parent coordinates all three independent reviews of the same change, design, or plan.
Only the parent decides what to change, and only within the user's authorization.

## Set the scope

Use the user's scope, or ask if the review target or intent is unclear.
If fixes are authorized, resolve known in-scope issues and failing checks before the first round.
For review only, disclose known issues in the brief instead.
Treat an argument such as `9.5` as a minimum score out of 10 for every member.

## Run a round

Run all three members unless the user explicitly changes the roster.
Do not automatically substitute Fable for Opus or swap in another model or harness if a member fails or is unavailable.

| Member | Route |
| --- | --- |
| Opus 5.5 | Claude Code `claude-opus-5-5`, high effort |
| Sol 6.2 | Codex `gpt-6.2-sol`, high reasoning |
| Gemini 4 Neon | Antigravity CLI `gemini-4-neon-high` |

Give all three the same brief: question, intent, scope, working directory, snapshot or plan, known issues, and observed check results.
For code, specify the base SHA and put the diff inline so all three reviewers can inspect the same snapshot.
Tell each member to answer from the supplied material without calling tools, editing files, or publishing anything.
Ask for an explicit approval verdict, plus evidence and the smallest suggested fix for each finding.
For code reviews or when the user supplies a target, also ask for a score out of 10.

From Codex, launch these three commands in parallel as separate jobs, with a timeout for each.
Run them from the same disposable directory outside the repository and put the self-contained brief in `brief.txt` there.
Use the existing Claude Code, Codex, and Antigravity sign-ins.
Check the exact Neon model with `agy models` before launching it.

```bash
claude -p --model claude-opus-5-5 --effort high --output-format json \
  --tools '' --strict-mcp-config --setting-sources '' --disable-slash-commands \
  --no-session-persistence < brief.txt > opus.json
```

```bash
codex exec --model gpt-6.2-sol -c 'model_reasoning_effort="high"' \
  --ignore-user-config --sandbox read-only --skip-git-repo-check --ephemeral \
  --output-last-message sol.txt - < brief.txt
```

```bash
agy --model gemini-4-neon-high --effort high --mode plan --sandbox \
  --output-format json --print-timeout 420s -p="$(cat brief.txt)" > neon.json
```

Require successful exits, a verdict from each reviewer, and any requested scores.
For Claude, use `.result` and require `.is_error == false`.
For Codex, use `sol.txt` and check that the run selected `gpt-6.2-sol` with high reasoning.
For Neon, require `.status == "SUCCESS"`, use `.response`, and record `.conversation_id`.
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
