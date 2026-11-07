---
name: coding-standards-go
description: Go coding standards for correct-by-construction implementation. Use for Go engineering, code review, TDD planning, or when another skill needs the user's Go standards.
---

# Go Coding Standards

Build correct-by-construction Go. Apply these rules when the change introduces or alters the concern they govern. Use existing project conventions when they are compatible. Do not add machinery for concerns the task does not have.

## Principles

### 1. Repository before invention

- Search existing contracts, packages, helpers, adapters, tests, and dependencies before adding a library, pattern, interface, helper, constant, validation rule, workflow, or file.
- Reuse the existing abstraction when it fits.
- Make the smallest coherent improvement.
- Do not add migration, rollout, compatibility, or backfill machinery unless there is a current constraint or explicit user intent.

### 2. Name the actual abstraction

- Name functions, types, workflows, metrics, and files for what they do, not what the first caller needs.
- Do not name generic code after one use case.
- Docstrings and metric descriptions must match the real trigger condition.
- Names should survive the next caller.

### 3. Preserve absence

- Do not coerce nil, empty, or missing state into a fake concrete default.
- Preserve the absent state with nil, an empty string, a typed nil, a `Found bool`, or an explicit `Absent` value when the distinction matters.
- Branch explicitly in the consumer.
- Add a metric or log on meaningful absent branches so rollout state is visible.

### 4. Parse at the edge

- Treat external input, config, serialized data, proto payloads, persisted data, and third-party responses as boundary input.
- Check bad shapes before parsing. A check that continues with the original unrefined value is not enough.
- Keep protocol and persistence DTOs as explicit boundary projections.
- Verify external contracts against a real response when possible. Use `curl`, a small `go run`, or `protojson.Marshal` output. Do not ship a guessed contract.

### 5. Put invariants in one place

- Constants live in the narrowest package all callers can import.
- Validation belongs with the domain type, contract owner, or boundary parser that owns the invariant.
- Business logic belongs in the service or application layer, not in handlers.
- If another layer already enforces an invariant, do not duplicate it with a different rule.

### 6. Trust infrastructure

- Check database constraints, framework middleware, and platform guarantees before writing duplicate service-layer checks.
- If the database has `UNIQUE` or `ON CONFLICT DO NOTHING`, do not build a fetch-then-compare path that can race.
- Use typed conflict errors, `rowsAffected == 0`, or existing platform signals directly when they express the condition.

### 7. Own boundaries and files

- A new `.go` file needs a real boundary, a cohesive helper cluster, a public type worth discovering by file name, or a subsystem imported directly by other packages.
- A single private helper used by one or two functions should usually live in the file that owns the caller.
- Keep framework, persistence, protocol, and runtime types at the composition root or inside adapters.
- Avoid pass-through wrappers and mega-interfaces that hide no policy, invariant, sequencing, or translation.

### 8. Keep functions cognitively simple

- Keep cognitive complexity under 15.
- Prefer early returns so the happy path stays shallow.
- Extract a named helper for a decision, not for the caller.
- Prefer `switch` or a lookup table over long `else if` chains when the branches map values.
- For Go, run `gocognit -over 15 <package>` when a function is getting hard to read.

### 9. Own side effects and concurrency

- Pass `context.Context` through external calls and long-running work.
- Acquire resources in the scope that owns their lifetime and release them on every exit.
- Do not perform I/O or acquire resources at import time.
- Package-level mutable maps are unsafe across goroutines unless protected. Prefer a function, immutable map, or synchronization.
- Bound fan-out, propagate cancellation, and wait for child work when concurrent work belongs to the current operation.

### 10. Test public behavior first

- Test caller-visible behavior before private helpers.
- Cover every validation rule, guard, precondition, and error branch with inputs that trigger that branch.
- Assert results, persisted state, messages, responses, adapter records, or errors that callers can observe.
- Use production seams for replacement. Avoid tests that only prove private call order.
- Match evidence depth to risk. Use the real database, runtime, or migration path when the claim depends on it.

### 11. Mock carefully

- Use exact call counts with a known `Times(N)` when using gomock.
- Use broad matchers only for context, logger, or opaque dependencies.
- Use typed values for identifier-shaped parameters, seeded through builders or fixtures.
- Put expectations at the test site or in an opt-in helper the test calls explicitly.
- Do not use `Skip*Mock`, `Allow*Mock`, or opt-out flags on test-case structs.

### 12. Commerce work stack

Use these rules when working in the commerce Go stack or a similar payment path.

- For amount parsing, check `""`, `"."`, `".50"`, `"+"`, `"-1"`, `"abc"`, `"0"`, leading and trailing whitespace, and mixed case before writing the happy path.
- Reject zero-amount inputs in financial paths when zero is not valid.
- Use the approved EVM address equality helper instead of plain string equality when address casing can vary.
- Use `common.Address{}.Hex()` for the zero EVM address when that package is already in use.
- Put a `defer` that mutates step state after validation, so validation failures do not leave the step stuck.
- When handlers reject a proto field, add the matching field behavior annotation or proto comment so the proto carries the contract.
- Before implementing from a TDD, extract required metrics, log fields, monitor expressions, and runbook queries into a checklist.

## Completion criterion

For each applicable principle, cite the supporting source, test, validation output, or blocker. Do not present an unsupported claim as verified.
