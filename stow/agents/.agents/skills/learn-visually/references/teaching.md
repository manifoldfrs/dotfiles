# Teaching

How a lesson builds a mental model the reader can run.
Each rule names the evidence behind it, so it can be weighed against the topic in front of you.

## The reader

An experienced engineer, new to this concept.
They read code fluently, so a code excerpt is often clearer than a paragraph.
They distrust hand-waving, so show the real mechanism and say where a picture simplifies it.
They learn by poking at things, so every lesson gives them something to change and observe.

## Outcomes before content

Write what the reader can do afterward, then build only what serves those outcomes.

- **Explain:** state the mechanism in their own words, including why it is shaped that way.
- **Predict:** given new inputs, say what happens before running it.
- **Debug:** from a symptom, find the cause.
- **Build:** choose parameters or write the core of it.

Depth sets how far each outcome goes:

| Depth | Scope | Interactive | Manual | Animation |
| --- | --- | --- | --- | --- |
| `glance` | the core idea and one example | 1 stage, 2 predictions | 2–4 pages | 45–75 s |
| `working` | mechanism, edge cases, how to apply | 3–5 stages, lab | 6–14 pages | 1.5–3 min |
| `deep` | internals, variants, failure modes, tuning | full lab, several challenges | 15–40 pages | 3–6 min, segmented |

Pick a length from the concept's content, not from the table's upper bound.

## The running example

One scenario carries the whole lesson.
The reader learns the scenario once and then spends attention on the mechanism, not on new setups.

- Small enough to trace by hand: a handful of entities and fewer than about 20 steps.
- Rich enough to reach the interesting behavior: the scenario must hit the edge case the storyboard needs.
- Real numbers: pick parameters a practitioner would recognize, then keep them fixed everywhere.
- Executable: the example program produces the trace; nothing shown is computed by hand.

When the topic is a repository or paper, the running example is a real input through the real code or the paper's own worked example, with `path:line` or section citations.

## Storyboard

**Problem → mental model → worked example → edge case → application.**

1. **Problem:** the situation that makes the concept necessary, ideally the failure of the obvious approach.
2. **Mental model:** the few moving parts and the one rule that governs them, introduced with the legend.
3. **Worked example:** the trace, step by step, with state visible at every step.
4. **Edge case:** the boundary where intuition breaks; show it through the same example with one input changed.
5. **Application:** a decision the reader will face in real work, using what they now know.

One idea per beat.
When a beat needs two ideas, split it.

## Prediction

Ask the reader to commit to an answer before showing the result.
Predicting first improves what is learned from a demonstration compared with only watching it (Crouch, Fagen, Callan & Mazur, "Classroom demonstrations: Learning tools or entertainment?", *American Journal of Physics* 72, 2004).

- Ask about something the mechanism decides, not a fact to recall: "Is request 6 allowed?" beats "What is the burst size?".
- Offer a small fixed choice or a number, so the reader commits quickly.
- After the reveal, explain why in one or two sentences that reference the visible state.
- Place at least one prediction where the intuitive answer is wrong.

## Worked examples, then fading

Novices learn more from studying worked examples than from solving equivalent problems, and the advantage fades as expertise grows (Sweller & Cooper 1985; Kalyuga et al., "The expertise reversal effect", 2003).
For an expert in a new domain: show one fully worked trace, then hand over progressively more of the work through predictions, the lab, and the debug challenge.

## Debug challenge

Give a plausible, realistic bug with its symptom, and let the reader find the cause.
Prefer bugs that appear in real implementations: lost precision, a missing bound, state updated on the wrong path, an off-by-one boundary.
Show the buggy trace beside the correct one in the same visual grammar, so the difference is spatial.

## Transfer

End with a case the worked example did not show: different parameters, a different domain, or a variant of the mechanism.
The reader should answer it from the model, not by pattern-matching the example.

## Break points

Every model simplifies.
For each simplification and analogy, state where it stops being accurate and what is true instead.
Typical break points: discrete versus continuous time, single-node versus distributed, ideal versus real clocks, the default configuration versus a common variant, a library's choice that differs from the textbook.

## Multimedia rules

These follow Richard Mayer's multimedia learning principles (*Multimedia Learning*, 3rd ed., 2020).

- **Coherence:** remove decoration that carries no meaning; extra material lowers learning.
- **Signaling:** highlight the one thing to follow.
- **Spatial contiguity:** put a label on or beside what it names, and a figure beside the paragraph that explains it.
- **Temporal contiguity:** in animation, a caption or narration lands with the motion it describes.
- **Segmenting:** let the reader control the pace; step and pause beat autoplay.
- **Pre-training:** introduce the parts and their names before the dynamics.

## Explorable explanations

The interactive mode follows Bret Victor's "Explorable Explanations" (2011): the reader changes an input and sees every consequence update in place, so claims become things to test rather than to accept.
