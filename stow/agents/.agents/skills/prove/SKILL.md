---
name: prove
description: Verify a change on the real artifact before calling it done. Runs the feature, reads the stored value, and checks every case in the edge-case inventory. Use after building, fixing, or reshaping, before code review or a pull request, or when asked "are we sure it works".
---

# Prove

A green test suite is a proxy.
Prove the change on the thing the user touches, and report a verdict for every claim.
Apply the [fstack doctrine](../fstack/references/doctrine.md).

## 1. Pick the real artifact

Match the check to the change:

- **Web UI:** run the app locally with seeded data, drive the changed flow in a browser, and screenshot each changed screen.
- **HTTP API:** request the running app and show the status and body.
- **CLI:** run the real command with valid inputs that reach the changed code.
- **Data:** read back the stored value or row.
- **Job:** run the job and observe its effects.
- **Performance:** measure before and after under the same conditions, over repeated runs, and name what limits the number.
- **Port or reshape:** feed the same inputs to the old and new code and diff the outputs.

**Complete when:** each changed behavior has a check that exercises it end to end.

## 2. Walk the inventory

Check each edge in the ground brief's edge-case inventory, or build the inventory now when no brief exists.
Record how each edge was checked and what happened.

Enumerate every axis before claiming coverage, and name the axes not checked.
"All 44 routes match; components not compared" is a valid result, while "parity" without the list is not.
Before a staging rehearsal, list the production states staging lacks and seed them.

**Complete when:** every inventory item has a result or is named as unchecked.

## 3. Attack your own diff

Read the diff as a hostile reviewer would.
Look for the input that breaks it, the caller it missed, and what happens on a retry, a second tenant, a stale page, or a slow network.
Fix what you find before review.

**Complete when:** each problem found is fixed or listed as open in the verdict.

## 4. Verdict

Give each claim one verdict: VERIFIED, NOT VERIFIED, or INCONCLUSIVE.
Inconclusive is not a pass.
Paste the command and output behind each verified claim.
When a check passes too easily, suspect the check before the system.

**Complete when:** every claim and inventory item has a verdict with evidence, and nothing inconclusive is reported as done.

## Sources and adaptations

Verdicts and "check the real thing" adapt pstack's `prove-it-works` principle and `figure-it-out` skill by Lauren Tan (MIT).
"Attack your own diff" comes from 37signals' Fizzy `AGENTS.md`.
Enumerating every axis, seeding production-only states, and smoke-testing with valid inputs come from the user's own corrections.
