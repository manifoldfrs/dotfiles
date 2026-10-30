# Ruby style

Use this reference when naming, method order, control flow, or metaprogramming change.

- Use domain nouns for objects, role names for associations, and positive predicates for boolean questions.
- Reserve custom `!` methods for a meaningful non-bang counterpart, rather than using the suffix to mean destructive.
- Order class methods before public instance methods, with `initialize` first among instance methods, then private helpers in call order when practical.
- Prefer early guard clauses to keep substantial happy paths shallow, and use explicit branches when selecting a return value is clearer.
- Follow the project's formatter for quotes, indentation, and visibility modifiers rather than imposing 37signals-specific whitespace.
- Prefer ordinary methods and explicit branches over metaprogramming for a small fixed set of cases.
- Keep method and constant names whole and searchable; avoid building them with `send` or string interpolation for a fixed set of cases.

**Complete when:** changed code reads in domain vocabulary, follows the project's formatter, and uses metaprogramming only where a real extension point requires it.
