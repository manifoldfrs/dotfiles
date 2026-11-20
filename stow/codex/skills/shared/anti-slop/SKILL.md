---
name: anti-slop
description: Run the globally installed anti-slop command to check JavaScript or TypeScript, including optional Effect rules. Use after changing JavaScript or TypeScript, or when asked to check for anti-slop violations, explain its diagnostics, or fix them.
---

# Anti-slop

Use the existing global command.
The rules, configuration, and dependencies are shared across projects; do not copy them into the project or install project dependencies.

## Check

1. Read the project's instructions and `git status` to establish the requested scope and preserve existing work.
2. Check `command -v anti-slop`.
   If the command or its runtime is missing, report the blocker rather than installing anything automatically.
3. Inspect the relevant package manifest when choosing the mode.
   Use Effect mode when the target package directly depends on `effect` or the user explicitly requests Effect rules; a transitive lockfile entry is not enough.
4. Run from the target project with the requested files or directories:

   ```bash
   anti-slop <paths>
   anti-slop --effect <paths>
   ```

   Use `.` for a whole-project check only when that is the requested scope.
   Keep the command's exit status and distinguish violations from configuration or runtime failures.

## Fix

Fix violations in code you wrote or changed in this task; for violations in untouched code, report them unless the user asked for a cleanup.
Make the smallest repairs within scope, using `anti-slop --fix <paths>` or `anti-slop --effect --fix <paths>` for autofixable rules.
Preserve rule severity and existing unrelated changes; do not silence violations with unsafe casts or disable comments.
Run the project's formatter when applicable, then rerun anti-slop and the relevant project checks.

## Report

State the command, scope, selected mode, and result.
List remaining diagnostics by file and rule, and name any blocked checks.
A clean anti-slop run is not a substitute for the project's lint command, typecheck, or tests.
The shared command uses its own config rather than project-local or nested Oxlint configs.
