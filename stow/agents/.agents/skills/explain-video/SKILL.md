---
name: explain-video
description: Make a short narrated explainer video, 3Blue1Brown style, on any topic. Use when the user asks for a video, film, or animated explainer; a full course-style lesson belongs to learn-visually.
---

A 30–120 second narrated film: one idea, told in beats, with every motion landing on the word that names it.
It runs on the Psychopomp renderer that learn-visually pins, without the lesson workflow: no trace, no tests, no quiz.
Paths below are relative to this skill's directory; `explain-video.sh` means `bash scripts/explain-video.sh`.

## 1. Script

Write the narration before any visuals: 3–8 beats, one sentence or two per beat, spoken at about 150 words a minute.
Tell it in the order a viewer needs it: the hook or problem, the mechanism shown working, one edge case or surprise, the takeaway.
Name each on-screen entity in the line where it first appears, because the film times its entrance to that word.
For a repository topic, read the code first and say only what the code shows.
**Done when** every beat has a line, an id, and one visual idea, and reading the lines aloud alone explains the topic.

## 2. Scene

Run `explain-video.sh status`.
When the renderer is missing, stop and ask before running learn-visually's `psychopomp.sh setup`, which builds about 380 crates.
Run `explain-video.sh new <slug> [parent-dir]`; the film lands in `<parent-dir>/<slug>`, under the agent artifacts directory unless the user names another place.
On a machine's first film, run `explain-video.sh setup <film-dir>` to fetch the locked crates.

Edit `scene/src/main.rs`: set `TITLE`, replace `LINES`, and rewrite the beats in `film`.
Time each motion from the line that causes it with `said.at("phrase")`, never from a fixed second, so re-voicing re-times the film.
For anything beyond cards, beams, and packets (code diffs, terminals, charts, trees, before-and-after wipes), find the matching row in `$HOME/.cache/learn-visually/psychopomp/SCENE_PLANS.md` under "Build An Explainer" and copy the pattern from the scene it names.
Read `../learn-visually/references/upstream/explainer-motion/explainer-motion.md` before blocking motion: energy has a source, one focal action at a time, quiet at rest.

## 3. Draft and look

`explain-video.sh plan <film-dir>` voices the lines with macOS `say`, builds, and validates the plan.
`explain-video.sh sheet <film-dir>` writes a still every 3 seconds; read every still.
Fix text that overlaps, entities that appear before their word, and frames with nothing moving for more than a beat.
**Done when** the plan validates and every still has been read with nothing to fix.

## 4. Voice

Narration uses ElevenLabs with the user's voice (`VOICE_ID` in the template) when `ELEVENLABS_API_KEY` is set, and macOS `say` otherwise; `ELEVENLABS_VOICE_ID` overrides the voice for one film.
Before voicing with ElevenLabs, run `explain-video.sh cost <film-dir>` and tell the user how many lines it will generate.
Then run `explain-video.sh voice <film-dir>`; only new or changed lines call the API, so rewording one line re-voices one line.
Steer delivery with bracketed directions in the line, such as `[curious]` or `[slower, deliberate]`; ElevenLabs v4 has no speed setting.
Re-run `explain-video.sh sheet` after voicing, because real speech moves every beat.

## 5. Render and open

`explain-video.sh render <film-dir>` renders `<slug>.mp4` at 1920×1080, 60 fps, and checks resolution, frame rate, duration, and that an audio stream exists.
Open it with `open <film-dir>/<slug>.mp4`.
Report the film path, its length, which voice narrated it, and which stills you read.
