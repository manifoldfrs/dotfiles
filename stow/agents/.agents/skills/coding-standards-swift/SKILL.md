---
name: coding-standards-swift
description: Swift coding standards in the fstack style, following the Swift API Design Guidelines and Swift 6 concurrency. Use when writing or reviewing .swift code, iOS or macOS apps, Swift packages, or Hotwire Native shells, or when another skill needs the user's Swift standards.
---

# Swift Coding Standards

Write idiomatic Swift that follows the Swift API Design Guidelines and reads like the surrounding code.
Apply the [fstack doctrine](../fstack/references/doctrine.md); this pack states only where Swift differs from the Ruby default.

## Decision priority

When rules pull in different directions:

1. Preserve correctness, data-race safety, accessibility, and debuggability.
2. Follow the project's existing conventions, deployment targets, and frameworks when they are compatible.
3. Follow the Swift API Design Guidelines.
4. Contain incompatible older patterns at the nearest existing edge instead of spreading them.
5. Keep unrelated behavior unchanged.

## Where the grain differs from Ruby

- **Clarity at the point of use.** Name methods and argument labels so the call site reads as a phrase, use mutating and nonmutating pairs such as `sort()` and `sorted()`, and judge a name by a real call, not the declaration.
- **The compiler is the first reviewer.** Prefer `struct` and `enum` to `class`, model closed states as enums with associated values, and `switch` over them exhaustively without `default` on a domain enum.
- **Optionals mean absence.** Unwrap with `guard let` or `if let`; force-unwrap only an invariant the code just proved.
- **Concurrency is checked.** Build in the Swift 6 language mode when the project allows it, isolate UI work on `@MainActor`, protect shared mutable state with an actor, prefer structured concurrency such as `async let` and task groups to detached tasks, and make values that cross isolation `Sendable`.
- **Value integrated systems.** For an app backed by a Rails server, choose between a Hotwire Native screen and a fully native screen before building it; 37signals recommends Hotwire Native first.
- **Fight every dependency.** Use the standard library, Foundation, and the platform frameworks the project already imports before adding a package.

## 1. Establish the local rules

Read the nearest `AGENTS.md`, `Package.swift` or the Xcode project settings, the language mode and deployment targets, and the formatter or linter configuration.

**Complete when:** the language mode, the deployment targets, the UI framework, and the configured checks are known.

## 2. Reach for the platform

Before writing new code, look in the standard library, Foundation, SwiftUI or UIKit, and the project's own modules for the feature that already does the job.
Use it, or record why none fits.

**Complete when:** each piece of new code names the feature it uses or why none fits.

## 3. Implement

Implement the complete changed behavior through the owning type's public interface, including `throws` paths and cancellation.
Mark classes `final` unless they are designed for subclassing, and keep access as narrow as `private` or `internal` allows.
Write a documentation summary on every public declaration, as the API Design Guidelines require.

**Complete when:** every traced path is implemented, no new force-unwrap sits on a path a caller can reach, and every new protocol has a second real conformance or a recorded reason.

## 4. Verify

Run the project's checks:

    swift format lint --strict --recursive <source folders>
    swift build
    swift test

For an Xcode app, run `xcodebuild test` with the project's scheme and a simulator destination instead.
Use the project's test framework, Swift Testing or XCTest, and test behavior through public interfaces.
Run the changed screen in a simulator, including a narrow device, Dynamic Type, and dark mode when the screen is new.

**Complete when:** the checks pass with no new concurrency warnings, or each failure is reported with its output.

## Sources and adaptations

- Swift API Design Guidelines: https://www.swift.org/documentation/api-design-guidelines/
- Swift language modes: https://github.com/swiftlang/swift/blob/main/userdocs/diagnostics/error-in-future-swift-version.md
- 37signals, "A vanilla Rails stack is plenty", on Hotwire Native: https://dev.37signals.com/a-vanilla-rails-stack-is-plenty/
