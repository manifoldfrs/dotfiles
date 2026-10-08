---
name: testing
description: How to test a change. Bugs get a failing test first; features get their design first, then behavior tests at the layer where the behavior lives. Use when writing, changing, or reviewing tests, fixing a bug with a cheap test path, or when another skill needs test guidance.
---

# Testing

Tests prove behavior through public interfaces.
The design drives the tests; the tests do not drive the design.

Apply the [fstack doctrine](../fstack/references/doctrine.md).
Use the terms in `CONTEXT.md` when it exists, and load the language pack for the project's test layers and tools.

## Bug branch

1. When a cheap test path exists, write the regression test first, at the seam where the bug actually occurs.
2. Run it and watch it fail for the reason the user reported, not a nearby one.
3. Fix the bug, watch the test pass, and keep the test.
4. When no cheap path exists, because the test would need a broad harness, production-only state, or brittle mocks, use the closest executable check instead: a script, a request, or a browser run.
   State why there is no test.
   Prefer no new test over a bad test.

**Complete when:** the failing-before and passing-after runs are pasted, or the reason for no test is stated with the check used instead.

## Feature branch

1. Settle the design first, through `dig` and, when contested, `sketch`.
2. Write tests at the layer where the behavior lives, one slice at a time alongside the code.
   The language pack names the layers; for Rails, read the [testing reference](../coding-standards-rails/references/testing.md).
3. Assert what a user or caller observes, against a known literal.
4. Cover each changed failure branch and each edge in the ground brief that a test can reach.

**Complete when:** every changed behavior and failure branch has a test through its public interface, and the relevant tests pass.

## What a good test is

A good test reads like a specification of a capability, and it survives a refactor because it does not care about internal structure.
See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for where mocks belong.

- **Implementation-coupled** tests mock internal collaborators, test private methods, or verify through a side channel; they break on a refactor that keeps behavior.
- **Tautological** tests recompute the expected value the way the code does, so they pass by construction; take expected values from a literal, a worked example, or the spec.
- **Hollow** tests would still pass if every function they call returned nothing; rewrite the assertion or delete the test.
- **Horizontal** slicing writes all tests before any code; work in vertical slices instead, one test and one implementation at a time.

## Guardrails

- Change a test only when the expected behavior changed; never to fit a wrong implementation.
- Dismiss a review finding about behavior only with a test that shows the case works.
- Run the smallest relevant test file often and the full suite once at the end.
- Report a test that skipped itself, for example for missing seed data, as not run.

## Sources and adaptations

The bug branch adapts pstack's `tdd` skill by Lauren Tan (MIT).
The anti-patterns and the examples in `tests.md` and `mocking.md` come from Matt Pocock's `tdd` skill (MIT).
The feature branch follows DHH: "you do not let your tests drive your design, you let your design drive your tests."
