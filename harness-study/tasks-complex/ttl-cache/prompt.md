Users report that `TtlCache` in `src/ttlCache.js` evicts entries they used recently and that `size` is wrong after entries expire.
Fix `src/ttlCache.js` so it meets every rule in `README.md`.
`node --test` runs the visible tests; a stricter hidden test suite also grades the result, so cover the whole spec, not only the visible tests.
Do not modify anything under `test/`.
End your reply with a final line `ANSWER: done`.
