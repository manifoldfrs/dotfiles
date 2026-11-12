`node --test` fails with a crash inside `src/report.js` when several reports are rendered in one process.
Find the root cause and fix it properly; do not paper over the symptom.
`node --test` runs the visible tests; a stricter hidden test suite also grades the result.
Do not modify anything under `test/`.
End your reply with a final line `ANSWER: done`.
