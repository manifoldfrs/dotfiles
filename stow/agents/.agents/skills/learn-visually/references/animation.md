# Animation mode

A rendered film on Kit Langton's Psychopomp: a Rust scene program reads `example/trace.json` and writes a Scene Plan, and Psychopomp renders it to a 1920×1080, 60 fps MP4.
Deliver the MP4 plus the editable scene crate.
Read [`upstream/explainer-motion/explainer-motion.md`](upstream/explainer-motion/explainer-motion.md) and [`upstream/explainer-motion/STORY.md`](upstream/explainer-motion/STORY.md) before blocking beats; read `TECHNIQUES.md` when tuning motion.

## Toolchain

Run `bash scripts/psychopomp.sh status`.
When anything is missing, stop and ask before running `bash scripts/psychopomp.sh setup`: it installs a pinned Rust toolchain beside the default one, clones Psychopomp at a pinned commit into `~/.cache/learn-visually/psychopomp`, and builds about 380 crates from crates.io with `--locked`.
Psychopomp is tested on macOS with Metal; another platform is an unverified risk to report.
When the toolchain cannot be made to work, report the blocker; propose another renderer only with a concrete reason, and never substitute slides or HTML silently.

Narration is a separate choice and is off by default.
Captions carry the film.
Psychopomp can voice scripts with macOS `say` for drafts, or with ElevenLabs or Fish Audio, which are paid services that need the user's API key; use them only when the user asks, and only through the user's own key.

## Workflow

1. **Storyboard to beats.**
   Turn each storyboard beat into film beats with a named start time: establish, problem, replay or switch, model, worked example, edge case, challenge, end card.
   Choose one persistent stage, with the same entities in the same places for the whole film, and give each entity a label and a status that changes as the story moves.
   **Done when** every beat names its source, path, and sink of motion (see `explainer-motion.md`), and every number on screen names the trace field it comes from.
2. **Scene crate.**
   `bash scripts/psychopomp.sh new-scene <lesson>` copies `templates/scene/`: `Cargo.toml`, `main.rs` (a working skeleton), and `film.rs` (the reusable machinery).
   Map simulated time to film time with `film::Clock`: a stated slow-motion factor per stretch, shown in a status chip ("10× slower"), plus prediction pauses during which simulated time stands still.
   Drive continuous quantities from trace keyframes, splitting sweeps at every pause and rate change, so nothing refills or moves while the viewer is predicting.
   Queue captions, chips, and rolling numbers with `Footers`, `Chips`, and `Rolls`; they flush in time order, so acts can be written in story order.
   Mark every beat and prediction with `Beats::mark`; the scene writes `<slug>.beats.json` beside the plan.
3. **Plan.**
   `bash scripts/psychopomp.sh plan <lesson>` builds the crate, writes `animation/<slug>.plan.json`, and runs `plan validate`.
   Validation catches text that does not fit a card and out-of-order changes; fix the cause rather than suppressing it.
4. **Stills before video.**
   `bash scripts/psychopomp.sh sheet <lesson> 1:<end>:3` renders a still every 3 s without encoding.
   Read every still, then fix overlaps, stale numbers, labels that contradict the trace, and captions that stack.
5. **Short window in motion.**
   `bash scripts/psychopomp.sh render <lesson> <a>..<b>` renders a few seconds around the busiest beat; read a 12–25 fps strip and check that every arrival, drop, and counter change has a visible cause and lands in order.
6. **Full render.**
   `bash scripts/psychopomp.sh render <lesson>`, in the foreground or in the background with a log; never report a film that is still rendering.
7. **Check the film.**
   `bun <skill>/scripts/video_check.ts animation/<slug>.mp4 animation/<slug>.plan.json checks/animation --beats animation/<slug>.beats.json`, then read the beat sheet and each beat frame.

## Film conventions

| Element | Convention |
| --- | --- |
| Header | top left: the concept and one line on what the film shows |
| Status chip | top right: the act and the time scale, such as "token bucket · 20× slower", "◀◀ rewind", "final challenge" |
| Footer caption | bottom left: one sentence per beat, typed in, on screen for its typing time plus 0.3 s per word and at least 1.5 s; one accent word |
| Prediction pause | a footer that starts with "predict:", a countdown ring of 5–7 s, simulated time frozen, then the reveal and a one-line why |
| Replay | show the naive version, rewind visibly, then replay the same moment with the real mechanism (`STORY.md`: replay, don't redraw) |
| Counters | rolling numbers for clocks and counts; never let a counter show a stale value while the thing it counts moves |
| Final challenge | a new case answered from the model, with a prediction pause before the reveal |
| End card | where to go next: the interactive lab or a manual section |

Tones keep the lesson's legend: request is blue, success green, error red, warning (amber) for stored state, muted for configuration and context, and accent for the one thing to follow.

## Gates

| Gate | Passes when |
| --- | --- |
| Plan | `plan validate` reports valid |
| Numbers | every number on screen is read from `trace.json` in the scene program, or derived from it in code |
| Stills | a still every 3 s has been read, with no overlapping text, stacked captions, or labels against the wrong element |
| Motion | a short window has been read as a strip, and arrivals, drops, and counters change in causal order |
| Container | `video_check.ts`: 1920×1080, 60 fps, and a duration matching the plan |
| Captions | `video_check.ts`: every footer stays on screen long enough to read |
| Beats | each frame in `beats.json` has been read, and prediction pauses hold the bucket or quantity still |
| Whole clip | the whole film has been reviewed through a still every 2–3 s, or watched; say which |

Record in `checks.md` which stills, strips, and beat frames you inspected, and which gates could not run.
