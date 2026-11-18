---
name: explain-diff
description: Build a throwaway HTML walkthrough of a diff so a human can understand it before reviewing it. Use when the user asks to walk through, explain, or visualize a branch, pull request, commit range, or working-tree change.
---

The walkthrough is for understanding, not judgement: it shows what changed, why, and where to look, so the human reviews faster.
Finding bugs belongs to code-review; publishing belongs to pr.

## 1. Read the whole diff

Default range: the merge base with the default branch to the working tree, untracked files included.
For a pull request, use `gh pr diff <number>`; for anything else, use the range the user names.
Read every hunk, then read enough surrounding code to know what each changed function does and who calls it.
**Done when** you can say, for every changed file, what it does differently now.

## 2. Group by intent

Group hunks by the reason they changed, not by file: one group per behavior added, moved, fixed, or removed.
Order groups so each one makes sense given the ones before it, usually types and data first, then logic, then callers, then tests.
Put mechanical churn (renames, formatting, generated files, lockfiles) in one final group, listed but collapsed.
Every changed file belongs to at least one group.

For each group, write:

- **Claim:** one sentence on what this change does, in the reader's terms.
- **Shape:** the smallest before-and-after picture that shows it: a call tree, file tree, state flow, or data shape, drawn as a diff in the style of the show-me skill.
- **Hunks:** the real hunks for the group, with file paths and line numbers.
- **Look here:** the one to three spots that deserve human attention: behavior changes, deleted or weakened tests, public API or schema changes, migrations, security-relevant code, and anything the claim does not explain.

## 3. Build the page

Write one self-contained HTML file with inline CSS and JavaScript and no network requests.
Lay it out as:

- A header with the range, the base and head commits, and the diffstat.
- A one-paragraph summary of the whole change.
- A table of contents with one row per group and its file count.
- One section per group: claim, shape, look-here list, then hunks collapsed by default.

Render hunks as unified diffs with added and removed lines colored and line numbers kept.
Support light and dark mode from the system setting, and keyboard navigation: `j` and `k` move between groups, `o` toggles the current group's hunks.
Save it as `explain-diff-<branch-or-range>.html` in the agent artifacts directory.

## 4. Check and open

Run `bash scripts/coverage.sh <file.html> [same git diff arguments]` from the repository root; with no arguments it checks the default range, and for a pull request pass `<base>...<head>` after fetching both.
Fix every missing file it reports, then open the page with `open <file.html>`.
**Done when** coverage passes and the page is open.
Report the path, the number of groups, and the look-here items in one short list.
