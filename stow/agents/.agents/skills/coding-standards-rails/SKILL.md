---
name: coding-standards-rails
description: Ruby on Rails coding standards inspired by DHH and 37signals. Use for Rails engineering, code review, TDD planning, or when another skill needs the user's Rails standards.
---

# Ruby on Rails Coding Standards

Build idiomatic Rails with rich domain models, small controllers, and database-backed invariants.
Apply each principle only when the change touches its concern.
These are locally maintained standards inspired by 37signals, not an official DHH skill.

## Principles

### 1. Repository before invention

- Inspect the Rails and Ruby versions, routes, models, schema, dependencies, tests, and lint configuration before choosing an API or pattern.
- Follow existing project conventions and make the smallest coherent improvement.
- Prefer Rails built-ins before adding dependencies or architectural layers.
- Keep useful existing libraries, including authentication, authorization, and testing libraries.
- Introduce abstractions for a concrete responsibility or current complexity, rather than speculative reuse or a fixed number of callers.

### 2. Rich domain models are the application API

- Let controllers and jobs call intention-revealing model methods directly, such as `card.close` or `recording.copy_to(destination)`.
- Plain Active Record CRUD in a controller is fine when there is no additional business behavior.
- Put business rules with the domain concept that owns them, using Active Record models or plain Ruby objects.
- Let models delegate involved work to cohesive objects, such as `Recording::Copier`, while keeping the caller's API small.
- Use service or form objects when they own real policy, coordination, or validation, rather than requiring an intermediary for every controller action.
- Keep Active Record as a first-class domain tool instead of wrapping it in pass-through repositories to imitate another language's architecture.

### 3. Model resources and capabilities

- Prefer CRUD endpoints on named resources when an operation has a natural resource representation.
- For example, creating a card's `closure` closes it, and destroying that resource reopens it.
- Preserve established external routes unless changing that contract is part of the task.
- Extract cohesive model capabilities into namespaced concerns, such as `Card::Closeable`, with their related associations, scopes, and behavior together.
- Put genuinely cross-model behavior in shared concerns, and keep incidental private helpers with their owner.
- Use a state record when actor, time, metadata, or lifecycle matters, such as a `Closure` with a creator and timestamp.
- Keep a boolean for a genuinely binary attribute or an enum for a closed set of states when no separate entity is needed.

### 4. Boundaries preserve meaning and enforce access

- Validate input shape and permit only intended attributes through strong parameters supported by the installed Rails version.
- Distinguish missing, blank, false, and zero when the contract does, rather than coercing them to a convenient default.
- Resolve records through the authorized tenant or user scope before reading or mutating them.
- Verify nested resources belong to their authorized parent, and derive ownership attributes from trusted context rather than submitted IDs.
- Strong parameters restrict assignment, not authorization.
- Use the application's existing permission mechanism, with explicit actor-aware domain predicates where appropriate.
- A rejected controller action must stop execution before mutations, since rendering or calling `head` alone does not return from the method.
- Pass required actor or tenant context into jobs and restore it using the project's scoped context mechanism, rather than assuming request-local `Current` values survive enqueueing.

### 5. The database protects persisted invariants

- Use model validations for useful feedback and database constraints for invariants that must survive concurrent writes or alternate write paths.
- Back uniqueness validation with a unique index matching its scope and intended null semantics.
- Use foreign keys, nullability, and check constraints where they express required persisted relationships or values.
- Guard concurrent state transitions with an atomic update, constraint, or appropriate lock rather than a read-then-write check.
- Group writes that must succeed together in a transaction, with network calls outside that transaction.
- When adding constraints or changing populated columns, inspect existing data and deployment compatibility before choosing migration and backfill steps.
- Check whether bulk operations bypass validations and callbacks before using them.

### 6. Make failures explicit in Rails terms

- Use `save` or `update` with a checked result and model errors for recoverable form validation failures.
- Use `save!`, `create!`, or a domain exception when failure must interrupt the operation or roll back a transaction.
- Rescue specific exceptions only where they can be recovered from or translated into a meaningful response.
- Let unexpected failures reach the application's reporting path instead of converting them into success, nil, or an empty collection.
- Keep secrets and arbitrary request payloads out of logs and errors, and maintain parameter filtering for newly introduced sensitive fields.

