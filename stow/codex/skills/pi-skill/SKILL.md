---
name: pi-skill
description: Discover and run installed Pi skills from Codex, including Council, Neon PR, Interrogate, other pstack workflows, and project-specific Pi skills. Use when the user names a Pi workflow or asks what Pi skills are available.
---

# Run a Pi skill

From the user's project directory, run `bash <this-skill-directory>/scripts/pi-skill list` to see the skills the dedicated Pi worker loads.
For a one-off non-GPT task, use `bash <this-skill-directory>/scripts/pi-skill model <provider/model> '<brief>'` with the exact authorized route.
If the worker reports missing configuration, ask the user to set up the pinned executable and dedicated state directory; do not use a different harness or the live Pi state as a fallback.
Use the exact catalog name, such as `council` for Council or `pistack-interrogate` for Interrogate.
If a skill is missing, report that Pi did not load it rather than substituting a different workflow.

When the user has authorized running the workflow in Pi, run `bash <this-skill-directory>/scripts/pi-skill run <name> '<brief>'`.
Pass one quoted argument containing the user's scope, requirements, and relevant evidence or file paths.
Pi runs from the current directory in a fresh, noninteractive session and does not inherit the Codex conversation.
Do not include secrets, unrelated context, or permission to edit, publish, or delegate beyond what the user actually granted.
If a workflow matched automatically and the user has not authorized handing it off to Pi, ask before launching it.

Keep Codex's sandbox and approval requirements in effect.
Wait for the same process to finish and relay its result, including failures or incomplete reviews.
The launcher prints a job ID to stderr.
To stop that job explicitly, run `bash <this-skill-directory>/scripts/pi-skill cancel <job-id>` in the same environment.
A cancelled Codex turn does not establish that the Pi job stopped.
If the workflow needs a live user interaction or a Pi UI, ask the user to continue it in interactive Pi; do not guess the response or report the workflow as complete.
