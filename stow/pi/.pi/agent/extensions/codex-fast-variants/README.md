# OpenAI and Codex Fast Variants

Adds selectable `-fast` variants to Pi's current `openai` provider and its legacy `openai-codex` provider.
Requires Pi 1.0 or newer.

## Current OpenAI provider

For a ChatGPT subscription, run `/login openai` and choose **Sign in with ChatGPT**.
Select `gpt-6.1-sol-fast` under `openai` through `/model`.
Press `Ctrl+S` in the picker to save it as the default.
OpenAI API-key authentication remains available too.

The extension preserves the native provider's authentication, ordinary models, classifiers, and credential-specific classifier filtering.
It adds `-fast` variants for Sol, Astra, and Luna chat models in the GPT-6 and GPT-6.1 families, without querying the legacy Codex endpoint or parsing the current OAuth token as a Codex JWT.
Pi spells the GPT-6.0 model IDs as `gpt-6-*`.
Only models present in Pi's built-in chat catalog are added; missing GPT-6.1 models appear automatically when that catalog includes them.
The separate Luna classifier is unchanged.
These are opt-in priority requests, not account-specific guarantees of priority availability.
OpenAI may reject unsupported models or tiers; usage and pricing follow OpenAI's rules.

Each Fast variant sends the real upstream model ID and `service_tier: "priority"` to the OpenAI Responses API.
The wrapper covers ordinary turns, direct streaming, compaction, and branch summaries while preserving caller request hooks and model overrides.
Replies retain the selected `-fast` ID so resumed sessions keep Fast selected.
It does not send the Codex-specific routing header to the OpenAI API.

## Legacy Codex provider

The extension preserves Pi's normal Codex models and OAuth authentication.
During model refresh it:

1. reads the latest official Codex version from the npm registry;
2. requests the account-specific Codex model catalog from `chatgpt.com`;
3. detects `priority` service-tier support, including legacy `fast` metadata;
4. intersects those results with Pi's built-in Codex catalog; and
5. publishes `<model>-fast` variants as a cached dynamic model overlay.

Selecting a legacy Fast variant sends the real upstream model ID with:

```json
{
  "service_tier": "priority"
}
```

It also sends the official Codex routing hint:

```text
x-codex-routing-hint: model=<model>;tier=priority
```

The extension does not install or execute Codex.
It makes an unauthenticated metadata request to `registry.npmjs.org/@openai/codex/latest` because the Codex catalog filters models by client version.
Legacy Codex OAuth tokens are sent only to the ChatGPT Codex backend.

Previously cached legacy Fast variants remain available when version or catalog discovery fails.
On a first-run discovery failure, the normal legacy catalog remains available without Fast variants.
Current OpenAI variants do not depend on this discovery.

## Development

With development dependencies and the Pi packages available:

```bash
cd stow/pi/.pi/agent/extensions/codex-fast-variants
npm run check
```

The TypeScript configuration is self-contained.
Reload Pi with `/reload` after reviewing and approving the tracked changes.
