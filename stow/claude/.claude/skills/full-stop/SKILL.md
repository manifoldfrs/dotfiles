---
name: full-stop
description: Do full-send's unattended work but stop with the PR ready for the user to merge. Use when the user says full stop, even as a closing "Full stop." that reads like emphasis, or asks for a PR ready to merge without merging it.
---

# Full Stop

Do the work of [`full-send`](../full-send/SKILL.md) and stop with the PR ready for the user to merge.
Read it and follow its steps, proof, review, babysitting, and rules for asking the user.
A full-stop request carries full-send's grant, including its testing permission, except the merge; the rules below take precedence.

## No merging

Commit, push, rebase, fix conflicts, and use `--force-with-lease` on this task's branch.
Never merge, enable auto-merge, enter a merge queue, push to the default branch, bypass branch protection, or delegate any of those.

Before work begins, disable existing auto-merge and remove the PR from any merge queue, check again before each push, and report it.
When you cannot prevent an automatic merge, report the blocker before going on.

## Stop at the gate

Use full-send's merge gate as the readiness check, and replace its merge and report steps with a handoff.
Proof and review cover the final diff; recheck behavior changes and meaningful conflict fixes before the handoff.

Fetch the target branch and check the live PR's head, base, checks, reviews, and mergeability; confirm it is open, not a draft, and not set to merge without the user.
If someone else merged it, report that instead.

- **Ready to merge:** the merge gate passes; leave the PR open and unmerged.
- **Waiting for required approval:** only human approval remains, and you confirmed that is the actual blocker.
- **Blocked:** say what prevents readiness, what you tried, and what is needed, asking as full-send describes.

**Complete when:** you reported the PR link, final head, verdict, proof, reviewer outcome, remaining risks, and that the PR is still open and unmerged.

## Sources and adaptations

Adapted from Theo Browne's tstack `full-stop` skill (MIT).
