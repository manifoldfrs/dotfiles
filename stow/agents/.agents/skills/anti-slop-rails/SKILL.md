---
name: anti-slop-rails
description: Evidence-based Ruby on Rails cleanup. Use when asked to remove Rails slop, audit speculative abstractions or defensive code, or apply anti-slop checks to a Rails diff.
---

# Anti-slop Rails

Remove code that adds machinery, hides failures, or claims guarantees it does not enforce.
Every finding needs a concrete call site, violated contract, or observable cost.
A pattern match is a lead, not a verdict.

This is a review and cleanup skill, not an installed linter plugin.
It adapts the evidence-first idea from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) to Rails rather than translating TypeScript bans into Ruby.

## 1. Establish scope

Read the repository's instructions and [the Rails standards](../coding-standards-rails/SKILL.md).
Those standards own the architectural and safety rules, this skill supplies the audit procedure.
Inspect Ruby/Rails versions, schema, relevant callers, test stack, and lint configuration.

Use the requested files or comparison base.
Without an explicit scope, examine tracked uncommitted changes and relevant untracked application files.
If the checkout is clean and no scope was given, ask which area to inspect.
Record the scope and preserve unrelated changes.
Treat requests to review as read-only, and edit only when cleanup or implementation is requested.

## 2. Trace candidates to evidence

Inspect changed behavior and its callers, not just added lines.
Use [the candidate checks](references/checks.md) to guide the pass.
Search beyond the diff only to verify ownership, reachability, contracts, and consequences.

For each candidate, establish:

- **Location:** file, line, and affected entry point.
- **Evidence:** the actual failure path, discarded information, duplicated policy, or unnecessary indirection.
- **Counterexample:** why the pattern might be intentional here, and what inspection confirmed or ruled out.
- **Smallest repair:** the existing Rails or domain API that can own the behavior.
- **Verification:** the test, lint check, query measurement, or caller search that would validate the claim.

Keep unsupported suspicions separate from confirmed findings.
A service object, concern, callback, safe-navigation operator, or mock is not a finding by itself.
Keep objects that own policy, integration boundaries, or genuinely complex coordination.
Do not add replacement layers merely to give the same indirection a different name.

## 3. Use existing automation honestly

If RuboCop is configured, inspect the installed cop catalog with the project's launcher and `--show-cops`.
Use its existing config and configured lint command first.
These cops can supply leads when installed:

| Cop | What still needs inspection |
| --- | --- |
| `Lint/SuppressedException` | Whether swallowing the exception is deliberate recovery |
| `Style/RescueModifier` | Whether a broad fallback conceals unrelated failures |
| `Rails/SkipsModelValidations` | Which invariants and callbacks the write must preserve |
| `Rails/UniqueValidationWithoutIndex` | Actual index scope, predicates, null behavior, and deployed schema |
| `Rails/OutputSafety` | Whether the rendered content can contain untrusted input |
| `Rails/FindEach` | Whether batching preserves required order and iteration behavior |

Run a focused `--only` selection only after confirming those cops exist in the installed version.
Report any checks excluded by configuration or unavailable in that version.
RuboCop findings do not prove authorization, race safety, idempotency, or architectural quality.
Keep those as explicit manual or runtime checks.

If lint tooling is absent, report that limitation and use the existing tests.
Installing dependencies, adding custom cops, or changing CI is separate work requiring the user's request.
Preserve configured exclusions and severity, and resolve findings without blanket suppressions or unsafe bulk autocorrection.

## 4. Repair only verified problems

For an authorized cleanup, make one coherent change at a time.
For a behavioral defect, reproduce it through the public model, request, or job boundary before changing code, then keep that check as a regression test.
If reproduction is unavailable, report the blocker rather than presenting a speculative fix as verified.

For structural cleanup, inspect all callers and preserve observable behavior with focused tests.
Retain necessary validation, authorization, escaping, transaction boundaries, retry handling, and database constraints.
Changes to deployed data or migrations require a rollout plan, not a mechanical cleanup.
Leave unrelated rewrites and formatter churn out of the patch.

## 5. Report the result

Order findings by correctness and data safety, authorization, maintainability, then measured performance.
For each confirmed finding, give its file/line, consequence, evidence, and smallest repair.
List unverified concerns separately, without assigning them the certainty of findings.

Finish with scope reviewed, changes made if any, exact checks run and their outcomes, and remaining limitations.
If nothing met the evidence bar, say so.
Completion means every candidate was confirmed, dismissed with a reason, or explicitly left unverified, and every edited behavior has validation evidence or a named blocker.

## References

- [Upstream installer skill](https://github.com/dmmulroy/anti-slop/blob/main/skills/install-anti-slop/SKILL.md) installs Oxlint rules, this skill does not provide equivalent automated enforcement.
- [RuboCop Rails cops](https://docs.rubocop.org/rubocop-rails/cops_rails.html) and [RuboCop lint cops](https://docs.rubocop.org/rubocop/cops_lint.html) describe automated checks and their limitations.
- The [Rails standards](../coding-standards-rails/SKILL.md) contain Rails/37signals source attribution and deliberate local adaptations.
