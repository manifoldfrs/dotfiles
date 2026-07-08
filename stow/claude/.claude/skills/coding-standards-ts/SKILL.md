---
name: coding-standards-ts
description: TypeScript coding standards for correct-by-construction implementation. Use for TypeScript engineering, code review, TDD planning, or when another skill needs the user's TypeScript standards.
---

# TypeScript Coding Standards

Build correct-by-construction TypeScript. Apply a principle when the change introduces or alters the concern it governs. Apply it across contracts, behavior, data flow, state, effects, and verification. Do not add machinery for absent concerns.

## Principles

### 1. Repository before invention

- Inspect existing contracts, modules, adapters, tests, dependencies, and project conventions before introducing a library, pattern, module, seam, helper, or validation rule.
- Make the smallest coherent improvement.
- Speculative abstractions, migrations, rollouts, and compatibility layers require a concrete current constraint or explicit user intent.

### 2. Parse at the boundary

- Treat external, serialized, persisted, framework-shaped, and configuration values as `unknown` boundary input.
- A parser returns a refined value that flows inward. Checking a value and then continuing with the original raw value is not enough.
- Never trust decoded data with `as`.
- Keep protocol and persistence DTOs as explicit projections defined at the boundary.
- Treat every serialization, process, worker, queue, network, or storage hop as a new boundary. Cross it with serializable DTOs and parse again.
- At the composition root, parse environment and configuration once, then translate raw platform bindings into typed configuration and narrow application capabilities.

### 3. Make invalid states unrepresentable

- Put domain invariants on the domain type or module that owns them.
- Use precise operation inputs and required values. Push optionality outward.
- Prefer branded types, discriminated unions, readonly value objects, or small domain modules for distinctions that prevent realistic misuse.
- Prefer state machines or discriminated unions over contradictory booleans.
- Use exhaustive case analysis for closed variants. Avoid default branches that hide newly added cases.
- Preserve absence when it matters. Do not turn missing, null, undefined, or empty values into fake defaults just to simplify the next line.

### 4. Expected failures are values

- Model expected failures with typed result channels, discriminated unions, or custom error types with stable literal tags.
- Do not hide expected failures in thrown exceptions or rejected promises.
- Catch `unknown` only where it can be classified, recovered from, or translated.
- Detect cancellation before doing additional work.
- Keep original causes internally when useful, but expose only safe structured projections.

### 5. Design deep modules around real seams

- A module should hide meaningful invariants, policy, sequencing, translation, or side-effect ownership.
- Application service modules own cohesive use cases and sequence effects through narrow application-owned ports.
- Adapter modules own boundary translation and technology mechanics.
- Keep raw external framework, SDK, protocol, and persistence types at the composition root or inside adapters.
- Reject pass-through wrappers, mega-interfaces, and shallow modules that add indirection without leverage.

### 6. Every side effect has an owner

- Acquire each resource in the scope that owns its lifetime and release it on every exit.
- No floating promises. Every promise is awaited, returned, collected, or handed to explicit detached-work machinery.
- Detached work needs an owner for lifetime, cancellation, rejection handling, and observability.
- Modules do not perform I/O or acquire resources at import time.
- When fan-out is useful, bound it, propagate cancellation, await child work, and prevent it from outliving the owning scope.

### 7. Make mutation retry-safe

- Make retried commands idempotent.
- Guard concurrent transitions atomically.
- Do not hold database transactions open across network calls.
- Use a transactional outbox or equivalent when commit and delivery must agree.
- Persist coordination state only when progress must survive crashes or redelivery.

### 8. Observe without exposing

- Secrets never enter errors, logs, traces, metrics, snapshots, or diagnostic strings.
- Wrap sensitive values in redaction-safe types at ingress when practical.
- Record stable operation, dependency, state, retry, correlation, and error-tag fields. Do not serialize arbitrary payloads, thrown values, or environments.
- Preserve existing reporting hooks and keep telemetry out of domain decisions.

### 9. Verify behavior through real seams

- Assert caller-visible results, expected failures, persisted state, messages, responses, or adapter records.
- Replace dependencies through production seams. Avoid module patching and method spies for internal collaborators.
- Control time, randomness, IDs, cancellation, and external behavior through real seams.
- Match evidence depth to risk.
- Use property tests for general invariants when they pay for themselves.
- Verify database and runtime claims against the actual implementation when those semantics matter.

### 10. Preserve TypeScript's checks

- Keep strict compiler settings and precise readonly contracts.
- Avoid `any`, non-null assertions, unchecked casts, hidden mutation, and accidental thenables.
- Treat every unavoidable escape hatch as an unsafe block. Keep it local behind a precise interface and add `SAFETY:` with the runtime invariant that makes it sound.
- Document exported functions, classes, constants, types, and public methods when their contract, invariants, side effects, or expected failures are not obvious from the type.
- Use `@throws` only for defects or boundary-required exception contracts.
- Never weaken project-wide checks for a local change.

### 11. Keep functions cognitively simple

- Keep cognitive complexity under 15 when practical.
- Flatten nesting with guard clauses.
- Extract named helpers for decisions.
- Prefer lookup tables or maps when branches map values to values.
- For TypeScript, use ESLint cognitive-complexity rules when the project has them.

## Completion criterion

Treat every applicable principle as a proof obligation. Done means each principle is either inapplicable or supported by repository inspection, static checks, focused tests, or evidence from the actual runtime. For each blocked obligation, report the unsupported claim, blocker, risk, and remaining check.
