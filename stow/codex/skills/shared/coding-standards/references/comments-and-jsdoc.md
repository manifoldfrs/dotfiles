# Comments and JSDoc

JSDoc is a code comment and follows the global comment rules: none by default, one line, two at most.
Carry meaning in names and types first; a name, type, or test that states the fact beats a comment that describes it.

Write a one-line JSDoc only for a fact the name and type cannot show and a caller would get wrong without it: units, ownership, side effects, or a hidden constraint.
Leave out domain explanations, examples, history, and rationale; those belong in names, tests, commit messages, or a linked doc.

Add `@param`, `@returns`, or `@template` only when the tag states something the signature does not.
Never write a tag that restates the parameter name or type.

```ts
export function parseEmailAddress(input: string): Result<EmailAddress, InvalidEmailAddress>;

export type RequestOptions = {
  /** Total budget, including connection setup and retries. */
  readonly timeout: Duration;
  readonly correlationId: CorrelationId;
};
```

Here `parseEmailAddress` needs no JSDoc because its name and `Result` type already say it parses and fails without throwing.
`timeout` gets one because the type cannot say the budget covers retries.

Document private or internal code only when safe maintenance depends on a non-obvious invariant, side effect, trade-off, or safety justification.

Document each original declaration once; re-exports rely on it.
Write explicit documentation in place of inheritance tags such as `@inheritDoc`.

Reserve `@throws` for unrecoverable defects, framework-required behavior, and temporary `notYetImplemented` paths.
Describe expected typed errors through the return type, not prose.

Names, public documentation, UI copy, and rendered errors use durable vocabulary appropriate to their audience.
Keep ticket names, migration phases, internal storage fields, framework mechanics, and planning language in internal implementation or planning material.

## Completion check

Complete when every applicable rule above has been checked: each added or changed JSDoc states a fact the name and type cannot show, in one line, two at most; no JSDoc or tag restates a name or type; no comment narrates history, plans, or the conversation; re-exports rely on the original declaration; `@throws` is reserved for the listed defect paths; and public language uses durable, audience-appropriate vocabulary.
