# N2N WriteLane

AI-assisted content publishing MCP server for blogs and product guides.

[![npm version](https://img.shields.io/npm/v/n2n-writelane)](https://www.npmjs.com/package/n2n-writelane)
[![npm total downloads](https://img.shields.io/npm/dt/n2n-writelane)](https://www.npmjs.com/package/n2n-writelane)
[![license](https://img.shields.io/github/license/n2ns/n2n-writelane)](https://github.com/n2ns/n2n-writelane/blob/main/LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://modelcontextprotocol.io)
[![node version](https://img.shields.io/node/v/n2n-writelane)](https://nodejs.org)
[![DataFrog.io](https://datafrog.io/badges/datafrog.svg)](https://datafrog.io)

N2N WriteLane is a local Model Context Protocol server that lets AI assistants create, edit, and publish website articles through a configured content API. It is designed for Markdown-first content workflows where an AI coding assistant can help maintain blog posts, SEO articles, changelogs, and product guides without receiving database, shell, infrastructure, payment, or user administration access.

Use it when you want an AI assistant to work with website content through a narrow, auditable API contract instead of broad backend access.

This project is intentionally a small protocol bridge. It does not include a production CMS, database schema, admin panel, deployment scripts, or server operations. Your website remains responsible for authentication, validation, storage, preview, and publishing rules.

## What it is for

- AI content publishing through the Model Context Protocol.
- Blog automation for company articles, technical notes, announcements, and changelogs.
- Product guide publishing with Markdown content and explicit publish steps.
- Safe article editing through a configured content API.
- Repeatable content workflows for AI assistants in IDEs and local developer tools.

## What it exposes

- get backend publishing capabilities
- read product context for guide writing
- list articles
- get one article
- create draft
- update draft/article
- publish article

It does not expose product configuration, pricing plans, database queries, logs, users, shell commands, deployment, or delete operations.

## AI-readable publishing model

N2N WriteLane works with two common publishing spaces:

- Company blog posts use no `content_scope`.
- Product or collection guides use `content_scope` in kind:key format, for example `product:example-product`.

The AI assistant should submit one locale per create or update call. Treat `title` and `excerpt` as plain text strings, and `content` as a Markdown document string. Inline HTML is allowed when useful, but full HTML pages are not.

Before drafting new content, the AI assistant should search existing posts with `n2n_list_posts`. Before updating an existing post or completing missing locales, it should read the current post with `n2n_get_post`. Product guides should also read `n2n_get_product_context` before drafting.

## Requirements

- Node.js 22+
- A site-scoped content API token
- A backend content API that implements the Content Publishing API Contract

## Install for local development

```bash
npm install
npm run build
```

## Configuration

Set these environment variables in your MCP client config:

```env
CONTENT_API_BASE_URL=https://example.com/api/v1/mcp
CONTENT_API_KEY=change-me
```

`CONTENT_API_BASE_URL` is the base URL of your protected content API.

The backend must expose `/capabilities` and article operations under `/posts` relative to `CONTENT_API_BASE_URL`. Keep path and field mapping in the backend adapter, not in the MCP client config.

Do not put API keys in prompts or article content. Keep secrets in the MCP client environment.

## MCP client example

Use a wrapper command or an installed package path for real multi-machine use. Avoid hard-coded absolute paths when switching between Windows, WSL, and SSH hosts.

```json
{
  "mcpServers": {
    "example-content": {
      "command": "node",
      "args": ["/path/to/n2n-writelane/dist/index.js"],
      "env": {
        "CONTENT_API_BASE_URL": "https://example.com/api/v1/mcp",
        "CONTENT_API_KEY": "change-me"
      }
    }
  }
}
```

One MCP server configuration should bind to exactly one site. Do not make the AI choose a `site_id` in tool arguments.

## Content Publishing API Contract

The configured backend should support these endpoints relative to `CONTENT_API_BASE_URL`:

```http
GET    /capabilities
GET    /products/{content_scope}
GET    /posts
POST   /posts
GET    /posts/{id_or_slug}
PATCH  /posts/{id_or_slug}
POST   /posts/{id_or_slug}/publish
```

`GET /capabilities` should describe supported content types, statuses, locales, single-locale input fields, content_scope rules, and available product guide scopes. AI clients should call this endpoint before creating or updating content.

`GET /products/{content_scope}` should return a controlled product fact sheet for product guide writing. The response should include `content_scope`, `canonical_url`, `docs_url`, `summary`, `key_points`, and `do_not_claim`. The AI assistant should use this as the primary source of product facts before drafting a guide.

The MCP uses `content_scope` in tool inputs and sends it as `content_scope` in API requests. Treat `content_scope` as the canonical publishing space in kind:key format, such as product:example-product, project:example-project, or collection:example-collection.

Backends may return `missing_locales` and `next_actions` after create, update, or publish. When they do, the AI assistant should add missing language versions with additional `n2n_update_post` calls instead of asking the backend to auto-translate.

Create and update calls must not accept publication governance fields such as `status`, `published_at`, `user_id`, or `author`. Publishing is allowed, but only through the explicit `n2n_publish_post` tool. The backend is responsible for setting `published_at`.

## Tools

### `n2n_get_capabilities`

Read the backend Content Publishing API Contract before creating or updating content.

```json
{}
```

### `n2n_list_posts`

Search and list existing company blog posts or product/collection guide articles before drafting new content.

Useful filters:

```json
{
  "status": "draft",
  "type": "guide",
  "content_scope": "product:example-product",
  "q": "error explanation",
  "per_page": 20
}
```

The `status` field above is only a list filter. Do not send `status` or `published_at` in create or update calls.

Use `content_scope: ""` to list unscoped company blog posts when the backend supports that convention.

### `n2n_get_post`

Read a post before updating it, completing missing locales, or writing a follow-up that depends on previous content.

```json
{
  "id_or_slug": "example-guide"
}
```

### `n2n_get_product_context`

Read this before creating or updating a product guide.

```json
{
  "content_scope": "product:example-product"
}
```

Expected backend fields:

- `content_scope`: confirms the product guide scope.
- `canonical_url`: product page for deeper reading, links, and citations.
- `docs_url`: docs or guide index to prefer for tutorial content.
- `summary`: controlled product summary.
- `key_points`: controlled facts the article may rely on.
- `do_not_claim`: marketing and factual boundaries the article must not cross.

### `n2n_create_post`

Creates a draft by default. Publishing is a separate tool call.

Before creating new content, call `n2n_list_posts` with a relevant search query or `content_scope` to avoid duplicating an existing article.

For product guides, call `n2n_get_product_context` first and follow its `canonical_url`, `docs_url`, `summary`, `key_points`, and `do_not_claim`.

Guide example:

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

Company blog example:

```json
{
  "slug": "content-workflow-notes",
  "type": "technical",
  "locale": "en",
  "title": "Content Workflow Notes",
  "content": "## Notes\n\nMarkdown content..."
}
```

### `n2n_update_post`

Call `n2n_get_post` first so the edit preserves the existing article structure, metadata, and already completed locale content.

```json
{
  "id_or_slug": "example-product-guide",
  "locale": "de",
  "title": "So verwenden Sie Example Product",
  "excerpt": "A localized summary for the selected locale.",
  "content": "## Ueberblick\n\nLocalized Markdown content..."
}
```

### `n2n_publish_post`

Publishes an existing draft. This is the only MCP tool that should change publication state.

```json
{
  "id_or_slug": "example-product-guide"
}
```

## Content format rules

- Submit one locale per create or update call.
- `content` must be a Markdown document string for the selected locale.
- Markdown may include inline HTML or small HTML blocks when useful.
- Do not send complete HTML documents with `<html>`, `<head>`, or `<body>`.
- Use Markdown image syntax for images.
- Always include descriptive image alt text.
- This MCP does not upload images in v1. Reference public URLs or existing site paths.
- `title` must be plain text.
- `excerpt` must be a plain text summary.

Image example:

```md
![Product dashboard showing content status](/images/guides/content-status.png)
```

## Safety boundaries

- One MCP endpoint should bind to one site.
- Use a site-scoped API token with the minimum permissions needed.
- Prefer draft creation and explicit publish calls.
- Keep create/update and publish separate.
- Do not expose delete operations through this MCP.
- Do not expose database queries or server operations through this MCP.
- Do not pass site selection as a tool argument.
- Backend errors should be sanitized before being returned to the AI client.

## Future backend package direction

A Laravel package can implement the HTTP side of this contract for multiple Laravel sites without copying controllers between projects. The MCP server should remain a generic client of that contract.

## About N2NS Lab

Built by N2NS Lab, short for Next-to-Native Systems Lab, Datafrog's open-source lab for AI-native developer tools.

Learn more: https://n2ns.com

Source repository: git@github.com:n2ns/n2n-writelane.git
