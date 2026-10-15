# xai-search

Guarded local variant of [`@zhenhuang/pi-xai-search`](https://github.com/ZhenHuangLab/pi-extensions/tree/main/packages/pi-xai-search) 0.2.2, under the upstream MIT license in `LICENSE`.
It registers the `xai_search` tool and a `/xai-search` status command.
Do not also install the upstream package, because it would register a second, unguarded `xai_search` tool.

## Billing switch

Search is off by default.
Whether X search over the SuperGrok or X Premium sign-in draws on the included subscription allowance or on paid API usage is unverified.
While search is off, the tool never resolves, refreshes, or sends a credential.
After verifying billing, enable it in the untracked `~/.pi/agent/pi-xai-search.json`:

```json
{
  "enabled": true,
  "model": "grok-4.5"
}
```

Only a literal `true` enables search.
The file is read on every call, so no reload is needed.
`model` is optional and defaults to `grok-4.5`.

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
`index.test.ts` loads the entry through the jiti and typebox bundled with the installed `pi`, with Pi's own API stubbed, so it needs `pi` on `PATH`.
