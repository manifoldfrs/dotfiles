---
description: Search the codebase with RepoPrompt first
argument-hint: "<query>"
---
Use RepoPromptCE_file_search to search the codebase for:

$ARGUMENTS

Then:
1. Read the most relevant matches with RepoPromptCE_read_file.
2. Explain what you found concisely.
3. Ask before editing unless the requested next step is obvious.
