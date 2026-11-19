---
name: neon-pr
description: Drafts pull request titles and descriptions with Gemini 4 Neon, using pstack's PR writing style. Use when asked to write or revise PR copy or before opening a PR, including in pstack's Opening a PR playbook. Not for code changes, commit messages, or PR reviews.
---

# Write PR copy with Gemini 4 Neon

Use this skill for the title and body step of pstack's Opening a PR playbook or as a standalone draft command.
Keep the rest of the playbook unchanged.

1. Identify the intended base, head, and scope; ask if they are unclear.
   Gather the scoped diff, the user's intent, and actual check results.
   Include the applicable PR template or requirements.
   Don't send secrets or unrelated workspace content.
2. Use the `pi-subagents` skill.
   An explicit `/skill:neon-pr` invocation or a request for Neon to write the PR copy authorizes one drafting delegate, not publication.
   If the skill matched automatically and delegation is not already authorized, ask before launching the writer.
3. Brief the `neon-pr-writer` with the evidence and the applicable PR requirements.
   Pass the PR-writing rules from pstack's Opening a PR playbook, `pistack-technical-writing`, and `pistack-unslop`; the writer does not inherit those skills.
   Follow the repository's PR template if it conflicts with pstack's format.
   Use fresh context and pin the model:

   ```js
   subagent({ agent: "neon-pr-writer", model: "antigravity/gemini-4-neon", cwd: "<repo>",
     task: "<scoped evidence, writing rules, and expected output>", options: { context: "fresh" } })
   ```

4. Check the run receipt for the exact provider/model and verify the copy against the evidence before using it.
   Request corrections from Neon if needed.
   If Neon cannot supply a verified draft, report the blocker rather than silently switching models or writing the copy yourself.
5. Return the title and body as a draft unless the user has authorized a PR write.
   The parent handles any authorized publication with the existing forge workflow.
   The writer never edits files, commits, pushes, or modifies a PR.
