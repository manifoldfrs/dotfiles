# Models and concerns

Use this reference when domain behavior, model APIs, concerns, state, or plain Ruby collaborators change.

## Rich domain models are the application API

- Let controllers and jobs call intention-revealing model methods directly, such as `card.close` or `recording.copy_to(destination)`.
- Plain Active Record CRUD in a controller is fine when there is no additional business behavior.
- Put business rules with the domain concept that owns them, using Active Record models or plain Ruby objects.
- Let models delegate involved work to cohesive objects, such as `Recording::Copier`, while keeping the caller's API small.
- Use service or form objects when they own real policy, coordination, or validation, rather than requiring an intermediary for every controller action.
- Keep Active Record as a first-class domain tool instead of wrapping it in pass-through repositories to imitate another language's architecture.

## Capabilities and concerns

- Extract cohesive model capabilities into namespaced concerns, such as `Card::Closeable`, with their related associations, scopes, and behavior together.
- Put genuinely cross-model behavior in shared concerns, and keep incidental private helpers with their owner.
- A concern earns its place when it groups one capability; a concern that only moves lines out of a long file fails the deletion test.

## State

- Use a state record when actor, time, metadata, or lifecycle matters, such as a `Closure` with a creator and timestamp.
- Keep a boolean for a genuinely binary attribute or an enum for a closed set of states when no separate entity is needed.
- Guard each state transition in the model method that performs it, so every caller gets the same rule.

## The deletion test

Before adding a service, form object, concern, or helper, check whether deleting it would spread meaningful complexity into its callers.
If it would not, call the owning model directly.
Introduce an abstraction for a concrete responsibility or current complexity, not for speculative reuse or because it reaches a fixed number of callers.
For each new abstraction, record the existing owner considered and why it does not fit.

**Complete when:** every changed business rule has one owning model or plain Ruby object, callers use intention-revealing methods, and each new abstraction passes the deletion test.
