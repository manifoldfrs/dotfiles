---
description: Build a RepoPrompt plan before implementation
---

Use RepoPromptCE_context_builder with response_type="plan" for this task, then summarize the plan before making changes.

Task: $ARGUMENTS

Requirements:
- Let RepoPrompt discover the relevant files.
- If the context builder times out, fall back to RepoPromptCE_get_file_tree, RepoPromptCE_file_search, and RepoPromptCE_read_file.
- Write the plan to the requested Markdown path or the project's existing plan location.
- Present the plan in chat or the requested Plannotator browser/TUI surface, collect feedback, and revise the same Markdown file.
- Wait for explicit implementation approval.
