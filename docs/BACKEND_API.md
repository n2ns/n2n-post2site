# Backend API Contract

The backend should support these endpoints relative to `CONTENT_API_BASE_URL`:

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

## `GET /products/{content_scope}`

Returns controlled product context before drafting product guides.

Expected fields:

- `content_scope`: confirms the valid product guide scope.
- `canonical_url`: product page for deeper reading, links, and citations.
- `docs_url`: docs or guide index to prefer for tutorials.
- `summary`: controlled product summary.
- `key_points`: controlled facts the assistant may rely on.
- `do_not_claim`: claims the assistant must not make.

## `GET /posts`

Returns a list of existing posts or guides. For automated internal linking and search, each post in the list should include:

- `id`: unique identifier.
- `title`: the post title.
- `slug`: unique URL slug.
- `link`: (Required for AI auto-linking) the absolute public URL of the published post on the live website. AI clients rely on this field to safely cross-link between articles without guessing paths.

## Create and update payloads

Create and update calls use one locale per request:

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

Rules:

- `title` is plain text.
- `excerpt` is plain text.
- `content` is Markdown.
- Inline HTML is allowed when useful.
- Full HTML documents with `<html>`, `<head>`, or `<body>` are not allowed.
- Create/update must not accept `status`, `published_at`, `user_id`, or `author`.
- Publishing state changes only through `/posts/{id_or_slug}/publish`.

Backends may return `missing_locales` and `next_actions` after create, update, or publish. The assistant should add missing language versions with additional `n2n_update_post` calls instead of asking the backend to auto-translate.

## Draft-specific MCP tools

`n2n_list_drafts` and `n2n_update_draft` do not require extra backend endpoints:

- `n2n_list_drafts` calls `GET /posts` with `status=draft`.
- `n2n_update_draft` calls `GET /posts/{id_or_slug}` first and refuses to continue unless the returned post has `status: "draft"`, then calls `PATCH /posts/{id_or_slug}`.
