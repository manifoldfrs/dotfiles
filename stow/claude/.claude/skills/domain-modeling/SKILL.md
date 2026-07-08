---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants precise terminology, ubiquitous language, CONTEXT.md updates, or ADRs for hard-to-reverse design decisions.
---

# Domain Modeling

Use this skill when the work changes domain language or durable design decisions. Reading a glossary is normal repo hygiene. This skill is for changing the model, resolving terms, or recording decisions.

## File structure

Most repos have one context:

```txt
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

Multi-context repos use a root `CONTEXT-MAP.md`:

```txt
/
├── CONTEXT-MAP.md
├── docs/adr/
└── src/
    ├── ordering/CONTEXT.md
    └── billing/CONTEXT.md
```

Create files lazily. If no `CONTEXT.md` exists, create it only when the first term is resolved. If no `docs/adr/` exists, create it only when the first ADR is needed.

## Start of session

1. Search for `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, decision indexes, and equivalent domain-language docs.
2. If `CONTEXT-MAP.md` exists, use it to choose the right context. Ask only when the context is ambiguous.
3. Read relevant code when a term or relationship can be confirmed from implementation.
4. Keep implementation details out of `CONTEXT.md`.

## Challenge language

Call out problems immediately:

- A term conflicts with the glossary.
- The user uses one word for two different concepts.
- The user uses two words for the same concept.
- The plan conflicts with code behavior.
- A relationship between concepts is vague.

Use concrete scenarios to force precision.

Example:

```txt
CONTEXT.md defines "Customer" as the buyer organization, but this plan uses customer for an API user. Which concept do you mean?
```

## CONTEXT.md format

Use this shape:

```md
# <Context Name>

One or two sentences describing what this context is and why it exists.

## Language

**Order**:
One or two sentences defining the term.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request
```

Rules:

- Be opinionated. Pick the canonical term.
- Keep definitions to one or two sentences.
- Define what the concept is, not every behavior it has.
- Include project-specific domain terms only.
- Put implementation decisions in ADRs, not `CONTEXT.md`.
- Group terms under subheadings when clusters emerge.

For multiple contexts, `CONTEXT-MAP.md` should list contexts and relationships:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments

## Relationships

- **Ordering -> Billing**: Ordering emits `OrderPlaced`; Billing consumes it to generate invoices.
```

## ADR rules

Offer an ADR only when all three are true:

1. Hard to reverse.
2. Surprising without context.
3. The result of a real trade-off.

Skip ADRs for easy-to-change decisions, obvious choices, and implementation notes that the code already explains.

ADRs live in `docs/adr/` with sequential names:

```txt
0001-use-postgres-for-write-model.md
0002-communicate-with-domain-events.md
```

Minimal ADR shape:

```md
# <Short decision title>

One to three sentences: context, decision, and why.
```

Optional sections are allowed only when useful:

- Status,
- Considered Options,
- Consequences.

## During implementation or design

- Update `CONTEXT.md` as soon as a term is resolved.
- Draft an ADR as soon as a qualifying decision crystallizes.
- Cite the source of a term or decision when possible.
- If the code and docs disagree, stop and ask which source should change.

## Completion criterion

Done means the plan's language matches the project's language, every resolved durable term is captured, and every qualifying decision has either an ADR or an explicit reason no ADR was written.
