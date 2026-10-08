---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Intent (does the code do what the user asked, including the edge cases?) — then get a second review from a different model family. Reports each separately. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Two-axis review of the requested committed or working-tree changes:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Intent** — does the code do what the user asked, including the edge cases a senior developer would handle?

Review both axes directly for small changes.
For broad or consequential changes, use separate read-only reviewers with fresh contexts when delegation is authorized.
Keep the axes separate in either mode.
Then run the second-model review in step 6.
Within fstack, apply the [fstack doctrine](../fstack/references/doctrine.md).

Use an existing issue-tracker guide when fetching issues; do not require tracker setup for a local review.

## Process

### 1. Pin the fixed point

For committed changes since a supplied ref, validate it with `git rev-parse` and capture `git diff <fixed-point>...HEAD` plus `git log <fixed-point>..HEAD --oneline`.
For working-tree changes, use `git diff` and `git diff --cached`, and inspect relevant untracked files separately.
If the requested scope is ambiguous, ask before reviewing.
Confirm the selected scope contains changes before proceeding; a ref-to-HEAD diff alone does not include uncommitted work.

### 2. Identify the intent source

Look for what the user asked for, in this order:

1. The user's own words in the conversation that requested the change.
2. The `dig` ground brief, including its edge-case inventory.
3. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) and the pull request description.
4. A spec file under `specs/` or `.scratch/` matching the branch name or feature.
5. If nothing is found, ask the user what the change was meant to do.

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md`, `STYLE.md`, or `CONTRIBUTING.md`, plus the language pack for each language in the diff.

Rank Standards findings in the user's order: the right abstraction first (shared logic in one place), then performance (sequential work that could run in parallel, repeated queries or fetches, wasted work on every request or navigation), then duplication across files and surfaces.
Correctness, tests, and security follow, unless something is broken, which always comes first.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the change doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Review both axes

Perform each brief below directly, or hand it to a separate read-only reviewer when delegation is warranted and authorized.
For delegated work, discover available agents and follow the current harness's orchestration and isolation rules rather than assuming Claude's tool names.
Give both reviewers the same pinned scope and return findings with file and requirement citations.

**Standards brief** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Intent brief** — include:

- The diff command and commit list.
- The intent source from step 2, quoted or fetched.
- The brief: "Report: (a) what the user asked for that is missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) behaviour that looks implemented but wrong; (d) edge cases from the inventory, or that a senior developer would handle unasked, with no handling or check. Quote the intent line for each finding. Under 400 words."

### 5. Aggregate

Present the two reports under `## Standards` and `## Intent` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

### 6. Second-model review

Ask a reviewer from a different model family than the one that wrote the code to review the same scope with both briefs.

- In Pi, run the `reviewer` subagent; its model is pinned per parent provider in the Pi settings.
- Elsewhere, write the diff to a temporary file and use the other family's command line:
  for a change a GPT model wrote, `claude -p --permission-mode plan "<both briefs and the diff file path>"`;
  for a change a Claude model wrote, `codex exec -s read-only -C <repo> -o <file> "<both briefs and the diff file path>"`, then read the file.

Present its findings under `## Second model`, and mark each one that matches a finding from step 5.
Agreement between the two families is high signal.
Dismiss a behavior finding only with a test that shows the case works.
Dismiss a standards finding only by citing the standard or fact that disproves it.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Intent fail.**
- Code that does exactly what the user asked but breaks the project's conventions → **Intent pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