### 7. Jobs own delivery, models own behavior

- Keep Active Job classes shallow and delegate business behavior to domain models.
- Use `_later` for methods that enqueue work and `_now` for their synchronous counterpart when that pairing exists.
- Enqueue dependent work after commit using behavior verified for the installed Rails version and queue adapter.
- After-commit enqueueing prevents jobs from seeing uncommitted records, but does not by itself guarantee delivery after a crash.
- Use a transactional outbox or equivalent durable mechanism when losing a committed event is unacceptable.
- Make retried work idempotent and choose bounded retries for transient failures, with explicit handling for permanent failures.
- Use callbacks for cohesive lifecycle behavior, while keeping multi-step business workflows visible through named model methods.

### 8. Query deliberately and keep presentation simple

- Filter, sort, aggregate, and paginate in SQL when the database owns that work.
- Use `pluck` when only stored column values are needed, and eager-load associations when rendering would otherwise cause N+1 queries.
- Add indexes for actual access patterns, and verify expensive query claims with measurements or query plans.
- Add counter caches or precomputed values only with a clear update and invalidation strategy.
- Favor server-rendered views and existing Turbo/Stimulus patterns for Rails UI work, without rewriting an established frontend stack.
- Pass view dependencies explicitly through locals or helper arguments.
- Use Rails escaping and tag helpers, and keep untrusted content out of `raw` and `html_safe`.

### 9. Write readable Ruby

- Use domain nouns for objects, role names for associations, and positive predicates for boolean questions.
- Reserve custom `!` methods for a meaningful non-bang counterpart, rather than using the suffix to mean destructive.
- Order class methods before public instance methods, with `initialize` first among instance methods, then private helpers in call order when practical.
- Prefer early guard clauses to keep substantial happy paths shallow, and use explicit branches when selecting a return value is clearer.
- Follow the project's formatter for quotes, indentation, and visibility modifiers rather than imposing 37signals-specific whitespace.
- Prefer ordinary methods and explicit branches over metaprogramming for a small fixed set of cases.

### 10. Verify public behavior

- Follow the existing test stack, preferring Rails' Minitest and fixtures for new projects without an established choice.
- Test domain behavior through model APIs, HTTP behavior through request or integration tests, and critical browser interactions through focused system tests.
- Assert observable results, persisted state, responses, and delivered or enqueued work rather than private method call order.
- Cover changed validation and failure branches, unauthorized access, cross-tenant access where applicable, and retry behavior when work can be redelivered.
- Exercise real database constraints, transaction behavior, and job execution when the correctness claim depends on them.
- Control time and external services using existing test helpers or replacement boundaries.
- Run the smallest relevant tests and the project's configured Ruby lint checks, expanding validation when the change crosses boundaries.

## Completion criterion

Account for every applicable principle through repository inspection, focused tests, static checks, or runtime evidence.
Report changed behavior, validation performed, and any remaining unsupported claim or blocker.
In reviews, prioritize correctness and data safety, authorization, maintainability, performance, then style, with file and line references for findings.

## Sources and deliberate adaptations

- [Fizzy STYLE.md](https://github.com/basecamp/fizzy/blob/main/STYLE.md) is the first-party reference for controller/model interactions, resource modeling, method ordering, bang names, and job naming.
- [Vanilla Rails is plenty](https://dev.37signals.com/vanilla-rails-is-plenty/) by Jorge Manrubia explains rich domain models, concerns, and plain Ruby collaborators.
- [37signals Skills](https://github.com/marckohlbrugge/37signals-skills) is an unofficial secondary reference for the broader Rails checklist, not an authority over first-party guidance or repository constraints.

This adaptation keeps the user's early-return preference instead of adopting Fizzy's general preference for expanded conditionals.
It treats state records and infrastructure choices as contextual decisions, allows justified service and form objects, and retains established libraries rather than prescribing replacements.
The safety, concurrency, and verification requirements are local standards, not claims about DHH's personal rules.
