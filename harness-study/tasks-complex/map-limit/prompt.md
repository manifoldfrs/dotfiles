`mapLimit` in `src/mapLimit.js` is supposed to run an async mapper with bounded concurrency, but production saw it overload a downstream API and return results in the wrong order.
Fix it so it meets every rule in `README.md`.
`node --test` runs the visible tests; a stricter hidden test suite also grades the result, so cover the whole spec, not only the visible tests.
Do not modify anything under `test/`.
End your reply with a final line `ANSWER: done`.
