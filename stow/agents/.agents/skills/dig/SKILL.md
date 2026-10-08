---
name: dig
description: Deep work before code. Writes a ground brief of facts about how and why the affected code works, then judgment on framework recall, blast radius, and an edge-case inventory. Use before building or reshaping, for "how does X work", "why is it like this", or "what could this break", or when another skill needs a ground brief.
---

# Dig

Write one **ground brief** before code.
Facts come first and judgment second, in separate sections, so a wrong fact gets corrected before it becomes a design assumption.
Apply the [fstack doctrine](../fstack/references/doctrine.md).

Scale the dig to the risk.
A change inside one module needs one pass.
A change across subsystems fans out to read-only subagents, one per area, and the main session keeps their summaries rather than their raw reads.

## 1. Facts

Describe the code as it is and judge nothing in this section.

- **How:** trace each affected operation from its entry point (route, job, command, event) to its observable result, citing file and line.
- **Why:** read `git log --follow` and `git blame` on the touched lines, and `gh pr view` for the pull requests behind them; state the force that shaped the code, or say the history is silent.
- **Pattern:** name the existing code that already does something similar.

Read `CONTEXT.md` and ADRs when they exist, and use their terms.
Treat a document's claims about current state as leads to verify against code, and its reference data, such as mappings and inventories, as a checklist.

**Complete when:** every fact cites a file and line, a test, or a commit.

## 2. Judgment

- **Recall:** search the framework, the standard library, and the project's own helpers for the feature that already does this job.
  Name it with its API, or state why none fits.
  The language pack says where to look.
- **Radius:** enumerate every place the change reaches along each axis that applies: call sites, routes, views, jobs, serialized formats, other programs reading the same data, configuration, and native or mobile shells.
  Grep for the whole class, not only the example the user showed.
- **Safe because:** find the one fact the change is safe because of, and prove it by running code against the real app or library.
  Mark it unproven when running code cannot reach it.
- **Edges:** list the cases a senior developer would handle without being asked: empty, missing, duplicate, concurrent, retried, unauthorized, another tenant, each dependency failing, and the platform states that apply.
  This edge-case inventory is what `prove` checks.
- **Open:** list only the questions that no experiment or code read can answer, such as product calls and preferences.
  Answer every other question yourself.

**Complete when:** recall names an API or a reason, radius names the axes checked and the axes not checked, the safety fact is proven or marked unproven, and every open question is one only the user can answer.

## Output

```text
ground brief: <task>
facts
  how           ...
  why           ...
  pattern       ...
judgment
  recall        ...
  radius        ...   axes checked: ...   not checked: ...
  safe because  ...   proven by: <command and output> | unproven
  edges         ...
  open          ...
```

Show the brief in chat.
For a long run, also write it to an uncommitted local file outside any tracked docs folder.

## Sources and adaptations

The facts-before-judgment split follows HumanLayer's research agents, which document the codebase "as it exists today" without critique.
How, why, and the proven safety fact adapt pstack's `how`, `why`, and `blast-radius` skills by Lauren Tan (MIT).
Recall and edges answer the two failure modes in the Rails Foundation's Agents on Rails benchmarks: hand-rolling what the framework provides, and stopping at a green suite before the feature is complete.
