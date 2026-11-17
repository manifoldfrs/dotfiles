---
name: council
description: Get review or feedback from Opus, Sol, and Grok in parallel through Pi subagents, looping until they agree. Use when the user says council.
---

# Council

Three models from three providers review the same thing at once, and you act on what they find.
Different model families miss different things, so the council catches what one reviewer alone would not.

## Before the first round

Fix what you already know is wrong: outstanding PR comments, known issues, and failing checks.
Give the council the updated implementation, not a list of fixes you still plan to make.
If the user wants to throw the implementation away and explore new ideas, skip fixes to code being replaced.

## Members

Every round uses all three members, each at `high` thinking:

| Member | Model |
| --- | --- |
| Opus 5.5 | `pi-claude-cli/claude-opus-5-5:high` |
| GPT-6.1 Sol | `openai/gpt-6.1-sol:high` |
| Grok 4.7 | `xai/grok-4.7:high` |

Use other members only when the user names them.
If a member cannot run, report it instead of substituting another model.

## Run a round

Write one brief for all three: the question, the repo path, the base SHA and diff command for a code review, the intent, what is out of scope, and the check results.
Open it with `Review only. Do not edit, commit, push, or comment on PRs.`
For a code review, or when the user says `council N`, ask for a score out of 10 and findings with stable ids, severity, `file:line`, and a suggested fix.

Launch the three members as three separate async `subagent` calls in one turn, so each result wakes this session on its own:

```js
subagent({ agent: "reviewer", model: "xai/grok-4.7:high", async: true,
  task: "<brief>", options: { context: "fresh", machine: "local" } })
```

`reviewer` is read-only, and the explicit `model` replaces its default.
`machine: "local"` opens each member as a visible Pi in a background tab of the current Rex session, on the Mac or on agentbox.
It needs `REX_SESSION`; when that is unset, as over plain SSH, drop `machine` and the members run as headless background children.
Then end the turn; do not poll or sleep.
Trust the run's recorded model over a member's own claim about which model it is.

## While results arrive

Check each member's findings against the code as soon as its result arrives, and decide what to fix while the others still run.
Do not edit files while a member still reviews the same checkout.
If the user marks a member as non-blocking, do not wait for it; treat a late result as feedback and leave its score out.

A run that fails or returns no findings and no score counts as failed; retry that member once.
When the error is a sign-in, ask the user to run `/login <provider>` in Pi on that machine instead of retrying.
On agentbox the browser returns to the Mac's localhost, so the user finishes that sign-in from the Mac with `agentbox-auth`.

Once all three are in, summarize the useful findings, where the members disagree, and the next steps.

## Next rounds

Each full pass by all three members is one round.
After you fix what you agree with, start a fresh round whose brief carries the previous findings and what you fixed or declined with reasons.
For `council N` (for example `council 9.5`), continue until every member scores at least N/10.
Without a target, continue until all three members are satisfied.

Agree with a finding because it is right, never to end the loop.
Do not let repeated reviews result in scope creep.
It is your job to fight to keep scope limited.

## Results

If the work ends in a pull request, edit its description to add this section before the closing model and harness line; do not post it as a comment:

```markdown
## Council review

Rounds: 2

| Member | Round 1 | Round 2 |
| --- | --- | --- |
| Opus 5.5 | 7/10 | 9/10 |
| GPT-6.1 Sol | 8/10 | 10/10 |
| Grok 4.7 | 7/10 | 9/10 |
```

Write `no score` for a member that gave none; never invent one.
Report all three members' results in the final reply too, even when there is a PR.

## Sources and adaptations

Adapted from Theo Browne's `council` skill (tstack, MIT): Pi subagents in Rex tabs replace T3 Code's `delegate_task`, and the members are Opus, Sol, and Grok.
