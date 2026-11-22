---
name: debug-regression
description: Diagnose a regression, performance discrepancy, or environment mismatch when the cause needs investigation.
disable-model-invocation: true
---

# Debug a regression

Use this skill for an unclear cause that requires reproduction or comparison.

1. Reproduce the reported symptom through the entry point the user uses and record the observation.
2. If plausible causes remain, run a check whose result distinguishes the leading cause from the closest alternative.
3. Carry forward earlier constraints that still apply after any correction. Respect read-only scope.
4. For a fix, check the corrected behavior through the original entry point after the change. For a diagnosis, report the observations that establish the cause.
5. Lead with the decisive observation and its cause. Report any failed reproduction or verification, including the check that was blocked.
