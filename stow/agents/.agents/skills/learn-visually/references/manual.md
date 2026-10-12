# Manual mode

A printed manual: a PDF plus its editable HTML source.
Each page is designed, not flowed: one claim per spread, figures beside the reasoning they support, and every number computed from the trace.

## Build

1. Copy `templates/tokens.css`, `templates/manual/manual.css`, `svg.mjs`, `build.mjs`, and `check.spec.json` into `<lesson>/manual/`.
2. Write `manual/figures.mjs`: one export per figure, each `(trace, options) => svgString`, built with `svg.mjs`.
3. Write `manual/manual.src.html` as a sequence of `<section class="page">` sheets.
   Place figures with `<!-- figure: name {"json": "options"} -->` and numbers with `{{ trace.scenarios.… }}`.
4. Build, check, print, and rasterize:

```bash
node manual/build.mjs
bun <skill>/scripts/chrome.ts check manual/manual.html --spec manual/check.spec.json --out checks/manual
bun <skill>/scripts/chrome.ts pdf manual/manual.html manual/manual.pdf
bash <skill>/scripts/pdf_pages.sh manual/manual.pdf checks/manual/pages 110
```

## Structure

Choose length from the concept and depth (see `teaching.md`), not from the size of other manuals.
A working-depth manual is usually 6–14 pages:

| Page | Holds |
| --- | --- |
| Cover plate | Title, one annotated plate of the running example with numbered callouts and a key, a one-paragraph abstract, the edition line: parameters, reference version, date. |
| How to read | Outcomes, prerequisites, how it was made and what was checked, the colour table, the source ranking, and a figure that teaches the visual grammar. |
| One page per storyboard beat | A claim headline, a deck line, the figure beside its explanation, a worked trace table where the beat has one, a box or two, and a `Sources:` line. |
| Debug and application | The debug challenge with code and paired figures; the application with a decision table. |
| Break points | A table of simplification, what is true instead, and the source. |
| Exercises | Five or six: predict, explain, debug, choose, transfer, break point. |
| Answers | On their own page; state which answers were computed with the example and which are reasoned. |
| Reference | The rule, useful formulas, the API mapping for real implementations, and a glossary. |
| Sources | Full citations with versions and read dates; the full trace table. |

## Page conventions

- Headlines state the claim ("Idle time cannot bank more than one burst"), not the topic ("Refill").
- Every figure has a frame head with its number and title, a provenance tag (`simulated · scenarios.x`, `measured · …`, or `illustrative`), and a caption that says how to read it.
- Boxes: **Predict** for questions answered at the back, **Verify** for how to check a claim yourself, **What this means for you** for consequences, a red box for limits and surprising boundaries.
- Code excerpts are condensed for display but never invented: real identifiers, the same shape, and a file and line citation in the code head.
- Panels that skip time keep the same scale and mark the break, so slope keeps its meaning.

## Figure sizing

Draw every figure at the width of the frame it sits in, so it prints at 1 : 1.
On US Letter with the template's margins: full frame 650 px, the cover plate column 495 px, a half-width frame about 318 px.
Text in figures is at least 9.5 px, which prints at 7.1 pt.
SVGs only shrink to fit, so a figure drawn too wide shows up in the gates as small labels.

## Gates

| Gate | Passes when |
| --- | --- |
| `check.spec.json` | no page overflow, nothing in the side margins, figure labels and text at least 7 pt, no overlapping or clipped figure labels, every marker expanded, no console errors |
| Every page inspected | you have read each rendered page image and fixed clipping, collisions between labels and data, crushed axes, ligatures or other glyph changes in code, and diagrams whose geometry implies something false |
| Numbers | each prose number either comes from `{{ trace… }}` or is listed in `checks.md` with the command that computed it |
| Answers | each answer is computed with the example or marked as reasoned |

Record in `checks.md` the pages you inspected and every defect you fixed or left.
