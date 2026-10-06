# Views and Hotwire

Use this reference when views, partials, helpers, Turbo, or Stimulus change.

- Favor server-rendered views and existing Turbo and Stimulus patterns for Rails UI work, without rewriting an established frontend stack.
- Pass view dependencies explicitly through locals or helper arguments rather than reading instance variables inside partials.
- Use Rails escaping and tag helpers, and keep untrusted content out of `raw` and `html_safe`.
- Use `dom_id` for element and Turbo target identifiers so server and client agree on names.
- Keep Stimulus controllers small and generic, configured through values, targets, and classes rather than hard-coded selectors.
- Scope Turbo Stream broadcasts to the authorized tenant or user, as described in [authorization and tenancy](authorization-and-tenancy.md).
- Keep business decisions out of views; ask the model a named predicate instead.

**Complete when:** changed views escape untrusted content, partials receive explicit locals, broadcasts are scoped, and interactive behavior uses the project's established Turbo or Stimulus patterns.
