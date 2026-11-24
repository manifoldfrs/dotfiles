# Pi UltraFast requests returning `service_tier: default`

Investigated 2026-10-17 using local authenticated requests, Ref, Exa, and X search.

## Finding

UltraFast requests produce a large, repeatable output-speed increase through this account's ChatGPT OAuth connection, despite OpenAI returning `service_tier: "default"`.
The mismatch reproduces without Pi, its SDK, or the local extension.
The evidence points to misleading response metadata on OpenAI's ChatGPT-token route, not the local extension dropping the requested tier.
OpenAI's internal routing and billing were not inspected, so this is a behavioral diagnosis rather than confirmation of an internal implementation bug.
No production configuration or extension change was necessary during this investigation.

## Reproduction and controls

The minimal test used Node's native `fetch` to `https://api.openai.com/v1/responses` with the existing ChatGPT OAuth bearer credential.
The credential stayed in process memory and was not printed or stored in the evidence.
The request followed the [ChatGPT OAuth inference contract](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference): array-valued `input`, `store: false`, and `stream: true`.
Reasoning was `medium` throughout.

A request with `service_tier: "ultrafast"` completed successfully but returned `service_tier: "default"`.
The reproduction exited nonzero when the returned tier differed from the requested tier.
That assertion detects the metadata mismatch; it is not proof that the requested speed was unavailable.

Control requests established that the endpoint reads and validates the field:

| Requested tier | HTTP result | Returned tier |
| --- | --- | --- |
| `default` | 200, completed | `default` |
| `priority` | 200, completed | `default` |
| `ultrafast` | 200, completed | `default` |
| `fast` | 400, `Unsupported service_tier: fast` | Not applicable |
| `definitely-invalid-tier` | 400, unsupported tier | Not applicable |

The documented public API accepts `fast` as an alias of `priority`, but this OAuth route rejected `fast` in the live test.
The local extension already sends `priority` for Fast, so that difference does not require a local fix.

An authenticated `GET /v1/models` advertised `priority` and `ultrafast` in `service_tiers` for both `gpt-6.1-sol` and `gpt-6-astra`.
Its `default_service_tier` was null for both models.
Catalog availability alone is not proof of actual service delivery.

## Output-speed experiment

Each request asked for the integers 1 through 180, comma-separated, without explanation.
Every output matched that literal sequence after removing whitespace.
Each direct-request response reported 542 non-reasoning output tokens.
Timing measured the interval from the first text delta to the last text delta, excluding time to first text.
The order was Standard, UltraFast, Fast, Fast, UltraFast, Standard to reduce a simple order or warming explanation.
There were two samples per mode and model.

| Model | Standard, tokens/s | Fast, tokens/s | UltraFast, tokens/s | Mean UltraFast / Standard |
| --- | --- | --- | --- | --- |
| GPT-6.1 Sol | 51, 51 | 74, 72 | 438, 394 | 8.22× |
| GPT-6 Astra | 75, 71 | 106, 107 | 570, 566 | 7.78× |

Ratios use the recorded generation durations and token counts, not the rounded tokens-per-second table cells.
Every response in this experiment still reported `service_tier: "default"`.
This strongly distinguishes a response-metadata problem from all three requested modes actually running at the same speed.
It does not establish a latency SLA or general coding-task speedup.

## Through the actual Pi CLI

A fresh Pi invocation selected `gpt-6.1-sol-ultrafast` without model or thinking overrides, using the saved default.
A separate invocation selected `gpt-6-astra-ultrafast` with medium thinking explicitly.
Both used the existing local speed-variant extension and the normal ChatGPT credential.
Optional tools, MCP, skills, context files, and unrelated extensions were disabled for the measurement.

| Selected model | Reported text tokens | Measured output tokens/s | Output correct | Returned tier |
| --- | --- | --- | --- | --- |
| `gpt-6.1-sol-ultrafast` | 542 | 265 | Yes | `default` |
| `gpt-6-astra-ultrafast` | 363 | 488 | Yes | `default` |

These single Pi samples are smoke checks, not a controlled comparison with the direct-request experiment.
Their token counts are the provider's reported output tokens minus reasoning tokens.
The earlier wire-level smoke tests also verified that Pi sent the upstream model IDs, `service_tier: "ultrafast"`, and `reasoning.effort: "medium"`.

## Documentation and X findings

- [OpenAI UltraFast guide](https://developers.openai.com/api/docs/guides/ultrafast-mode): request `gpt-6.1-sol` or `gpt-6-astra` with `service_tier: "ultrafast"`; HTTP and WebSockets are supported in the general API.
- [OpenAI Fast guide](https://developers.openai.com/api/docs/guides/fast-mode): says the response field identifies the processing tier, and documents `default` on downgraded Fast requests.
  Our controlled speed results conflict with treating that field as authoritative for this OAuth connection.
- [ChatGPT OAuth inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) and [preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations): document the public endpoint and the specialized request contract.
  They do not explain this response-tier mismatch.
- [Current published `@calesennett/pi-codex-fast` package](https://registry.npmjs.org/@calesennett/pi-codex-fast/latest), version 0.1.12 when inspected: also describes setting `service_tier: "ultrafast"` for Sol and Astra.
  Its current README does not substantiate an API-key-only restriction.
  Exa's GitHub result contained an older README, so the published package was used to resolve that discrepancy.
- [Max Jendrall's X report](https://x.com/maxjendrall/status/2111013934320804203) claims UltraFast works with Pi and Login with ChatGPT.
- [Beyang's X reply](https://x.com/beyang/status/2111135338832044069) reports contrary guidance from OpenAI and asks which extension was used.
  The inspected thread text supplies neither response-tier captures nor throughput measurements.
  X text was retrieved through xAI thread search; Exa could not fetch those posts directly.
  These anecdotes motivated the experiment but are not the basis for the result.

## Disposition and remaining limits

Keep the existing `openai/gpt-6.1-sol-ultrafast` default with medium thinking.
Do not rewrite incoming response metadata to claim a tier that OpenAI did not report.
Treat the selected alias as the requested tier and the response field as unreliable for confirming delivered speed on this tested OAuth path.

Confirmed: local request construction, direct reproduction, tier validation, account catalog advertising, repeatable speed differences, and successful Pi inference.
Not confirmed: OpenAI's internal cause, quota multipliers actually charged, API-key behavior, other accounts, or long-running workloads.
The legacy `openai-codex` provider had no configured credential and was not tested.
No API-key billing path was used, and no credentials were replaced or accounts reauthenticated.

Temporary executable probes were removed after testing.
Only this research note was added during the diagnosis.
