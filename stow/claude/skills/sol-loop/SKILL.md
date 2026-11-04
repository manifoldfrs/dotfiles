---
name: sol-loop
description: Review a change with GPT Sol in a loop, fixing findings until both agents agree. Use when the user says sol loop or review loop, before filing or updating a PR, or when full-send, fstack, or another workflow needs an independent review of a diff.
---

# Sol Loop

Make a change more correct before (or after) filing a pull request: GPT Sol reviews it, you answer every finding, and the loop repeats until Sol approves the current diff.
Sol is a different model family, so it catches what you miss.

Make the smallest changes that satisfy the reviewer.
Fight scope creep and push back with evidence.

## Size

Measure the change in **behavior lines** with `scripts/behavior-lines` from this skill's directory, by absolute path:

```bash
behavior-lines <base> [-- <paths>]
```

It counts added plus removed lines from base to the working tree, untracked files included, and skips lockfiles, snapshots, binaries, pure renames, and files marked `linguist-generated` or `-diff` in `.gitattributes`.
Every reviewer, model or human, misses more as the behavior diff grows.
Over about 300 behavior lines, first confirm the change addresses one goal, and split it into one PR per goal when it does not.
When it is one goal, run round 1 once per module or area, each with its own slice of the diff, then review the whole change together from round 2.

## Budget

- Three rounds by default. Round 1 reviews the whole change; later rounds check only changed code and open findings.
- Extend to five only for security, permissions, auth, data loss, or state and concurrency, while a blocker or should stays open with evidence, or when the user asks.
- Stop early when a round returns only nits. Declined nits and comment, doc, or format-only fixes need no new round.
- Keep a **ledger** in `$dir/ledger.md`: id, severity, outcome, and evidence.

## 1. Scope

Run `git status --short`.
Leave unrelated changes alone; limit the review to the change's paths when they separate cleanly, and when they do not, review the whole tree and say so.

Find the base after `git fetch origin`:

- PR: `gh pr view <n> --json baseRefName,headRefOid`, confirm `HEAD` is the PR head or ahead only by this change, and take `git merge-base HEAD origin/<baseRefName>`.
- Local: `git merge-base HEAD origin/<default-branch>`; with no remote, `HEAD` for uncommitted changes only.

The change is base to working tree in those paths, untracked files included; use one diff command every round.
Run the covering checks first and send no code the change itself breaks.

Make a working directory with `mktemp -d "${TMPDIR:-/tmp}/sol-loop.XXXXXX"` and use its literal path as `$dir`, since shell variables do not persist between tool calls.
Each round, capture the change into `$dir/diff-<round>.patch` with `git diff <base> -- <paths>`, then append each untracked file with `git diff --no-index -- /dev/null <file>`, which exits 1 by design.

**Complete when:** you can name the base SHA, the diff command, the behavior-line count, the intent in one or two sentences, what is out of scope, and the check results.

## 2. Run Sol

Write the round brief to `$dir/brief-<round>.md`:

```
Review only. Do not edit, commit, push, or comment on PRs.
Repo: <abs path> Base: <sha> Intent: <intent> Out of scope: <scope> Checks: <results>
Diff: <dir>/diff-<round>.patch (authoritative). Read only this brief, that diff, and the repo;
pass the repo root as the path for every search. Read surrounding code. Find bugs, broken callers, and mismatch with intent.
Skip style unless it hides a bug. Hold to the smallest change; flag code, tests,
or guards the intent does not need. Other paths, rare cases, small perf, extra compat: nits.
blocker = intended case wrong. should = real bug callers will hit, in intent. nit = the rest.
Reply:
VERDICT: APPROVE or CHANGES
S1 [blocker|should|nit] <file>:<line> <claim>. Fix: <suggestion>   (stable ids)
```

Run it through Codex as one background command, in Codex's read-only sandbox, at `xhigh` reasoning:

```bash
perl -e 'alarm 900; exec @ARGV' codex exec --ephemeral --ignore-user-config -s read-only \
  -m gpt-6.1-sol -c model_reasoning_effort='"xhigh"' -c project_doc_max_bytes=0 -C <repo> \
  -o "$dir/sol-<round>.md" \
  "$(sed '1,/^---$/d' ~/.claude/agents/reviewer.md)

Read $dir/brief-<round>.md and follow it." < /dev/null > "$dir/sol-<round>.log" 2>&1
```

`-o` writes only Sol's final reply; the log holds the run, including harmless `xcrun` cache warnings from the sandbox.
`--ignore-user-config` and `project_doc_max_bytes=0` keep your Codex settings, MCP servers, and `AGENTS.md` out of the reviewer.

Wait for the completion notification; do not edit scoped files while it runs.
`< /dev/null` matters: both CLIs read stdin when it is open, and a background shell can leave it open forever.
The `perl` alarm kills a hung run after 15 minutes, since macOS has no `timeout`.
Judge the round by its output, not the exit code: a reply without a `VERDICT` line is a failure, so retry once.
After a second failure, run the round on Grok through Pi and mark it as a Grok fallback in the ledger and the report:

```bash
cd <repo> && perl -e 'alarm 900; exec @ARGV' pi -p --no-session --no-mcp --no-skills --tools read,grep,find,ls \
  --model xai/grok-4.7:high \
  --append-system-prompt "$(sed '1,/^---$/d' ~/.claude/agents/reviewer.md)" \
  "Read $dir/brief-<round>.md and follow it." < /dev/null > "$dir/grok-<round>.md" 2>&1
```

## 3. Answer findings

Check every finding and its severity yourself; another path, a rare case, or a small cost is a nit whatever its label.

- **Agree:** make the smallest fix, preferring to delete or narrow over adding a lock, cache, helper, or option, and add one focused test that fails without the fix when the intent needs it.
- **Disagree:** say why, with `file:line`, a test, or output.
- **Out of scope or nit:** decline in one line and list it as a follow-up.

Update the ledger, rerun the checks, and rerun `behavior-lines`; when review grew the diff, cut first.
Agree because the finding is right, never to end the loop.

## 4. Next round

Start one only when budget remains and a blocker or should is open, behavior code changed, or the last approval does not cover the current behavior diff.
Each round is a fresh, ephemeral run with no memory, so its brief carries the round 1 brief, the ledger (`fixed:`, `disagree:`, `declined:` with evidence), the new full diff, and the change since last round as `diff -u` of the previous and new patch files; tell Sol to check open ids and changed code only, marking each old id `resolved` or `still open: <reason>`.

## 5. Stop

- **Agreed:** APPROVE on the current behavior diff, no blocker or should open, and no concern of your own.
- **Stuck:** a finding stays disputed after two replies, or the budget ends; budget end is not approval.
  Inside an autonomous workflow, take the side your evidence supports, record both sides in two or three lines each, and keep going; otherwise put the dispute to the user.

When the work ends in a pushed PR, add `Reviewed with sol-loop: <N> rounds with GPT-6.1 Sol. Verdict: <approved|stuck>.` to the description, naming any Grok fallback round.

**Complete when:** the loop stopped as agreed or stuck, and you reported the rounds, the model for each, what the reviewer changed, behavior lines before and after, fixed and declined findings with reasons, and whether anything was pushed.

## Sources and adaptations

Adapted from Theo Browne's tstack `sol-loop` skill (MIT), with Codex running Sol and Pi running the Grok fallback.
The size cutoff follows reviews degrading with diff size: Bjørn Johansen's five-model review test and SWE-PRBench (2026).
