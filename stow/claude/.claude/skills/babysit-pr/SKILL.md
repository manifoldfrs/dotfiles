---
name: babysit-pr
description: Watch a pull request through CI and review bots, fixing real findings until it is ready. Use when the user says babysit, watch, or monitor a PR, after opening a PR, or when another skill hands off a filed PR.
---

# Babysit PR

Most repositories run AI review bots.
They help, and they are not always right.
You own the PR from now until the `--until` condition passes; the user is not watching.

## Modes

- **Babysit** (default): fix real CI failures and real review findings, reply to the rest, and keep the branch current.
- **Watch**: when the user only asked to watch or be told, report each real event and change nothing: no fixes, replies, rebases, or pushes.

## Wait with `pr-wait`

Use one watcher per PR: `scripts/pr-wait` from this skill's directory, by absolute path.
Never write your own watcher, polling loop, or `sleep` loop; every watcher on a GitHub account shares one rate limit.

```bash
pr-wait <pr> [--repo owner/name] [--until ready|green|any-change]
```

It prints one line per real event.
It exits 0 when the `--until` condition is met or the PR merges, 1 when it needs you (a required check failed, conflicts, unresolved threads, PR closed), and 2 on bad input or when another `pr-wait` already watches the PR.

- `ready` (default): required checks green, Greptile or Macroscope reviewed the head, and no unresolved threads.
- `green`: required checks only; use it when the repository has no Greptile or Macroscope.
- `any-change`: exit on the first event.

In Claude Code, run it with the Monitor tool (`timeout_ms: 3600000`) so each line wakes you.
In Pi, Codex, or any harness without a monitor, run it as one long background command and wait for it to exit.

Start it again after you push, after you handle an exit 1, and after a resume.
It remembers what it already reported in `~/.local/state/pr-wait/`, so nothing that arrived in between is lost.
If it reports another pid already watching, keep that one; kill it only when its events do not reach you.

When an event needs no action, end the turn without a message.
Never post or say "still waiting".

## Handle reviews

Act only on checks and comments newer than the latest push.
Verify every bot finding against the source before changing code.
Fix real findings and CI failures, and tell repository failures apart from infrastructure flakes; rerun a flake once with `gh run rerun --failed`.
Prove each fix with the [`prove`](../prove/SKILL.md) rules before you push it.

Reply with a written reason when you dismiss a finding, then resolve the thread.
Use [`leaving-pr-comments`](../leaving-pr-comments/SKILL.md) for every comment posted on the user's behalf.
If the repository has `.macroscope/check-run-agents/*.md`, read those rules before replying to a Macroscope finding; its findings cite them.
CodeRabbit is advisory: handle its findings like any other, but never wait or hold a merge for it.

Keep the PR at the size the user's goal needs.
Review loops grow a PR one cheap-looking fix at a time.
Fix real bugs in the intended case; decline the rest with a written reason and list them as follow-ups: unneeded tests, guards for edge cases that do not matter, extra compatibility, and small performance costs.
Prefer the fix that deletes or narrows code.

## GitHub rate limits

`gh pr create`, `gh pr view`, and `gh pr checks` use GraphQL.
When GraphQL is used up (`gh api rate_limit --jq .resources.graphql`), the REST limit is separate and usually still has room:
read the PR with `gh api repos/<owner>/<repo>/pulls/<n>` and checks with `gh api repos/<owner>/<repo>/commits/<sha>/check-runs`.

## Base branch and finishing

`pr-wait` reports when new base commits touch this PR's files and when the PR becomes BEHIND or DIRTY.
In babysit mode, rebase onto the fetched base and push with `--force-with-lease` against the head you observed; the PR's own branch is yours to update.
If an overlapping PR makes this one obsolete, stop and ask before closing it.

Stop when `pr-wait` exits 0 and report that the PR is ready; this skill never merges.
When [`full-send`](../full-send/SKILL.md) or [`full-stop`](../full-stop/SKILL.md) called it, return to that skill, which checks its merge gate.
When the user asked you directly to merge, check full-send's merge gate yourself first, since `pr-wait` does not see a human review requesting changes without an open thread.

**Complete when:** `pr-wait` exited 0 on the current head, every finding is fixed or answered, and you reported the PR link, final head, and each finding's outcome.

## Sources and adaptations

Adapted from Theo Browne's tstack `babysit-pr` skill and its `pr-wait` script (MIT, see `LICENSE-tstack`), with the T3 Code watcher removed.
