---
name: tech-spec
description: Write a design-only technical handoff with contracts, seams, call stacks, data flow, file map, tests, risks, and open questions. Use before implementation when the plan needs to be precise.
disable-model-invocation: true
---

# Tech Spec

A tech spec is a design-only implementation handoff. It should make contracts, data flow, seams, and tests clear enough that another engineer can implement without inventing missing architecture.

Do not implement while using this skill. Save a file only when the user asks for a file. Otherwise return the spec inline.

Use `../coding-standards-go/SKILL.md`, `../coding-standards-ts/SKILL.md`, `../tdd/SKILL.md`, and `../domain-modeling/SKILL.md` when relevant. Choose the standards file that matches the target language.

## Choose a path

### Path A: Convert known context to a spec

Use this when the conversation, docs, issue, code, or previous exploration already contains enough information.

### Path B: Grill first

Use this when the problem, users, constraints, affected code, acceptance criteria, or design direction are still unclear. Ask one question at a time and include your recommended answer. If a file answers the question, read it instead of asking.

Do not invent missing requirements to make the spec feel complete.

## Path A workflow

### 1. Load standards and local context

Read relevant standards, docs, ADRs, `CONTEXT.md`, code, tests, and existing patterns.

Completion check: the spec uses project vocabulary and does not introduce a library, pattern, schema style, adapter, or test strategy before checking precedent.

### 2. Extract the design problem

Capture:

- current state,
- problem,
- users or callers,
- goals,
- non-goals,
- constraints,
- invariants,
- affected systems,
- likely entrypoints,
- runtime and operational concerns,
- risks,
- open questions.

Every claimed requirement must trace to conversation, code, docs, or an explicit open question.

### 3. Compare alternatives

Produce materially different options before recommending one. Options should differ in interface shape, ownership, seam placement, call stack, persistence, runtime behavior, or module boundaries.

For each option, sketch:

- public contracts,
- input and output shapes,
- expected failures,
- seams and adapters,
- ownership boundaries,
- entrypoint-to-side-effect flow,
- parsing and projection strategy,
- observability, cancellation, idempotency, and authorization when relevant,
- test strategy,
- tradeoffs.

### 4. Specify recommended contracts

For the recommended design, outline every new, changed, or deleted:

- domain value,
- refined type or sentinel,
- state variant,
- input or output type,
- request or response shape,
- function signature,
- interface,
- expected error,
- adapter contract,
- protocol DTO,
- persistence DTO,
- public API.

Use Go-like pseudocode for Go work. Use the repository's language when the project is not Go.

### 5. Specify call stacks and data flow

Show each affected behavior from entrypoint to side effects and response.

Use this shape when helpful:

```txt
raw input
  -> boundary DTO or unknown value
  -> parser or validator
  -> canonical application input
  -> service or domain operation
  -> adapter call
  -> typed result or error
  -> projection
  -> serialized output
```

Include failure, retry, cancellation, transaction, idempotency, observability, and authorization flow when they apply.

### 6. Map files and modules

List files to add, change, or delete. For each file, state what it owns:

- contract,
- code path,
- boundary,
- adapter,
- domain concept,
- test responsibility,
- runtime configuration.

### 7. Write the RGR test plan

Use red-green-refactor vertical slices. Do not write a horizontal plan where all tests come before all code.

Each slice should include:

- behavior under test,
- public interface or seam,
- first failing assertion,
- minimal implementation target,
- refactor note if any.

Cover public behavior, important failures, parser rejection and acceptance, domain invariants, adapter contracts, runtime semantics, cancellation, retries, idempotency, and observability when relevant.

## Required outline

Use this shape unless the task is small enough to compress without losing contracts or call stacks:

```md
# <Title>

## Summary

## Context / Current State

## Goals

## Non-Goals

## Invariants

## Design Constraints

## Alternatives Considered

### Option 1: <name>

### Option 2: <name>

### Option 3: <name>

## Recommendation

## Proposed Design

## Domain Model and Types

## Types, Interfaces, and APIs

## Seams, Boundaries, Adapters, and Implementations

## Call Stacks and Data Flow

## Files to Add / Change / Delete

## RGR TDD Test Plan

## Risks and Open Questions
```

## Writing rules

- Types and call stacks define what changes.
- Prose explains why.
- Keep unknowns as open questions.
- Do not invent product requirements, domain rules, APIs, or call stacks.
- Avoid speculative abstraction. Every seam must earn its existence through a real boundary, invariant, ownership move, runtime concern, or test seam.

## Completion criterion

The spec is implementation-ready and every claim traces to conversation, docs, code, or an explicit open question.
