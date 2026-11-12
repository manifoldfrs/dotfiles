`bin/dedupe.sh` is supposed to remove duplicate files, but it breaks on real-world file names and has deleted the wrong copies.
Fix it so it meets every rule in `README.md` on macOS with the system Bash 3.2 and BSD tools.
`bash test/run.sh` runs the visible tests; a stricter hidden test suite also grades the result.
Do not modify anything under `test/`.
End your reply with a final line `ANSWER: done`.
