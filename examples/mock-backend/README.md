# Mock content backend

A minimal, zero-dependency reference backend that implements the
[Content Publishing API Contract](../../docs/BACKEND_API.md). Use it to try
n2n-post2site end to end without wiring up a real website — **for local testing only**.

## Run

```bash
API_KEY=demo-key PORT=8787 node server.mjs
```

It stores posts in memory (reset on restart) and seeds one published note.

## Point the MCP server at it

```json
{
  "mcpServers": {
    "n2n-post2site": {
      "command": "npx",
      "args": ["-y", "n2n-post2site"],
      "env": {
        "CONTENT_API_BASE_URL": "http://127.0.0.1:8787",
        "CONTENT_API_KEY": "demo-key"
      }
    }
  }
}
```

Then ask your assistant to call `n2n_get_capabilities` — it should return the
mock contract, after which you can list, draft, and publish posts.

## What it demonstrates

- API-key auth via `X-API-KEY` / `Authorization: Bearer`.
- All seven contract endpoints.
- `content_scope` rules: `guide` requires a scope, `note` forbids one.
- Rejection of server-managed fields (`status`, `published_at`, `user_id`, `author`).
- Drafts created via `POST /posts`; publishing only via `POST /posts/{id}/publish`.
- `missing_locales` returned after create/update.
