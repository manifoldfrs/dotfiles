---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, asks for outside-in tests, or wants integration-style behavior tests.
---

# Test-Driven Development

Use this skill to build or fix behavior test-first. The goal is not to write many tests up front. The goal is to learn through one thin behavior slice at a time.

## Core rule

Tests should verify public behavior through real seams. They should describe what the system does, not how internals cooperate.

Good tests:

- Call a public function, command, handler, API, CLI, or adapter seam.
- Assert caller-visible results, errors, persisted state, emitted messages, responses, or recorded adapter calls.
- Survive private refactors.
- Use names that read like behavior specifications.

Bad tests:

- Test private helpers before the public behavior.
- Mock internal collaborators owned by the same package.
- Assert incidental call order or broad call counts.
- Duplicate implementation structure in the test.

## Avoid horizontal slices

Do not write all tests first, then all implementation. That locks in imagined behavior before the first real design feedback.

Use vertical slices:

1. Pick one behavior.
2. Write one failing test for that behavior.
3. Write the smallest implementation that passes.
4. Refactor only while green.
5. Repeat.

## Workflow

### 1. Plan the public surface

Before writing code:

- Identify the public interface or seam to test.
- List the behaviors, not implementation steps.
- Pick the first behavior that proves the path end to end.
- Search existing tests for style, fixtures, builders, fakes, and validation patterns.
- If a `CONTEXT.md`, ADR, spec, or TDD exists, read it and use its vocabulary.

Ask the user only for choices that source files cannot answer.

### 2. Red

Write one test that fails for the right reason.

- The test should exercise one behavior.
- The test should use production seams.
- The test should construct the input that triggers the branch being tested.
- For bugs, the first test should reproduce the bug through user-visible behavior when practical.

### 3. Green

Write the smallest coherent implementation that passes.

- Do not anticipate later tests.
- Do not add optional paths, compatibility layers, or defensive handling the test does not need unless an existing contract requires it.
- Keep implementation changes scoped to the behavior under test.

### 4. Refactor

Refactor only when tests are green.

Look for:

- duplicated behavior or rules,
- long functions or nested branches,
- shallow pass-through wrappers,
- validation in the wrong layer,
- primitive values hiding domain concepts,
- test friction that points to a missing seam.

Run the relevant tests after each refactor step.

## Go and gomock guidance

- Prefer real implementations, local test servers, test databases, or recording fakes through production interfaces.
- When using gomock, set exact call counts with a known `Times(N)`.
- Use typed identifier values from builders or fixtures. Avoid `gomock.Any()` for IDs, amounts, addresses, or domain keys.
- Use `gomock.Any()` for `context.Context`, loggers, or opaque dependencies only.
- Put expectations in the test or an opt-in helper called by the test.
- Do not add `Skip*Mock`, `Allow*Mock`, or opt-out flags to test-case structs.

## Checklist per cycle

- The test describes behavior, not implementation.
- The test uses a public interface or real seam.
- The failure proves the behavior is missing or wrong.
- The implementation is minimal for the current behavior.
- No speculative feature was added.
- Relevant validation, guard, precondition, and error branches are covered.

## Completion criterion

Done means every important behavior, invariant, boundary, and expected failure has either a behavior test or an explicit reason it was not tested. Report the validation command that was run.
