---
description: Review current changes with RepoPrompt
argument-hint: "[focus]"
---
Use RepoPromptCE_git and RepoPromptCE tools to review the current uncommitted changes.

Focus: ${ARGUMENTS:-bugs, regressions, unsafe behavior, missing validation, and test gaps}

Preferred flow:
1. Use RepoPromptCE_git status and diff.
2. Read the changed files with RepoPromptCE_read_file as needed.
3. If the diff is broad, use RepoPromptCE_context_builder with response_type="review".
4. Return findings by severity with file paths and concrete fixes.
5. If there are no issues, say so plainly.
