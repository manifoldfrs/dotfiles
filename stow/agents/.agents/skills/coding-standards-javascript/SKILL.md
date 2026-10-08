---
name: coding-standards-javascript
description: Plain JavaScript standards in the 37signals style, with no build step, import maps, Stimulus, Turbo, native browser features, and no TypeScript. Use when writing or reviewing .js files in a Rails app or another plain JavaScript project. For TypeScript, use coding-standards-ts.
---

# Plain JavaScript Coding Standards

Write modern JavaScript that the browser runs as written, with as little of it as the feature needs.
These standards are inspired by 37signals code and posts, not an official 37signals guide.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, security, accessibility, and debuggability.
2. Follow the project's existing setup, such as a bundler, a linter, or a test runner, when it already has one.
3. Prefer server-rendered HTML and Hotwire over client-side state.
4. Prefer the platform over a dependency, and a small dependency over a framework.
5. Keep unrelated code unchanged.

## Principles

- **Reach for the server first.** Turbo Drive, Frames, Streams, and morphing page refreshes cover most interactivity; write JavaScript only for behavior the server cannot render.
- **No build by default.** Ship ES modules through import maps and Propshaft, with no transpiling or bundling; add a build step only when the project already has one or a requirement forces it.
- **Plain JavaScript.** Write no TypeScript and add no type-checking build step; keep values simple enough that names and small functions make them clear.
- **Fight every dependency.** Before `bin/importmap pin`, check the platform and the project's own `helpers/` and `lib/`.
- **Use the platform.** Prefer native elements and APIs, such as `<dialog>` with `showModal()`, `fetch`, `FormData`, `IntersectionObserver`, and CSS for layout and animation.

## Stimulus controllers

- One small controller per behavior, in `app/javascript/controllers/<name>_controller.js`, named for what it does.
- Order members as static declarations, then `// Lifecycle`, `// Actions`, and `// Private` sections, mirroring Ruby's public-then-private order.
- Keep private state and helpers private with `#fields` and `#methods`.
- Declare targets, values, classes, and outlets statically; read configuration from values, not from hardcoded selectors.
- Communicate between controllers with `this.dispatch()` events or outlets, not globals.
- Undo in `disconnect()` what `connect()` set up, such as timers, listeners, and observers.
- Name shared constants in `UPPER_SNAKE_CASE` at the top of the file, and put helpers shared by several controllers in `helpers/`.
- Use `async` and `await` for asynchronous work.
- Send requests to Rails with `@rails/request.js`, which adds the CSRF token; a plain `fetch` that changes data must send the `X-CSRF-Token` header from the `csrf-token` meta tag itself.

```js
import { Controller } from "@hotwired/stimulus"

const AUTOSAVE_INTERVAL = 3000

export default class extends Controller {
  #timer

  // Lifecycle

  disconnect() {
    this.submit()
  }

  // Actions

  change() {
    if (!this.#dirty) this.#timer = setTimeout(() => this.submit(), AUTOSAVE_INTERVAL)
  }

  submit() {
    if (!this.#dirty) return

    this.#clearTimer()
    this.element.requestSubmit()
  }

  // Private

  #clearTimer() {
    clearTimeout(this.#timer)
    this.#timer = null
  }

  get #dirty() {
    return !!this.#timer
  }
}
```

## Style

- Follow the formatting the project already uses; Fizzy uses double quotes, no semicolons, and two-space indentation.
- Prefer early returns and small methods.
- Write comments only for a non-obvious reason or browser quirk.

## Verify

1. Read the project's checks first: its linter, test runner, and CI workflow.
   Add no linter, formatter, or bundler on your own.
2. Test browser behavior through Rails system tests, or through the project's existing JavaScript test runner for a controller with real logic.
3. Exercise the changed behavior in a real browser, including Turbo navigation back and forward, a morphing refresh, and a narrow mobile width.

**Complete when:** the project's checks pass, the behavior works in a browser across Turbo navigation, and no new dependency was added without a stated reason.

## Sources and adaptations

- DHH, "Turbo 8 is dropping TypeScript": https://world.hey.com/dhh/turbo-8-is-dropping-typescript-70165c01
- DHH, "You can't get faster than No Build": https://world.hey.com/dhh/you-can-t-get-faster-than-no-build-7a44131c
- Jorge Manrubia, "A vanilla Rails stack is plenty": https://dev.37signals.com/a-vanilla-rails-stack-is-plenty/
- Fizzy's `config/importmap.rb` and `app/javascript/controllers/`: https://github.com/basecamp/fizzy
- The Stimulus handbook: https://stimulus.hotwired.dev/handbook/introduction
