---
name: artifact-review
description: "Use when the user asks for a reviewable HTML plan, design comparison, PR or architecture walkthrough, visual document, or wants to annotate or clean up an HTML review."
---

# Artifact review

Write a standalone HTML file that the user can read in a browser and annotate.
Use an existing artifact when the user already has one.
Run `artifact-review workspace` and save generated HTML in the returned directory, unless the user asks to keep it elsewhere.
Without a Codex thread ID, use an individual temporary directory under `${TMPDIR:-/tmp}/agent-artifacts/`.
Use a distinct filename for each review round.

Match the page to the work:

- **Plan:** Explain the decision, sequence, dependencies and checks. Diagram the steps if their order matters.
- **Design comparison:** Show each option with the same content and viewport. Put the options side by side and stack them on narrow screens. Identify the tradeoff below each option.
- **PR walkthrough:** Read the actual diff. Lead with behavior and group excerpts by intent. Name the commit range or working-tree snapshot and label additions and deletions with more than color.
- **Architecture walkthrough:** Show boundaries and data flow. Name the direction of each connection and connect important nodes to source locations.
- **Document or exploration:** Lead with the main question or finding. Use headings, diagrams, examples, and collapsible details where they improve reading.

Use inline CSS, embedded images, and HTML or inline diagrams so the file works offline.
For interactions in the viewer, use native elements such as `details`, anchor links, or CSS-driven controls.
The viewer disables artifact JavaScript and external assets.
Give each meaningful review target a unique, descriptive `data-review-id`.
For targets tied to code, add `data-review-source="path/to/file:42"` with a real path and line.
Keep IDs stable across review rounds and escape source excerpts and other text when embedding them in HTML.

From an interactive Codex thread, run `artifact-review --notify-codex path/to/file.html` through a tool session that stays alive while the user reads.
Give the user the review URL when the command prints it.
For a remote Rex session, use `--no-open` and forward the review port to the browser's machine.
End the turn after sharing the URL.
When the user sends feedback, the launcher queues a message in this thread.
Read the JSON in the path from that message and act on the comments, using the quotes, IDs, and source references to locate the changes.
After handling the comments, run `artifact-review acknowledge FILE` with the path from the queued message.
Closing the review without comments does not queue a message.
For a runner without `CODEX_THREAD_ID`, omit `--notify-codex`, wait for the command to finish, and read its stdout JSON directly.
Use a fresh review round if the user wants to check revisions.

## Cleanup

Run `artifact-review clean` when the user asks to clean up this thread's review files.
Codex's SessionEnd hook cleans the temporary workspace once the session ends, including when the user quits.
The hook keeps the workspace if it still contains queued feedback that needs to be handled.
