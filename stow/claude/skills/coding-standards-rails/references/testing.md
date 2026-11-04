# Testing

Use this reference whenever behavior, tests, fixtures, or test helpers change.

## Choose the test

- Follow the existing test stack, preferring Rails' Minitest and fixtures for new projects without an established choice.
- Test domain behavior through model APIs, HTTP behavior through request or integration tests, and critical browser interactions through focused system tests.
- Assert observable results, persisted state, responses, and delivered or enqueued work rather than private method call order.

## Cover the claims

- Cover changed validation and failure branches, unauthorized access, cross-tenant access where applicable, and retry behavior when work can be redelivered.
- Exercise real database constraints, transaction behavior, and job execution when the correctness claim depends on them, such as asserting `ActiveRecord::RecordNotUnique` for a unique index.
- Use `assert_difference`, `assert_enqueued_with`, and `perform_enqueued_jobs`, or the RSpec equivalents, to observe effects.
- Control time with `travel_to` or the project's helpers, and replace external services at their boundary rather than stubbing internal collaborators.

## Run the checks

- Run the smallest relevant tests and the project's configured Ruby lint checks, expanding validation when the change crosses boundaries.
- A test that stubs the constraint, permission check, or transaction it claims to verify proves nothing.

**Complete when:** every changed behavior and failure branch has a test through its public interface, the real constraint or job behavior is exercised where the claim depends on it, and the relevant tests and lint pass.
