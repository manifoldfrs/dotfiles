---
name: correct
description: Turn a mistake agents keep repeating into a check that stops it, using architecture first, then types or lint, then tests, with docs last.
disable-model-invocation: true
argument-hint: "the repeated mistake, or nothing to mine history"
---

# Correct

Change the repository so the next agent cannot repeat the mistake.
Assume the next agent sees only the files it opens, copies the nearest example, and takes the shortest path that compiles.
Apply the [fstack doctrine](../fstack/references/doctrine.md).

## 1. Find the mistake classes

Start from the mistake the user named.
With no argument, read recent commits, reverts, review comments, the agent instruction files, and any agent memory for this project.
Group the mistakes into classes, and count a class once it has happened twice.
Cite each occurrence.

**Complete when:** every class has at least two cited occurrences.

## 2. Fix each class at the highest level that works

1. **Architecture:** give each piece of state one owner and each task one supported way, and delete the old way an agent would copy.
2. **Types, lint, or CI:** make the bad state fail to compile, or add a lint rule, RuboCop cop, or CI check whose message names the right file or API.
   When the pattern is already common, fail only on new additions.
3. **Tests:** a behavior test that fails on the mistake.
4. **Prose:** a line in the agent instructions or a skill, only for a judgment call no check can make.

A mechanical violation, such as a banned API, an import shape, or a file location, always gets a deterministic check.

**Complete when:** each class has a fix at the highest level that works, with the reason each higher level does not.

## 3. Prove each check

Show the check failing on a real past instance and passing on the fixed code.
Run it the way CI runs it.

**Complete when:** every new check has pasted failing and passing output.

## 4. Keep the rule table

Keep a table in the project's agent instruction file that pairs each rule with what enforces it.
When a rule with no enforcer is broken again, fix it at a higher level in the same change.
Remove a rule once its mistake can no longer happen.

**Complete when:** every rule this run touched appears in the table with its enforcer.

**Reply:** each class with its evidence, the level chosen, why a higher level did not work, and the proof.

## Sources and adaptations

The enforcement ladder and rule table adapt pstack's `correct` skill and `encode-lessons-in-structure` principle by Lauren Tan (MIT).
The preference for a deterministic check over a written rule follows Matt Pocock's `retro` skill (MIT).
