---
description: Use RepoPrompt for this task
argument-hint: "[task]"
---
Use RepoPromptCE tools for this task before using built-in file tools.

Task: $ARGUMENTS

Preferred flow:
1. Bind to the current workspace if needed with RepoPromptCE_bind_context.
2. Inspect files with RepoPromptCE_get_file_tree, RepoPromptCE_file_search, and RepoPromptCE_read_file.
3. Use RepoPromptCE_manage_selection or RepoPromptCE_context_builder when deeper context is useful.
4. Make targeted edits with RepoPromptCE_apply_edits when changing files.
5. Validate with the smallest relevant command.
