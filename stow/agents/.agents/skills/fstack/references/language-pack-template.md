# Language pack template

Copy this file to `stow/agents/.agents/skills/coding-standards-<language>/SKILL.md` when work in a new language starts.
Replace every `<placeholder>`, delete every line that starts with `>`, and keep the pack under about 100 lines.
Move detail that only some changes need into `references/<concern>.md` and list it in step 2.

A pack is a delta on the official guide and on the Ruby default.
It states the authority to follow, the checks to run, and only the places where the language's grain differs from Ruby.
It caches only what the environment and the official docs do not say.

After copying, also:

1. Add `coding-standards-<language>	local` to `.skill-sources.tsv`.
2. Add `agents/openai.yaml` with a display name and a short description.
3. Add `stow/opencode/.config/opencode/commands/coding-standards-<language>.md`, matching the other wrappers.
4. Add the pack to the "Language packs" list in `doctrine.md` and to the README.
5. Use the pack on one real task and run its checks before calling it done.

---

```markdown
---
name: coding-standards-<language>
description: <Language> coding standards in the fstack style, following <official guide> and the language's own grain. Use when writing or reviewing <file extensions> code, or when another skill needs the user's <language> standards.
---

# <Language> Coding Standards

Write idiomatic <language> that follows <official guide> and reads like the surrounding code.
Apply the [fstack doctrine](../fstack/references/doctrine.md); this pack states only where <language> differs from the Ruby default.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, safety, and debuggability.
2. Follow the project's existing conventions, versions, and tools when they are compatible.
3. Follow <official guide>.
4. Contain incompatible older patterns at the nearest existing edge instead of spreading them.
5. Keep unrelated behavior unchanged.

## Where the grain differs from Ruby

> Three to six bullets. Each names one thing the language does differently and what the agent does about it.
> Lead with what the compiler or runtime proves, because that replaces checks a Ruby agent would write as tests.

- <difference>: <what to do>

## 1. Establish the local rules

Read the nearest `AGENTS.md`, the project manifest (<manifest file>), the toolchain version, and the formatter and linter configuration.

**Complete when:** the language version, the build tool, and the configured checks are known.

## 2. Load the applicable references

> List one line per reference file, with the condition that loads it. Delete this step when the pack has no references.

- [<concern>](references/<concern>.md): when <condition>.

**Complete when:** every changed concern maps to a reference or to the principles above.

## 3. Reach for the platform

Before writing new code, find the standard library or framework feature that already does the job in <where to look>.
Use it, or record why none fits.

**Complete when:** each piece of new code names the feature it uses or why none fits.

## 4. Implement

Implement the complete changed behavior through the owning module's public interface, including its failure paths.
Make illegal states hard to represent where the type system makes that cheap, and stop once nothing would otherwise fail at runtime.

**Complete when:** every traced path is implemented, and every new abstraction has a second real use or a recorded reason.

## 5. Verify

Run the project's checks:

    <format command>
    <lint command>
    <test command>

Test behavior through public interfaces, beside the code, following the project's layout.
Measure before and after any performance claim, under the same conditions.

**Complete when:** the checks pass, or each failure is reported with its output.

## Sources and adaptations

- <official guide>: <URL>
- <any 37signals or reference project in this language>: <URL>
```

---

## Seeds for the next packs

These notes come from the fstack research.
Use them to fill the template; confirm each one against the current official source before relying on it.

### Rust

- Authority: the Rust API Guidelines checklist, https://rust-lang.github.io/api-guidelines/checklist.html
- Reference project: 37signals' Campfire Rust port and its `AGENTS.md`, https://github.com/basecamp/once-campfire-rust
- Checks: `cargo fmt --all`, `cargo clippy --workspace --all-targets`, `cargo test --workspace`.
- Grain: newtypes for distinct values (C-NEWTYPE); meaningful error types (C-GOOD-ERR); `?` instead of `unwrap` outside tests; the compiler is the first reviewer.
- From the Campfire port: when matching existing behavior, read the reference source rather than docs or memory; check parity with golden vectors; keep shared dependency versions in the workspace manifest; never commit raw benchmark results.

### Swift

- Authority: the Swift API Design Guidelines, https://www.swift.org/documentation/api-design-guidelines/
- Checks: the project's `swift-format` or SwiftLint, Swift 6 strict concurrency, and `swift test` or `xcodebuild test`.
- Grain: clarity at the point of use; value types first; actor isolation for shared mutable state; a documentation summary on every declaration.
- For an app backed by Rails, choose between a Hotwire Native shell and a fully native screen before writing screens; 37signals recommends Hotwire Native first.

### Kotlin

- Authority: the Kotlin coding conventions and library authors' guidelines, https://kotlinlang.org/docs/coding-conventions.html
- Checks: the project's ktlint or detekt, and Gradle `check`.
- Grain: `val` over `var`; immutable collection interfaces; sealed hierarchies with exhaustive `when`; default parameters over overloads; expression forms of `if`, `when`, and `try`.
- The same Hotwire Native choice applies on Android.
