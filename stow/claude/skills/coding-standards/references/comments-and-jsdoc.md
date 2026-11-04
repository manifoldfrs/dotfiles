# Comments and JSDoc

Add a one-line JSDoc to an exported symbol or public class member when its name and type do not say enough: units, ownership, side effects, expected failures, invariants, or a non-obvious domain rule.
Skip the JSDoc when the signature already says it.
Use two lines at most; link a design doc or issue when the reason needs more.

Add `@param`, `@returns`, or `@template` only when the tag states something the signature does not.
Never write a tag that restates the parameter name or type.

```ts
/** Parses an email address from untrusted input; returns `InvalidEmailAddress` instead of throwing. */
export function parseEmailAddress(input: string): Result<EmailAddress, InvalidEmailAddress>;

export type RequestOptions = {
  /** Total budget, including connection setup and retries. */
  readonly timeout: Duration;
  readonly correlationId: CorrelationId;
};
```

Document private or internal code only when safe maintenance depends on a non-obvious invariant, side effect, trade-off, or safety justification.

Document each original declaration once; re-exports rely on it.
Write explicit documentation in place of inheritance tags such as `@inheritDoc`.

Reserve `@throws` for unrecoverable defects, framework-required behavior, and temporary `notYetImplemented` paths.
Describe expected typed errors in the one-line summary or `@returns`.

Names, public documentation, UI copy, and rendered errors use durable vocabulary appropriate to their audience.
Use ordinary domain phrases readers are likely to search for when those phrases differ from an identifier's spelling.
Keep ticket names, migration phases, internal storage fields, framework mechanics, and planning language in internal implementation or planning material.

## Completion check

Complete when every applicable rule above has been checked: each JSDoc states a fact the signature cannot show in two lines or fewer; no JSDoc or tag restates a name or type; re-exports rely on the original declaration; `@throws` is reserved for the listed defect paths; and public language uses durable, searchable, audience-appropriate vocabulary.
