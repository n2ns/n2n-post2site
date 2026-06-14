# N2N WriteLane

AI-assisted content publishing MCP server for blogs and product guides.

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

The AI assistant should treat `title` and `excerpt` values as plain text, and `content` values as Markdown document strings. Inline HTML is allowed when useful, but full HTML pages are not.

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
GET    /posts
POST   /posts
GET    /posts/{id_or_slug}
PATCH  /posts/{id_or_slug}
POST   /posts/{id_or_slug}/publish
```

`GET /capabilities` should describe supported content types, statuses, locales, localized field formats, content_scope rules, and available product guide scopes. AI clients should call this endpoint before creating or updating content.

The MCP uses `content_scope` in tool inputs and sends it as `content_scope` in API requests. Treat `content_scope` as the canonical publishing space in kind:key format, such as product:example-product, project:example-project, or collection:example-collection.

## Tools

### `n2n_get_capabilities`

Read the backend Content Publishing API Contract before creating or updating content.

```json
{}
```

### `n2n_list_posts`

List company blog posts or product/collection guide articles.

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

Use `content_scope: ""` to list unscoped company blog posts when the backend supports that convention.

### `n2n_get_post`

```json
{
  "id_or_slug": "example-guide"
}
```

### `n2n_create_post`

Creates a draft by default. Publishing is a separate tool call.

Guide example:

```json
{
  "slug": "example-product-guide",
  "type": "guide",
  "content_scope": "product:example-product",
  "title": {
    "en": "How to Use Example Product",
    "zh_CN": "如何使用示例产品"
  },
  "excerpt": {
    "en": "A short guide to using the example product.",
    "zh_CN": "使用示例产品的简短指南。"
  },
  "content": {
    "en": "## Overview\n\nMarkdown content...",
    "zh_CN": "## 概览\n\nMarkdown 中文内容..."
  }
}
```

Company blog example:

```json
{
  "slug": "content-workflow-notes",
  "type": "technical",
  "title": {
    "en": "Content Workflow Notes"
  },
  "content": {
    "en": "## Notes\n\nMarkdown content..."
  }
}
```

### `n2n_update_post`

```json
{
  "id_or_slug": "example-product-guide",
  "content": {
    "en": "## Updated\n\nMarkdown content..."
  }
}
```

### `n2n_publish_post`

```json
{
  "id_or_slug": "example-product-guide"
}
```

## Content format rules

- `content.*` values must be Markdown document strings.
- Markdown may include inline HTML or small HTML blocks when useful.
- Do not send complete HTML documents with `<html>`, `<head>`, or `<body>`.
- Use Markdown image syntax for images.
- Always include descriptive image alt text.
- This MCP does not upload images in v1. Reference public URLs or existing site paths.
- `title.*` values must be plain text.
- `excerpt.*` values must be plain text summaries.

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
