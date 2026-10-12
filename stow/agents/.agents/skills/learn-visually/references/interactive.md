# Interactive mode

A single self-contained HTML file: inline SVG, plain JavaScript, no framework, no network, no backend.
The reader steps through the running example, commits to predictions before results appear, changes inputs in a lab, and diagnoses a bug.

## Build

1. Copy `templates/tokens.css`, `templates/interactive/lesson.css`, `runtime.js`, and `index.src.html` into `<lesson>/interactive/`.
2. Fill the beats from `plan.md` in storyboard order: problem, mental model with the legend, worked example, lab, debug challenge, application, break points, sources.
3. Inline the model module from `example/` with `/* @inline ../example/<model>.mjs */` and the trace with `/* @json ../example/trace.json */`.
   The page computes nothing the trace already holds; the lab calls the same model functions the tests call.
4. Build: `bun <skill>/scripts/inline.ts interactive/index.src.html interactive/index.html`.

## Required parts

| Part | Contract |
| --- | --- |
| Outcomes and provenance | At the top: what the reader will be able to do, and where the numbers come from. |
| Legend | Before the first dynamic figure, using the plan's legend. |
| Stepper | `createStepper` with step, back, play or pause, reset, and speed; keys `→`, `←`, `P`, `R`. |
| State inspector | Shows the state before and after the current step, read from the trace. |
| Predictions | At least two gated predictions in the stepper: the result is hidden until the reader answers, then explained in one or two sentences that cite visible state. |
| Lab | Parameter controls and free-form input that rerun the model live, with a one-line summary; invalid input shows an inline error. A "run it yourself" block gives the commands for `example/`. |
| Debug challenge | Realistic buggy code and its symptom; the reader picks the cause; the correct and buggy traces then appear side by side in the same grammar. |
| Transfer | One question about a situation the worked example did not show. |
| Break points and sources | A table of simplifications and what is true instead, then the source list. |

## Figure rules

- Size each SVG's `viewBox` from the element's rendered width, so 12 px labels stay 12 px on a phone.
- Keep one time scale inside a chart; zoom with a focus window plus a compact overview, never with a non-linear axis, so slope keeps its meaning.
- Clip data lines to the plot area.
- Stack markers that land on the same pixel rather than hiding them.
- Colour SVG text with the `fill` attribute; the stylesheet only sets ink for text without one.
- Animate with the `.tween` class so `prefers-reduced-motion: reduce` turns motion off.

## Accessibility

- Every control is a native `button`, `input`, or `select` with a visible or `aria-label` name.
- A polite live region announces step changes and prediction prompts.
- Focus moves to the prediction choices when a gate opens and back to Step after the reveal.
- Status is never colour alone: allowed and rejected also differ in shape and text.

## Gates

Write `interactive/check.spec.json` for `scripts/chrome.ts`.
The spec format is a list of steps: `click`, `press`, `fill` with `value`, `focus`, `tab`, `wait`, `eval` with optional `expect` and `label`, `screenshot`, `capture` with `as` (an element screenshot), `reducedMotion`, and `colorScheme`.
`steps` run at the first width; `perWidth` runs at every other width.

```bash
bun <skill>/scripts/chrome.ts check interactive/index.html --spec interactive/check.spec.json --out checks/interactive
```

| Gate | Passes when |
| --- | --- |
| Every control | each button, input, key binding, and prediction choice has a spec step and an `expect` on its effect |
| Prediction gates | the result is hidden before answering and the explanation appears after |
| Lab | at least one normal input, one boundary input, and one invalid input are checked against model output |
| Console | no console errors or uncaught exceptions |
| Audit | accessible names, no horizontal overflow, and no clipped text at 375, 768, and 1280 px |
| Reduced motion | animated elements exist and their transition duration is `0s` under `reduce` |
| Visual review | you have read element captures of every beat at 375 and 1280 px, in dark and light colour schemes, and fixed overlaps, clipped labels, crushed axes, and colours that break the legend |
| Self-contained | no `script[src]` or `link[href]` remains |

Record each gate in `checks.md` with the report line or the capture paths you inspected.
