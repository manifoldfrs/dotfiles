# Running example

`trace.json` is the single source of truth for every number, state, and transition shown in any mode.
Regenerate it with the generator script; never edit it by hand.

Required top-level fields:

```json
{
  "concept": "what is being taught",
  "provenance": "simulated | measured",
  "generator": "example/<script>",
  "model": "what the example implements, and which reference it follows",
  "units": { "time": "ms" },
  "scenarios": {
    "<id>": {
      "title": "one line",
      "params": {},
      "steps": [{ "i": 1, "...": "state before, event, decision, state after" }],
      "summary": {}
    }
  }
}
```

Each scenario is one storyboard beat or challenge.
Add series that renderers need, such as keyframes for a continuous quantity, as extra fields inside the scenario rather than computing them in a renderer.

Tests cover normal behavior, at least one boundary, and at least one counterexample, and check that the trace regenerates byte-identically.
When a reference implementation is available locally, a test replays the trace through it.
