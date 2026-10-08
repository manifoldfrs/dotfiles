---
name: sketch
description: Two or three structurally different options for a contested design, as code sketches or a throwaway prototype, so the user can pick. Use when a ground brief shows more than one viable shape, when the user asks for options, a mockup, or a prototype, or before code that crosses a module boundary with no precedent in the codebase.
---

# Sketch

People choose quickly between two or three real options and slowly from prose.
Make the options real.
Apply the [fstack doctrine](../fstack/references/doctrine.md).

Sketch only when the shape is contested.
A shape that is clear from the ground brief or from an existing pattern skips this skill.

## 1. Pick the form

- **Code shape** (interface, data model, module boundary): signatures, types, schema, and a call tree, with bodies left unimplemented.
- **Behavior or state:** one throwaway script or single HTML file that pushes the state through the hard cases and prints the full state after each step.
- **UI:** several radically different variants on one route, switched by a URL parameter, using the project's real components and data.

**Complete when:** the form answers the question the brief left open.

## 2. Make the options structurally different

Build at least two whole-shape alternatives, not variations inside one shape.
Screen each one:

- Does it follow the language's grain and the framework's conventions?
- Would a change that looks right from one file be right for the whole codebase?
- How many layers sit between a question and its answer?

**Complete when:** every option passes the screen or shows which check it fails.

## 3. Compare and recommend

Compare in a short table: interface size, reader load, what each option makes easy, and what each makes hard.
Recommend one, with the reason.
The user picks.
While waiting for the pick, continue only work that does not depend on it.

## 4. Throw it away

Fold the chosen decision into the real code.
Delete the prototype, or keep it outside the main branch under a name that marks it as a prototype.
Record the decision and its reason in the reply or the pull request, not in a repository doc.

**Complete when:** the user has picked, the decision is in the real code, and no prototype code remains on the main branch.

## Sources and adaptations

The forms adapt Matt Pocock's `prototype` skill (MIT).
"Design it twice" and the structural screen adapt pstack's `exhaust-the-design-space` principle and `architect` skill by Lauren Tan (MIT).
The three-option comparison follows DHH: "You give me three options, I pick one of them."
