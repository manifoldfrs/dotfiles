---
name: prove
description: Perform a thorough runtime verification with an explicit edge-case inventory and evidence verdicts. Use when the user requests a proof or verification audit, or an explicitly selected fstack route calls for one; ordinary edits still need relevant checks without this full workflow.
---

# Prove

For a requested verification audit, check the thing the user touches and report a verdict for every claim.
For ordinary edits, run the relevant tests and runtime checks without creating this full inventory.
Reuse evidence already gathered for the same code and inputs.
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

## 3. Verdict

Give each claim one verdict: VERIFIED, NOT VERIFIED, or INCONCLUSIVE.
Inconclusive is not a pass.
Paste the command and output behind each verified claim.
When a check passes too easily, suspect the check before the system.

**Complete when:** every claim and inventory item has a verdict with evidence, and nothing inconclusive is reported as done.

## Sources and adaptations

Verdicts and "check the real thing" adapt pstack's `prove-it-works` principle and `figure-it-out` skill by Lauren Tan (MIT).
"Attack your own diff" comes from 37signals' Fizzy `AGENTS.md`.
Enumerating every axis, seeding production-only states, and smoke-testing with valid inputs come from the user's own corrections.
