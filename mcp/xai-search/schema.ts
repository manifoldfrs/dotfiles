export const TOOL_NAME = 'xai_search'

export const TOOL_DESCRIPTION =
  'Search live X (Twitter) posts, the web, or both through Grok Build or the xAI Responses API. Exact date, handle, media, and domain filters require the API route.'

const handleList = (description: string) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, description: 'X handle, with or without a leading @' },
  minItems: 1,
  maxItems: 20,
  uniqueItems: true,
  description,
})

const domainList = (description: string) => ({
  type: 'array',
  items: { type: 'string', minLength: 1, description: 'Domain such as example.com' },
  minItems: 1,
  maxItems: 5,
  uniqueItems: true,
  description,
})

export const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 1, description: 'What to search for' },
    sources: {
      type: 'array',
      items: { enum: ['x', 'web'] },
      minItems: 1,
      maxItems: 2,
      uniqueItems: true,
      description: 'Where to search: ["x"] (default), ["web"], or ["x", "web"]',
    },
    allowed_domains: domainList('Web search only within these domains (maximum 5); needs web in sources'),
    excluded_domains: domainList('Leave these domains out of web search (maximum 5); needs web in sources'),
    model: { type: 'string', minLength: 1, description: 'xAI model override; uses the configured model when omitted' },
    from_date: { type: 'string', description: 'Inclusive start date, YYYY-MM-DD, from 00:00 UTC' },
    to_date: {
      type: 'string',
      description:
        'Exclusive end date, YYYY-MM-DD, UTC. Posts on this date are not included; to search one day, set to_date to the following day.',
    },
    allowed_x_handles: handleList('Only consider posts from these X handles (maximum 20)'),
    excluded_x_handles: handleList('Exclude posts from these X handles (maximum 20)'),
    enable_image_understanding: { type: 'boolean', description: 'Allow xAI to analyze images in X posts' },
    enable_video_understanding: { type: 'boolean', description: 'Allow xAI to analyze videos in X posts' },
    max_turns: { type: 'integer', minimum: 1, description: 'Maximum xAI assistant/tool-call turns for this search' },
    max_output_tokens: { type: 'integer', minimum: 1, description: 'Maximum output tokens for the final answer' },
  },
}
