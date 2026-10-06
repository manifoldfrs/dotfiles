# Controllers, routes, and parameters

Use this reference when routes, controllers, parameters, or HTTP responses change.

## Resources

- Prefer CRUD endpoints on named resources when an operation has a natural resource representation.
- For example, creating a card's `closure` closes it, and destroying that resource reopens it.
- Preserve established external routes unless changing that contract is part of the task.

## Thin controllers

- A controller action loads records through the authorized scope, calls one model method, and responds.
- Multi-step business workflows belong in named model methods, not in the action body.
- A rejected action must stop execution before mutations, since rendering or calling `head` alone does not return from the method.
  Use `return head(:forbidden)`, a `before_action` that renders or redirects, or an exception handled by `rescue_from`.

## Parameters

- Validate input shape and permit only intended attributes through strong parameters supported by the installed Rails version, such as `params.expect` on Rails 8 or `params.require(...).permit(...)` before it.
- Distinguish missing, blank, false, and zero when the contract does, rather than coercing them to a convenient default.
- Strong parameters restrict assignment, not authorization; see [authorization and tenancy](authorization-and-tenancy.md).

## Responses

- Respond to failed validation with the form re-rendered and `status: :unprocessable_entity`, which Turbo requires to display errors.
- Redirect after a successful mutation, with `status: :see_other` for non-GET Turbo requests when the project relies on it.

**Complete when:** each changed endpoint maps to a resource, loads through an authorized scope, permits only intended attributes, stops on rejection, and returns the status the client relies on.
