---
name: pr
description: Open or update a pull request with a picture summary, before-and-after evidence, and a regressions note, including screenshots and GIFs of changed screens, then babysit it and clean up local evidence from merged pull requests. Use when the user asks to open, make, push, or update a pull request, or when full-send or full-stop files one.
---

# PR

A reviewer should see what changed and that it works without checking out the branch.
Apply the [fstack doctrine](../fstack/references/doctrine.md).
Commit and push only when the user asked for a pull request, and never force-push a shared branch.

## 1. Scope the change

A pull request addresses one goal.
When the change holds independent goals, split it into one branch and pull request per goal, stacking a pull request on the one it depends on.
List the files you are about to stage, and stage only those that implement the change.
Leave out plans, notes, scratch files, and unrelated untracked files; when unsure about a file, leave it out and name it in the report.
Read the repository's pull request template, title rules, and agent instructions.
`gh pr create --body` bypasses the template, so reproduce its sections yourself.

**Complete when:** the staged files are exactly the change's files.

## 2. Clean old evidence

Evidence lives in `tmp/pr-evidence/<key>/`, one folder per branch.
The key is the branch name with each `/` replaced by `-`, then `-`, then the first eight characters of `printf %s "<branch>" | shasum`, so two branches never share a folder.
When `git check-ignore -q tmp/pr-evidence` fails, use `${TMPDIR:-/tmp}/pr-evidence/<repo>/<key>/` instead.
Each folder holds `branch.txt` with the full branch name, and `pr-url.txt` once its pull request exists.
For every folder with that file, run `gh pr view <url> --json state`, remove the folder when the state is `MERGED` or `CLOSED`, and report what you removed.
Leave folders without the file alone, and delete nothing outside the evidence root.

**Complete when:** only folders for open or unopened pull requests remain.

## 3. Open or find the pull request

Run `gh pr view --json url,state` on the branch.
Reuse the pull request only when its state is `OPEN`.
When the branch's pull request is merged, open a new one for the commits since the merge.
When it was closed, ask the user before reopening or replacing it, since someone closed it on purpose.
When no pull request exists, push the branch and create a ready (not draft) pull request with `gh pr create`, so review bots run, filling the template or the body below with what is known so far.
When `gh pr create` fails on the GraphQL rate limit, create it through REST with `gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>`.
Write the URL to `pr-url.txt` in the branch's evidence folder.

**Complete when:** an open pull request exists and its URL is recorded.

## 4. Capture evidence

For a UI change:

1. Run the app locally with seeded test data; the project's own rules name the command and the seed.
2. Screenshot every changed screen from the running app, at the widths users see.
3. Record each changed flow as a GIF.
   Use Claude in Chrome's `gif_creator` when it is available.
   Otherwise record with Playwright WebKit's `recordVideo`, convert with Homebrew `ffmpeg`, and trim the blank opening frames, because GitHub shows the first frame until the GIF plays.
4. Move every file into the evidence folder under a descriptive name.

For a change without UI, the evidence is failing-then-passing test output, command output, or a request and response.

After any later UI change, retake every screenshot and GIF, not only the new ones, and upload them under new file names so GitHub's cache cannot show old images.

**Complete when:** every changed screen and flow has current evidence in the folder.

## 5. Write the body

When the repository has a template, fill in its sections and handle every checkbox.
Otherwise use:

```markdown
## Summary

<the smallest show-me picture of the change, then one or two sentences>

## Evidence

**Before:** <screenshot, GIF, or failing output>
**After:** <screenshot, GIF, or passing output>

## Regressions

<what else the change touches, and how that was checked>
```

Follow the repository's title conventions from recent merged pull requests, and make the title say why the change matters ("cut websocket frames by 70% with gzip", not "negotiate permessage-deflate").
Open the body with the problem in the user's terms, then the fix; never lead with an inventory of changed files.
Write for a teammate reading on a phone: short sentences and plain words.
Link no local plans.

Host images on GitHub and never in a branch or the repository.
Save the body as `body.md` in the evidence folder and reference each evidence file there as `![alt](./name.png)`.
From that folder, apply it with `gh pr edit <n> --body-file body.md --attach ./name.png`, one `--attach` per referenced file; `gh` 2.99 or later uploads each file and rewrites its reference to a `user-attachments` URL, which needs push access.
Spell each `--attach` path exactly as the body does: a different spelling, such as an absolute path, leaves the reference unchanged and appends a second copy of the image at the end of the body.

**Complete when:** the body shows current evidence for every changed screen and behavior, every image in the live body (`gh pr view --json body`) is a `user-attachments` URL with none appended at the end, the diff holds only the change's files, and stale evidence folders are gone.

## 6. Babysit

Hand the pull request to [`babysit-pr`](../babysit-pr/SKILL.md) and stay with it until it is ready, unless the user said only to open it.
When `full-send` or `full-stop` called this skill, return to it once the pull request is open; it runs `babysit-pr` itself.

## Sources and adaptations

The summary, evidence tiers, and before-and-after shape adapt Matt Pocock's `pr` skill (MIT).
The title, problem-first body, and REST fallback adapt Theo Browne's tstack `file-pr` skill (MIT).
The capture, upload, retake, and staging rules come from the user's own corrections in Opto2.
