---
description: Build a RepoPrompt plan before implementation
argument-hint: "<task>"
---
Use RepoPromptCE_context_builder with response_type="plan" for this task, then summarize the plan before making changes.

Task: $ARGUMENTS

Requirements:
- Let RepoPrompt discover the relevant files.
- If the context builder times out, fall back to RepoPromptCE_get_file_tree, RepoPromptCE_file_search, and RepoPromptCE_read_file.
- Do not implement until you have a concise plan.
