---
name: fstack
description: Route a code task through investigate, fix, build, or reshape, with proof and review built in. Use for any non-trivial code task: explaining how code works, fixing a defect, building or changing behavior, or restructuring code.
argument-hint: "task in plain words"
---

# fstack

Pick the shortest route that controls the main risk, then follow the steps below.
Read the [shared engineering guidance](references/doctrine.md) once.
Language packs supply ecosystem-specific guidance; no language is the baseline for another.
Every route's investigation, subagents, proof, and review need no further approval; deployment, publication, and other outward actions still do.

## Pick the route

| The task | Route |
| --- | --- |
| A question about how or why code works | investigate |
| A defect, or a small change with an obvious result | fix |
| New or changed behavior | build |
| Same behavior, new structure | reshape |

State the route in one line before starting, so a misread costs one message.
When the user says "new task", pick the route again.

## investigate

1. Run `dig`, facts section only.
2. Answer the question from those facts and change no code.

**Reply:** the answer, with a file and line, test, or commit behind every claim.

## fix

1. Reproduce the defect on the surface where the user sees it.
   When the cause stays unclear after reproducing, run `diagnosing-bugs`.
2. Find every instance of the defect's class, not only the reported one, and list them.
3. Run `testing` on its bug branch.
4. Make the smallest fix inside the change that owns the feature.
   Write no plan and open no extra pull request.
5. Rerun the reproduction and the relevant tests; inspect the diff for unintended changes.
   Report the evidence and any unchecked cases without requiring a separate ground brief or full proof inventory.
6. Run `sol-loop` on the diff.

**Reply:** what broke, the root cause, every instance fixed, and the failing-then-passing output.

## build

1. Run `dig` and answer its open questions yourself with sensible defaults.
   Ask only the questions whose answer changes what gets built, and record the rest as decisions.
2. When the brief shows a contested shape, run `sketch`, pick the option, and record why.
3. Load the matching language pack and `testing`, then build in small slices.
   Each slice adds its own tests and ends with a passing check before the next one starts.
4. Run `prove` against the brief's edge-case inventory.
5. Inspect the diff for unintended changes, then run `code-review`, which ends in a `sol-loop`, for a cross-module or risky change, and `sol-loop` alone otherwise.

**Reply:** what was built, what the brief changed, what was proven, and what is still open.

## reshape

1. Run `dig`, then pin current behavior with a characterization test or an equivalence script before anything moves.
2. Subtract first: delete dead code and one-caller wrappers.
3. Move in small steps that keep the pin green.
   Migrate every caller and delete the old path in the same change.
4. Run `prove` for equivalence on the real artifact and inspect the diff, then run `code-review`.
5. Keep the reshape only when it lowers reader load somewhere; otherwise revert it.

**Reply:** the structure that changed, the pin, the equivalence proof, and where reader load went down.

## Every route

- Continue on reversible work and report it.
  Stop before deploys, data deletion, force pushes, external messages, and live configuration changes, except what `full-send` or `full-stop` grants.
  Run one outward action per command, so a "wait" can land between a tag and a deploy.
- When the user says "let's think on this" or similar, stop, restate the decision plainly, and wait.
- When the user asks for a pull request, run `pr`; when they say full send or full stop, hand the task to that skill.
  When `full-send` or `full-stop` started this route, finish it and return to that skill.
- When a mistake repeats, run `correct`.
- Keep a skipped step in the reply with a one-line reason.
- Give no time or effort estimates.

## Sources and adaptations

The routes adapt pstack's playbooks by Lauren Tan (MIT) and HumanLayer's rule to "use the shortest path that controls the main risk".
The split between user-invoked and model-invoked skills follows Matt Pocock's skills (MIT).
The standing rules come from the user's own corrections; see the doctrine.
