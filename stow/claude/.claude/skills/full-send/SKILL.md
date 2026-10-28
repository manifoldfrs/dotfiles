---
name: full-send
description: Take a change all the way to a merged PR with nobody watching, proving, reviewing, filing, babysitting, and merging it. Use when the user says full send, or otherwise clearly asks you to finish and merge unattended.
---

# Full Send

The user is not watching this thread; your updates and final message go unread until long after you stop.
You own the work from its current state to a merged PR.
When the user did not clearly ask for unattended, end-to-end work and a merge, do the work without the merge grant and use [`full-stop`](../full-stop/SKILL.md) instead.

## The grant

A full-send request permits, for this task only:

- Committing, pushing, and opening the PR, even where other rules say to wait to be asked.
- Rebasing and pushing the PR's own branch with `--force-with-lease`.
- Every test method [Proof](#proof) needs, without asking first: running the app or a dev server, browser automation, computer use, simulators and devices, screenshots.
  Rules about *how* to test still apply; only the ask-first step goes away.
- Posting PR replies through [`leaving-pr-comments`](../leaving-pr-comments/SKILL.md).
- Merging once the [merge gate](#merge-gate) passes.

It covers nothing under [Asking the user](#asking-the-user), and it never bypasses a harness or system approval prompt.

## Steps

1. **Finish the change.** Route it through [`fstack`](../fstack/SKILL.md), which returns here when its route ends, and make the smallest change that meets the goal; fix the case that happened, not every case that could.
   On the default branch, create a branch first.
   One PR addresses one goal: when the request holds independent goals, take each through these steps as its own branch and PR, stacking a PR on the one it depends on.
2. **Prove it.** Get proof for every change in the diff.
3. **Review it.** Run [`sol-loop`](../sol-loop/SKILL.md); for a cross-module change or security, auth, data, or concurrency risk, run [`code-review`](../code-review/SKILL.md), which ends in the same loop.
4. **File the PR** with [`pr`](../pr/SKILL.md), after rebasing onto the latest default branch.
   Add one line to the description saying how you proved the change.
5. **Babysit it** with [`babysit-pr`](../babysit-pr/SKILL.md): fix real findings and CI failures, proving each fix before you push it.
6. **Merge** when the merge gate passes.
7. **Report** the PR link, the merge commit, your proof, and every decision you made for the user.

Stay active from step 1 to step 7.
If you end your turn while checks or bots are pending, the work stops, because nobody will prompt you again; wait with `babysit-pr`'s watcher so something wakes you.

## Proof

Proof is evidence you observed yourself in this session: command output, a reproduction, a screenshot.
Use the most direct proof the change allows, following [`prove`](../prove/SKILL.md):

- Reproduce the original failure, apply the fix, and watch the same reproduction pass.
- Run the checks the repository's CI runs: typecheck, lint, tests.
- Add one focused test that fails without the fix when the behavior has none and the repository has a test setup.
- For UI and runtime behavior, run the app and look at the change; green mocked tests do not prove the user experience works.

A change you cannot prove is a change you are not confident in: ask the user.

## Merge gate

All of these hold on the latest commit:

- Your proof covers every change in the diff.
- Required checks are green.
- Review bots finished, and every finding is fixed or dismissed with a written reason.
- No human review still requests changes.
- The branch is current with the default branch and GitHub reports it mergeable.

Right before merging, `git fetch` and recheck the live PR; when base commits that landed after the last green run touch this PR's files, rebase, push, and wait for green again.
Merge with the method the repository uses; read the allowed methods and recent merged PRs.
With a merge queue or auto-merge, stay until GitHub reports the PR merged.
Merge through branch protection as configured, never with `--admin` or another bypass.
An automated "needs human review" request may be ignored when your proof covers the change.

## Asking the user

A question in a normal message goes unseen and the thread looks done.
Ask with the harness's question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex), carrying the PR link, the blocker, and the options with your recommendation first.

Ask only when you cannot continue alone:

- You cannot prove the change.
- The merge gate cannot pass and you cannot fix that yourself.
- The next step is outside the grant: deleting data, touching production or live configuration, changing things outside the repository, closing a PR, or force-pushing another branch.
- The goal is ambiguous in a way that changes the result.
- Another PR makes this one obsolete.

Decide everything else yourself with sensible defaults and list those decisions in the report.
With no question tool, or no answer, take the safe path: leave the PR open and unmerged, and start your final message with the question.

## Sources and adaptations

Adapted from Theo Browne's tstack `full-send` skill (MIT), with `fstack`, `prove`, `sol-loop`, `code-review`, and `pr` as the stages.
