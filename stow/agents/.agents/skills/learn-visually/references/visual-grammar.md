# Visual grammar

A lesson's visuals are a language: once a colour, shape, arrow, or position means something, it means that everywhere, in every mode.
Fix the grammar in `plan.md`'s legend before drawing anything, and show the legend to the reader before the first dynamic figure.

## Every mark carries meaning

Each line, shape, colour, glow, and motion must encode an entity, a state, a quantity, or a cause.
Delete marks that encode nothing: decorative dotted spheres, particle fields, gradient blobs, gratuitous glow, stock icons standing in for a missing idea.
When something looks empty without decoration, the figure is missing information, not ornament.

## Roles and tokens

Use these semantic roles; `templates/tokens.css` defines them for HTML and PDF, and `references/animation.md` maps them onto Psychopomp tones.

| Role | Token | Use for | Psychopomp tone |
| --- | --- | --- | --- |
| signal | `--signal` (blue) | requests, messages, anything that travels | request |
| ok | `--ok` (green) | accepted, success, a held invariant | success |
| fail | `--fail` (red) | rejected, error, a violated invariant, lost work | error |
| state | `--state` (amber) | stored quantities and resources: counters, buffers, tokens | warning |
| rule | `--rule` (violet) | configuration and limits: rates, capacities, thresholds | accent, sparingly |
| muted | `--muted` (grey) | context, time axes, inactive entities | muted |
| focus | `--focus` | the one thing to follow right now; at most one per view | accent |

A topic may rename the roles, for example "token" for state, but never gives two meanings to one colour.
Colour is never the only channel: pair it with a label, a shape, or a pattern such as hatching or dashes, so the figure survives greyscale printing and colour-vision differences.

## Shapes and lines

- One shape per kind of entity: rounded cards for actors and components, cylinders or bars for stored state, small dots for messages, a ring or meter for time budgets.
- Solid arrows for a call or a message, dashed for a reply or an asynchronous effect, dotted for observation or inference.
- Arrows into a store are writes; arrows out are reads.
- The arrow a figure is about is drawn heavier, with a bold label.

## Space

Give each axis a meaning and keep it: time flows left to right on timelines and top to bottom in sequence figures.
Identical entities keep identical positions across a lesson's figures, so the reader's eye returns to the same place.
Label diagrams that are not to scale "not to scale".

## Labels

- Label entities directly, on or beside the mark; avoid detached legends for fewer than about six items.
- Put state on the entity as a badge that changes, for example `tokens 2.6 / 4`, rather than in a separate table.
- Use numbered callouts tied to a key or a caption when a figure needs more than four annotations.
- Mark provenance in figure captions: *simulated from example/trace.json*, *measured on …*, or *illustrative*.

## The legend plate

Before the first dynamic figure, show a small static figure that names every colour, shape, and arrow used later, drawn with the real entities of the running example.
In the manual it is its own figure; in the interactive lesson it sits above the stage; in the animation it is the opening establishing shot with labels.

## Legibility floors

| Medium | Minimum |
| --- | --- |
| PDF at 100 % | 7 pt for figure labels, 9.5 pt for body text |
| HTML | 12 px for labels, 16 px for body text at 375 px wide |
| Video at 1080p | 22 px text height, caption on screen for at least 1.5 s and 0.3 s per word |
| Contrast | 4.5 : 1 for text, 3 : 1 for graphical marks that carry meaning |
