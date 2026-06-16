# Backend API Contract

This document defines the HTTP contract that a backend must implement to work with N2N Post2Site. The MCP server connects to this contract through `CONTENT_API_BASE_URL` and `CONTENT_API_KEY`.

## Required endpoints

All endpoints are relative to `CONTENT_API_BASE_URL`.

```http
GET    /capabilities
GET    /products/{content_scope}
GET    /posts
POST   /posts
GET    /posts/{id_or_slug}
PATCH  /posts/{id_or_slug}
POST   /posts/{id_or_slug}/publish
```

## `GET /capabilities`

Returns the publishing contract for AI clients, including:

- Supported content types.
- Supported statuses.
- Supported locales.
- Single-locale input fields.
- `content_scope` rules.
- Available product guide scopes.
- Safety boundaries.

The MCP server calls this endpoint before every create or update operation.

## `GET /products/{content_scope}`

Returns controlled product context before drafting product guides.

Expected response fields:

| Field | Description |
| --- | --- |
| `content_scope` | Confirms the valid product guide scope. |
| `canonical_url` | Product page for deeper reading, links, and citations. |
| `docs_url` | Docs or guide index to prefer for tutorials. |
| `summary` | Controlled product summary. |
| `key_points` | Controlled facts the assistant may rely on. |
| `do_not_claim` | Claims the assistant must not make. |

## `GET /posts`

Returns a list of existing posts. Supports filtering by `status`, `type`, `content_scope`, and a search query `q`.

For automated internal linking and search, each post in the list should include:

| Field | Description |
| --- | --- |
| `id` | Unique identifier. |
| `title` | Post title. |
| `slug` | Unique URL slug. |
| `link` | Required for AI auto-linking. Absolute public URL of the published post on the live website, so AI clients do not guess paths. |

## `GET /posts/{id_or_slug}`

Returns a single post by ID or slug. The MCP server calls this before updating a post or completing missing locales.

## `POST /posts` and `PATCH /posts/{id_or_slug}`

Create and update calls use one locale per request.

### Payload

```json
{
  "slug": "example-product-guide",
  "type": "guide",
  "content_scope": "product:example-product",
  "locale": "en",
  "title": "How to Use Example Product",
  "excerpt": "A short guide to using the example product.",
  "content": "## Overview\n\nMarkdown content..."
}
```

### Field rules

- `title` is plain text.
- `excerpt` is plain text.
- `content` is Markdown. Inline HTML is allowed when useful. Full HTML documents with `<html>`, `<head>`, or `<body>` are not allowed.
- Create and update payloads must not accept `status`, `published_at`, `user_id`, or `author`.
- Publishing state changes only through `POST /posts/{id_or_slug}/publish`.

### Response conventions

Backends may return `missing_locales` and `next_actions` after create, update, or publish. The MCP server will add missing language versions with additional update calls instead of asking the backend to auto-translate.

## `POST /posts/{id_or_slug}/publish`

Publishes an existing draft. Publishing state is managed exclusively through this endpoint, not through create or update payloads.

## Draft-specific MCP tools

`n2n_list_drafts` and `n2n_update_draft` do not require extra backend endpoints:

- `n2n_list_drafts` calls `GET /posts` with `status=draft`.
- `n2n_update_draft` calls `GET /posts/{id_or_slug}` first and refuses to continue unless the returned post has `status: "draft"`, then calls `PATCH /posts/{id_or_slug}`.

## Security requirements

- Use a site-scoped API key with the minimum permissions needed.
- Sanitize backend errors before returning them to the MCP client.
- Do not expose `user_id`, `author`, `published_at`, or other server-managed fields in create or update payloads.
- Keep path mapping and field mapping in the backend adapter, not in MCP client configuration.
