---
name: coding-standards-kotlin
description: Kotlin coding standards following Kotlin conventions and structured concurrency. Use when writing or reviewing .kt or .kts code, or Kotlin-specific Android and Gradle configuration.
---

# Kotlin Coding Standards

Write idiomatic Kotlin that follows the Kotlin coding conventions and reads like the surrounding code.
Use the [shared engineering guidance](../fstack/references/doctrine.md) without starting a fstack workflow.
This pack follows Kotlin's own conventions and the project's architecture.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, null safety, accessibility, and debuggability.
2. Follow the project's existing conventions, Kotlin version, and libraries when they are compatible.
3. Follow the Kotlin coding conventions.
4. Contain incompatible older patterns at the nearest existing edge instead of spreading them.
5. Keep unrelated behavior unchanged.

## Kotlin principles

- **The compiler is the first reviewer.** Model closed states as `sealed interface` or `sealed class` hierarchies and use `when` as an expression over them with no `else` branch, so a new state fails to compile until it is handled.
- **Null safety is the type system's job.** Use `?.`, `?:`, and early returns; use `!!` only for an invariant the code just proved.
- **Immutable by default.** Declare `val` over `var`, use read-only collection types such as `List` and `Map` in signatures, and prefer `data class` for values.
- **Idioms over ceremony.** Prefer default parameters to overloads, expression forms of `if`, `when`, and `try`, extension functions for behavior on a type, and named arguments for booleans and same-typed parameters.
- **Concurrency is structured.** Launch coroutines in an owned scope, such as `viewModelScope` or `lifecycleScope` on Android, never `GlobalScope`; expose streams as `Flow`.
- **Follow the application's UI architecture.** Use its existing Compose, View, or web-backed screen conventions; changing that architecture requires an explicit design decision.
- **Fight every dependency.** Use the Kotlin standard library, kotlinx libraries already in the build, and AndroidX before adding a library.

## 1. Establish the local rules

Read the nearest `AGENTS.md`, the Gradle build files and version catalog, the Kotlin and Android versions, and any ktlint, detekt, or Android lint configuration.

**Complete when:** the Kotlin version, the build layout, and the configured Gradle tasks are known.

## 2. Reach for the platform

Before writing new code, look in the standard library, the collection operations, kotlinx coroutines, AndroidX, and the project's own modules for the feature that already does the job.
Use it, or record why none fits.

**Complete when:** each piece of new code names the feature it uses or why none fits.

## 3. Implement

Implement the complete changed behavior through the owning class's public interface, including failure paths and cancellation.
In a library, state visibility and return types explicitly and write KDoc for every public member, as the library conventions require.
Keep visibility as narrow as `private` or `internal` allows.

**Complete when:** every traced path is implemented, no new `!!` sits on a path a caller can reach, and every new interface has a second real implementation or a recorded reason.

## 4. Verify

Run the project's checks, for example:

    ./gradlew check
    ./gradlew test

Run the project's configured ktlint, detekt, or Android lint tasks too, by the names its build defines.
Use the project's test framework and test behavior through public interfaces.
Run a changed screen on an emulator, including a narrow device, large font, and dark theme when the screen is new.

**Complete when:** the checks pass, or each failure is reported with its output.

## Sources and adaptations

- Kotlin coding conventions: https://kotlinlang.org/docs/coding-conventions.html
- Sealed classes with `when`: https://kotlinlang.org/docs/sealed-classes.html
- Kotlin coroutines guide: https://kotlinlang.org/docs/coroutines-guide.html
