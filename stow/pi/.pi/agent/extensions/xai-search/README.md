# xai-search

Guarded local variant of [`@zhenhuang/pi-xai-search`](https://github.com/ZhenHuangLab/pi-extensions/tree/main/packages/pi-xai-search) 0.2.2, under the upstream MIT license in `LICENSE`.
It registers the `xai_search` tool and a `/xai-search` status command.
Do not also install the upstream package, because it would register a second, unguarded `xai_search` tool.

## Configuration

Search works as soon as Pi has the subscription sign-in.
The optional, untracked `~/.pi/agent/pi-xai-search.json` selects the model:

```json
{
  "model": "grok-4.5"
}
```

`model` defaults to `grok-4.5`, and other keys are ignored.
The file is read on every call, so no reload is needed.

Each call can also set `max_turns` to cap xAI's server-side tool turns and `max_output_tokens` to cap the final answer.
Both are sent only when provided.

## Noninteractive runner

`run-xai-search.ts` runs one search without a Pi session or a main model, for scheduled digests.
Each run loads `index.ts` fresh through the jiti and Pi package bundled with the installed `pi`, then calls the registered `xai_search` execute.
It always sends `max_turns: 4`, `max_output_tokens: 3000`, and image and video understanding off, and rejects a params file that asks for anything looser.

```bash
node run-xai-search.ts --schema
node run-xai-search.ts --check
node run-xai-search.ts --dry-run --params digest.json
node run-xai-search.ts --params digest.json --out result.json
```

The runner finds `pi` by searching `PATH` without starting a shell, and needs Node with native TypeScript support.
On this Mac, run it with an explicit minimal environment so scheduled runs do not depend on shell startup:

```bash
env -i HOME="$HOME" PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/bin:/bin" \
  /opt/homebrew/bin/node run-xai-search.ts --params digest.json --out result.json
```

- `--schema` prints the loaded tool's parameter names and fails if the limit parameters are missing.
- `--check` reports whether Pi's stored xAI sign-in passes the provider and OAuth checks, without resolving the token or using the network.
- `--dry-run` runs the registered execute with placeholder auth and a capturing `fetch`, printing the exact request body without a live request.
- `--interactive` accepts the native Pi tool parameters, including image/video understanding and caller-selected limits, instead of imposing the scheduled-run defaults.
  Claude Code's X-search adapter uses this mode.
  All authentication, endpoint, and parameter-validation guards still apply.
  It can be combined with `--dry-run`; scheduled calls should omit it.
- Without a mode flag, the runner resolves the stored OAuth sign-in through Pi and makes one live request, printing the answer and usage counters as JSON.

The params file holds the tool parameters, for example:

```json
{
  "query": "Most important AI developer-tool releases and engineering posts",
  "from_date": "2026-10-14",
  "to_date": "2026-10-16"
}
```

## Authentication guards

The extension uses only Pi's built-in `xai` provider with a stored subscription OAuth sign-in from `/login xai`.
It rejects the request before contacting xAI when any of these hold:

- An extension has registered or reconfigured the `xai` provider.
- The provider base URL is anything other than `https://api.x.ai/v1`, including a `models.json` override.
- The provider does not offer subscription OAuth.
- Pi's auth status source is anything other than `stored`, such as `environment`, `runtime`, or a `models.json` key.
- Credential resolution reports any source other than `OAuth`, which excludes stored API keys and `XAI_API_KEY`.
- The resolved auth carries a different base URL.

Credential resolution errors are replaced with a generic message so token detail cannot leak.
Requests go only to the fixed `https://api.x.ai/v1/responses` URL with `redirect: "error"`, and configured provider headers are not forwarded.
Model discovery (`GET /models`) from the upstream configuration UI is removed, so search is the only credentialed route.

## Date contract

`from_date` is inclusive from 00:00 UTC.
`to_date` is exclusive, matching [xAI's X Search docs](https://docs.x.ai/developers/tools/x-search), and is sent unchanged.
To search one day, set `to_date` to the following day.
`from_date` must be strictly before `to_date`, so an equal pair fails instead of silently returning nothing.
Upstream documents `to_date` as inclusive but sends it unchanged, which drops the final day.

## Usage reporting

The tool reports `x_search_calls`, `x_posts_fetched`, and `x_users_fetched` from `usage.server_side_tool_usage_details`.
Counters xAI does not return are left out rather than shown as zero.

## Tests

```bash
node --test ./*.test.ts
```

The tests use mocked registries and `fetch` and make no network calls.
`index.test.ts` and `xai-runner.test.ts` load the entry through the jiti and typebox bundled with the installed `pi`, with Pi's own API stubbed, so they need `pi` on `PATH`.
