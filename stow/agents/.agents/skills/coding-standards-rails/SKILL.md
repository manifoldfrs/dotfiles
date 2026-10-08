---
name: coding-standards-rails
description: Ruby on Rails coding standards inspired by DHH and 37signals. Use for Rails engineering, code review, TDD planning, or when another skill needs the user's Rails standards.
---

# Ruby on Rails Coding Standards

Build idiomatic Rails with rich domain models, small controllers, and database-backed invariants.
These are locally maintained standards inspired by 37signals, not an official DHH skill.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, data safety, authorization, and debuggability.
2. Apply these standards to new code and the complete behavior being changed.
3. Follow compatible repository conventions, versions, and libraries.
4. Contain incompatible older patterns at the nearest existing edge instead of spreading them.
5. Keep unrelated behavior unchanged unless a broader migration was requested.
6. Record meaningful tradeoffs beside the owning code or in the project's decision records.

## Core principles

- Rich domain models are the application API; controllers and jobs call intention-revealing model methods.
- Model operations as resources, and capabilities as namespaced concerns.
- Resolve every record through an authorized scope; strong parameters restrict assignment, not access.
- The database enforces invariants that concurrency or alternate writers could break.
- Recoverable failures are checked results; unexpected failures reach the reporter.
- Jobs own delivery and retries; models own behavior; retried work is idempotent.
- Prefer Rails built-ins, and add an abstraction only when deleting it would spread real complexity into callers.
- Test behavior through public interfaces, exercising real constraints and jobs where the claim depends on them.

## 1. Establish the local rules

Read the nearest `AGENTS.md`, the Ruby and Rails versions, `Gemfile`, routes, schema, the changed area's models and tests, and the active lint configuration.
Apply the decision priority when local conventions conflict with these standards.
Keep useful existing libraries, including authentication, authorization, and testing libraries.
Make the smallest coherent improvement rather than a broad rewrite.

**Complete when:** the governing versions, libraries, and conventions touching the changed behavior are identified.

## 2. Trace the behavior and load the applicable references

Trace each changed operation from its entry point, such as a route, job, or console task, through authorization, model calls, persistence, and side effects to its observable result.
Read every applicable reference completely before designing the change:

- [Models and concerns](references/models-and-concerns.md) — when domain behavior, model APIs, concerns, state, or plain Ruby collaborators change.
- [Controllers, routes, and parameters](references/controllers-and-routes.md) — when routes, controllers, parameters, or HTTP responses change.
- [Authorization and tenancy](references/authorization-and-tenancy.md) — when record lookup, access rules, tenants, nested resources, or actor context change.
- [Persistence and migrations](references/persistence-and-migrations.md) — when behavior writes the database, or a migration, constraint, index, or backfill changes.
- [Errors and observability](references/errors-and-observability.md) — when behavior can fail, rescues, reports, logs, or handles sensitive data.
- [Jobs and idempotency](references/jobs-and-idempotency.md) — when work runs in a job, retries, runs after commit, or may execute twice.
- [Queries and performance](references/queries-and-performance.md) — when queries, scopes, eager loading, indexes, counters, or caches change.
- [Views and Hotwire](references/views-and-hotwire.md) — when views, partials, helpers, Turbo, or Stimulus change.
- [Ruby style](references/ruby-style.md) — when naming, method order, control flow, or metaprogramming change.
- [Testing](references/testing.md) — whenever behavior, tests, fixtures, or test helpers change.
- [Lint and policy](references/lint-and-policy.md) — when RuboCop configuration, custom cops, or security and static-analysis tooling change, or when claiming a rule is enforced.

**Complete when:** every changed entry point, model call, write, failure, side effect, and test surface maps to an owner and an applicable reference.

## 3. Design from the public interface inward

Define the model methods, routes, and job interfaces callers will use before implementing them.
Check existing models, concerns, scopes, and helpers before adding one, and apply the deletion test from the models reference to each new abstraction.

Before writing new code, find the Rails feature that already does the job.
Search the guides and API for the installed Rails version, then see how the Rails reference apps Fizzy, Campfire, and Writebook solve the same problem.
Use the framework feature, or record why none fits.

**Complete when:** each changed behavior has one owning model, route, or job interface, each new abstraction has a recorded reason it is needed, and each piece of new code names the Rails feature it uses or why none fits.

## 4. Implement the complete changed behavior

Implement every path the operation needs, including authorization failures, validation failures, and side effects.
Keep unrelated behavior unchanged, and preserve existing reporting and instrumentation hooks.

**Complete when:** every traced path is implemented through its owning interface and conforms to its applicable references.

## 5. Verify through public interfaces

Add or update tests as the testing reference requires, then run the smallest relevant tests and the project's configured lint and security checks.
Re-read each applicable reference and check the changed code against its completion criterion.

**Complete when:** the relevant checks pass or each failure is reported with evidence, and every applicable reference's completion criterion is met.
Report changed behavior, validation performed, and any remaining unsupported claim or blocker.
In reviews, prioritize correctness and data safety, authorization, maintainability, performance, then style, with file and line references for findings.

## Sources and deliberate adaptations

- [Fizzy STYLE.md](https://github.com/basecamp/fizzy/blob/main/STYLE.md) is the first-party reference for controller/model interactions, resource modeling, method ordering, bang names, and job naming.
- [Vanilla Rails is plenty](https://dev.37signals.com/vanilla-rails-is-plenty/) by Jorge Manrubia explains rich domain models, concerns, and plain Ruby collaborators.
- [Rails reference apps](https://rubyonrails.org/docs/reference-apps) lists Fizzy, Campfire, and Writebook as production-quality examples to study.
- [Agents on Rails](https://rubyonrails.org/2026/8/13/agents-on-rails-the-first-benchmark-report) found that agents used the matching Rails feature in only 8 to 35 percent of runs, which is why the framework-recall step exists.
- [37signals Skills](https://github.com/marckohlbrugge/37signals-skills) is an unofficial secondary reference for the broader Rails checklist, not an authority over first-party guidance or repository constraints.
- The router structure, decision priority, and per-step completion criteria are adapted from [dmmulroy's coding-standards skill](https://github.com/dmmulroy/.dotfiles/tree/main/home/.agents/skills/coding-standards).

This adaptation keeps the user's early-return preference instead of adopting Fizzy's general preference for expanded conditionals.
It treats state records and infrastructure choices as contextual decisions, allows justified service and form objects, and retains established libraries rather than prescribing replacements.
The safety, concurrency, and verification requirements are local standards, not claims about DHH's personal rules.
