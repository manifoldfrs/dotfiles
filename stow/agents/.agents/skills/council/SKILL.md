---
name: council
description: Ask a council of Opus 5.5, GPT-6.1 Sol, and Muse Wonder Full to review a diff, PR, or plan in parallel and gate on their verdicts. Use when the user asks to consult the council, or when code-review's council step calls it; not automatically after an edit or test run.
argument-hint: "what to review and the question, e.g. PR #31 merge safety"
---

The council is three read-only reviewers from three model families, each reviewing the same pinned scope with the same brief:

| Seat | Model | Effort |
| --- | --- | --- |
| Opus | Claude Opus 5.5 | xhigh |
| Sol | GPT-6.1 Sol | xhigh |
| Muse | Muse Wonder Full | xhigh |

Every seat reviews; no seat edits.
You are the chair: you pin the scope, write the brief, and synthesize the verdicts, but you hold no vote.

## 1. Pin the scope

Make a working directory with `mktemp -d "${TMPDIR:-/tmp}/council.XXXXXX"` and use its literal path as `$dir` in every later command, since shell variables do not persist between tool calls.
Capture exactly what the seats review into it:

- A PR: record its head with `gh pr view <n> --json headRefOid,body`, check that head out in a separate clean worktree, and capture `gh pr diff <n> > "$dir/diff.patch"`.
- A branch: record `git rev-parse HEAD`, check that commit out in a separate clean worktree, and capture `git diff <base>...<sha> > "$dir/diff.patch"` plus `git log <base>..<sha> --oneline`.
- A working tree: `git diff HEAD > "$dir/diff.patch"`, then append each relevant untracked file with `git diff --no-index -- /dev/null <file> >> "$dir/diff.patch"`, which exits 1 by design.
- A plan: copy it to `$dir/plan.md`; the seats review the copy.

For a PR or branch, the worktree is the repository root the seats read, so uncommitted local changes stay out of their context.
The step is done when `$dir` holds the reviewed **artifact**, a diff covering every changed and new file or a plan copy, and you can name the commit SHA it came from.

## 2. Write the brief

Write `$dir/brief.md`, the one prompt every seat receives:

- The question in the user's words, such as "is this safe to merge".
- The intent source: the user's request, the issue, or the PR description, quoted.
- The scope: the artifact path from step 1, the reviewed commit SHA, and the repository root, with the artifact authoritative over the checkout.
  Tell the seats to read only the brief, the artifact, and the repository, since other files in `$dir` are other seats' reviews, and to pass the repository root as the path for every search, since a seat may start in the main checkout.
- The **risks** you want checked, named concretely for this change: the external limit, failure mode, load, or invariant at stake, not a generic checklist.
- When `code-review` calls the council, its Standards and Intent briefs, pasted in full.
- The output contract: the reviewer format, findings P0 to P2 with `path:line` evidence, ending in exactly one `Merge verdict: BLOCK`, `OK`, or `OK with notes`.

Then tell the user in a few lines who sits on the council and which risks they are checking.

## 3. Convene the seats

Launch all three seats in one turn so they run in parallel.

### Claude Code

- **Opus**: an `Agent` call with `subagent_type: "reviewer"`, `model: "opus"`, `effort: "xhigh"`, and the prompt `Read <dir>/brief.md and follow it.`
- **Sol** and **Muse**: one background `Bash` call each, run with `run_in_background`, through Pi with read-only tools and the same reviewer prompt:

  ```bash
  cd <repository root> && pi -p --no-session --no-mcp --no-skills --tools read,grep,find,ls \
    --model openai/gpt-6.1-sol:xhigh \
    --append-system-prompt "$(sed '1,/^---$/d' ~/.claude/agents/reviewer.md)" \
    "Read $dir/brief.md and follow it." > "$dir/sol.md" 2>&1
  ```

  For Muse, use `--model meta/muse-wonder-full-1.0:xhigh` and write to `$dir/muse.md`.

### Pi

Run one async workflow with `runs.all` over the `reviewer` agent, one item per seat, each with `cwd` set to the repository root and a per-run `model`: `claude-bridge/claude-opus-5-5:xhigh`, `openai/gpt-6.1-sol:xhigh`, and `meta/muse-wonder-full-1.0:xhigh`.
Each task is `Read <dir>/brief.md and follow it.`
In Pi this skill is `/skill:council`; Pi's own `/council` is pi-subagents' advisor debate, a different workflow.

### Elsewhere

Run all three seats with the `pi -p` command above, using `claude-bridge/claude-opus-5-5:xhigh` for Opus.

## 4. Collect the verdicts

Wait for the completion notifications rather than polling.
The step is done when every seat has returned a `Merge verdict`, or has failed twice.
Retry a failed or truncated seat once.
A `pi -p` seat can exit 0 after a provider error, so judge each seat by its output, not its exit code.
A seat that fails twice is **absent**: name it and its error in the report, and treat the council as incomplete.
An absent seat never counts as OK.

## 5. Synthesize

Report under `## Council`:

- One line per seat: model, verdict, and finding count.
- Findings merged by defect, each tagged with the seats that raised it.
  Findings raised by two or three seats lead, since agreement across families is the council's strongest signal.
- For each finding, your disposition: accepted, or dismissed with the test, code, or cited fact that disproves it.
  A finding you cannot disprove stays accepted.
- The council verdict: **OK** only when every seat returned `OK` or `OK with notes` and no accepted P0 remains; otherwise **BLOCK**.

## 6. Act on the verdict

Act only within what the user asked for.
When the user asked you to act once the council is happy, such as "merge it once they're happy":

- On **OK**, recapture the step-1 artifact into a new file such as `$dir/recheck.patch`, confirm with `cmp` that it is byte-identical to the reviewed one, take that action, then report it.
  For a PR merge, also pass `--match-head-commit <sha>` to `gh pr merge`.
  If anything moved, reconvene on the new artifact; that round counts toward the three-round limit.
- On **BLOCK**, fix only what the accepted findings and the change itself need, rerun the checks, and reconvene the council from step 1 on the new diff.
  Add the previous round's accepted findings, and any dismissed findings with their disproof, to the brief so seats can confirm each fix.
- When BLOCK rests only on absent seats or dismissed findings and nothing changed, stop and hand off instead of reconvening.
- After three rounds without OK, stop and hand the remaining findings to the user.

Without such an instruction, stop after step 5.
Either way, once the council ends, remove any review worktree with `git worktree remove <path>`.
