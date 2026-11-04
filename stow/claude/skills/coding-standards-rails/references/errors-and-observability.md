# Errors and observability

Use this reference when behavior can fail, rescues exceptions, reports errors, logs, or handles sensitive data.

## Make failures explicit in Rails terms

- Use `save` or `update` with a checked result and model errors for recoverable form validation failures.
- Use `save!`, `create!`, or a domain exception when failure must interrupt the operation or roll back a transaction.
- Rescue specific exceptions only where they can be recovered from or translated into a meaningful response.
- Translate expected exceptions to HTTP responses at the controller boundary with `rescue_from`, not inside models.
- Let unexpected failures reach the application's reporting path instead of converting them into success, nil, or an empty collection.
- When you recover from an error that still matters, report it through the project's reporter, such as `Rails.error.report` on Rails 7 and later.
- Define domain exceptions in the namespace of the model that raises them, such as `Card::AlreadyClosed`, with a message that greps back to the raise site.

## Sensitive data

- Keep secrets and arbitrary request payloads out of logs and errors.
- Maintain `config.filter_parameters` for newly introduced sensitive fields.
- Read secrets from Rails credentials or the environment, never from tracked files.
- Log stable identifiers and state, not whole records or params.

**Complete when:** every new failure path is either recovered with a specific, tested outcome or reaches the reporter, and no new secret or personal field can reach logs or error messages.
