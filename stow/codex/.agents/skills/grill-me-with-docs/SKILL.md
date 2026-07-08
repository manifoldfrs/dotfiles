---
name: grill-me-with-docs
description: Project-aware grilling. Interview the user one question at a time to pressure-test a plan or design against the repo's existing docs, decisions, and code, then capture what crystallizes into CONTEXT.md and ADRs inline. Use when the user types /grill-me-with-docs or asks to "grill this against the codebase", "stress-test this plan in this project", or wants terminology and decisions aligned before implementing. Use grill-me instead for a greenfield topic with no repo.
---

# grill-me-with-docs

The project-aware sibling of grill-me. Same one-question-at-a-time discipline, but every question is grounded in what the project already says. Do not write feature code during the session.

## Before grilling

Read what exists: `CONTEXT.md` (or `CONTEXT-MAP.md` for multi-context layouts), `docs/adr/*`, the root `README`, and the relevant code. Index the terminology and prior decisions.

## Rules

- One question per turn, each with your recommended answer. Wait for the answer.
- If the codebase or a doc answers it, read it and confirm rather than ask.
- Ground each question in a source: "CONTEXT.md defines 'session' as a 30-minute window, but your plan uses it for the auth token. Which did you mean?"
- Flag conflicts immediately, between the plan and the glossary, or between the user's stated behavior and the actual code.
- Walk the tree depth-first, dependencies first.

## Capture as you go

### CONTEXT.md

- A term gets resolved, update `CONTEXT.md` now, not at the end.
- Domain terms only. No implementation details, specs, or scratch notes.
- Create `CONTEXT.md` on first resolved term if it is absent.
- If `CONTEXT-MAP.md` exists, use it to choose the right context file. Ask only when the context is ambiguous.
- Pick one canonical term and list rejected synonyms under `_Avoid_` when useful.
- Keep definitions to one or two sentences that define what the concept is.

Use this shape:

```md
**Order**:
A customer request that can be accepted, fulfilled, cancelled, or billed.
_Avoid_: Purchase, transaction
```

### ADRs

Offer an ADR only when all three are true:

1. The decision is hard to reverse.
2. The decision would be surprising without context.
3. The decision came from a real trade-off.

Skip ADRs for obvious choices, easy-to-change choices, and implementation details the code already explains.

ADRs live in `docs/adr/` and use sequential names like `0001-use-postgres-for-write-model.md`. A minimal ADR is enough:

```md
# <Short decision title>

One to three sentences: context, decision, and why.
```

## End condition

Stop when open branches are resolved and the plan's language matches the project's. Output the locked-in decisions and list the docs you touched.

Inspired by Matt Pocock's grill-with-docs (MIT).
