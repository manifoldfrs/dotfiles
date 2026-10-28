---
name: leaving-pr-comments
description: Format and post GitHub comments an agent writes on the user's behalf. Use whenever posting a PR comment, review comment, or reply, or explaining a dismissed finding before resolving it.
---

# Leaving PR Comments

Open every agent-authored comment with this note callout:

```md
> [!NOTE]
> 🤖 **<model> responding on behalf of <user>**

Actual comment starts here.
```

Use the public model name the harness reports and the user's GitHub login from `gh api user --jq .login`.
When the harness exposes no model name, use the harness name.

Keep the attribution inside the note and the reply outside it, with the context line starting with the robot emoji and no second signature.
Apply it to top-level PR comments, inline review comments, and replies to bots or reviewers.
Leave PR descriptions, commit messages, and text the user asked to post verbatim unattributed.

Write the comment itself:

- Lead with the conclusion.
- Cite the code, behavior, check, or reproduction behind it.
- Separate verified facts from judgment.
- Stay short: no thanks, filler, or status narration.

Check the whole comment, including quotes and attachments, for secrets and private details before posting.
Post with `gh pr comment --body-file` or `gh api`, and confirm GitHub returned the comment or review URL.
Resolve a review thread only after its reply posted.

**Complete when:** GitHub returned a URL for the comment and any thread it answers is resolved.

## Sources and adaptations

Adapted from Theo Browne's tstack `leaving-pr-comments` skill (MIT).
