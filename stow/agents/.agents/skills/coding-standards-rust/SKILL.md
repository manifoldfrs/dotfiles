---
name: coding-standards-rust
description: Rust coding standards in the fstack style, following the Rust API Guidelines and letting the compiler carry the weight. Use when writing or reviewing .rs code or Cargo manifests, or when another skill needs the user's Rust standards.
---

# Rust Coding Standards

Write idiomatic Rust that follows the Rust API Guidelines and reads like the surrounding code.
Apply the [fstack doctrine](../fstack/references/doctrine.md); this pack states only where Rust differs from the Ruby default.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, memory safety, and debuggability.
2. Follow the project's existing conventions, toolchain, and crates when they are compatible.
3. Follow the Rust API Guidelines.
4. Contain incompatible older patterns at the nearest existing edge instead of spreading them.
5. Keep unrelated behavior unchanged.

## Where the grain differs from Ruby

- **The compiler is the first reviewer.** Encode invariants in types instead of tests: newtypes for values that must not mix (C-NEWTYPE), enums for closed sets of states, and exhaustive `match` with no catch-all arm over a domain enum.
- **Errors are values.** Return `Result` with a meaningful error type (C-GOOD-ERR) and propagate with `?`; use `unwrap` and `expect` only in tests or for an invariant the code just proved, with an `expect` message that states it.
- **Sharp knives need evidence.** `unsafe` is allowed when it is necessary; each block carries a `// SAFETY:` comment naming the invariant that makes it sound, plus a test that exercises it.
- **Abstractions earn their place.** Add a trait or a generic parameter when a second real implementation or caller exists, not for a test double.
- **Fight every crate.** Use the standard library and the crates already in `Cargo.toml` before adding one; put shared versions in `[workspace.dependencies]` when the project has a workspace.
- **Ported or matched behavior follows the reference.** When matching another system, read its source, not docs or memory, cite the reference file, and check parity with golden vectors.

## 1. Establish the local rules

Read the nearest `AGENTS.md`, `Cargo.toml` and any workspace manifest, `rust-toolchain.toml` or the version pinned in CI, `rustfmt.toml`, and clippy and `deny.toml` configuration.

**Complete when:** the toolchain version, the workspace layout, and the configured checks are known.

## 2. Reach for the platform

Before writing new code, look in `std`, the crates already in the dependency tree, and the project's own modules for the feature that already does the job.
Use it, or record why none fits.

**Complete when:** each piece of new code names the feature it uses or why none fits.

## 3. Implement

Implement the complete changed behavior through the owning module's public interface, including every error path.
Keep struct fields private (C-STRUCT-PRIVATE) and expose behavior through methods (C-METHOD).
Implement common traits that callers will need, such as `Debug`, `Clone`, `PartialEq`, and `Default`, where they make sense (C-COMMON-TRAITS).
Document every public item with a summary and its errors and panics (C-FAILURE).

**Complete when:** every traced path is implemented, no new `unwrap` sits on a path a caller can reach, and every new abstraction has a second real use or a recorded reason.

## 4. Verify

Run the project's checks:

    cargo fmt --all --check
    cargo clippy --workspace --all-targets -- -D warnings
    cargo test --workspace

Keep unit tests beside the code in a `#[cfg(test)] mod tests` block, and put behavior across modules in `tests/`.
Report tests that skip themselves, for example for missing fixtures, as not run.
Measure before and after any performance claim, under the same conditions, and keep raw benchmark output out of the repository.

**Complete when:** the checks pass, or each failure is reported with its output.

## Sources and adaptations

- Rust API Guidelines checklist: https://rust-lang.github.io/api-guidelines/checklist.html
- 37signals' Campfire Rust port and its `AGENTS.md`: https://github.com/basecamp/once-campfire-rust
