---
description: Summarize unstaged Git changes
---

Run git status, inspect what has changed, then respond with only:

1. A short one- or two-sentence summary of the unstaged changes.
2. A list of changed unstaged files with their added and removed line counts.
3. A total added and removed line count at the bottom.

Keep it concise.
Use Git commands to calculate the line counts.
Do not include staged changes unless they also have unstaged modifications.
