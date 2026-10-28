# Jobs and idempotency

Use this reference when work runs in Active Job, retries, is redelivered, runs after commit, or may execute more than once.

## Jobs own delivery, models own behavior

- Keep Active Job classes shallow and delegate business behavior to domain models.
- Use `_later` for methods that enqueue work and `_now` for their synchronous counterpart when that pairing exists.
- Pass records, which Active Job serializes by global ID, or plain values; do not pass objects that cannot be serialized.

## Commit and delivery

- Enqueue dependent work after commit using behavior verified for the installed Rails version and queue adapter, such as `after_create_commit` or the adapter's transaction-aware enqueueing.
- After-commit enqueueing prevents jobs from seeing uncommitted records, but does not by itself guarantee delivery after a crash.
- Use a transactional outbox or equivalent durable mechanism when losing a committed event is unacceptable.
- Use callbacks for cohesive lifecycle behavior, while keeping multi-step business workflows visible through named model methods.

## Retries

- Make retried work idempotent: a second run after a partial failure must not double-charge, double-send, or duplicate records.
- Use database uniqueness or a recorded state transition as the idempotency guard, not an in-memory check.
- Choose bounded retries for transient failures with `retry_on`, and `discard_on` or explicit handling for permanent failures.
- Use the adapter's concurrency controls, such as Solid Queue's `limits_concurrency`, when two copies of a job must not run at once.

**Complete when:** each changed job delegates to a model, enqueues only after commit, survives a duplicate run, and has an explicit outcome for transient and permanent failures.
