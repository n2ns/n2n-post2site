<p align="center">
  <img src="./assets/n2n-post2site-logo.png" width="128" alt="n2n-post2site logo">
</p>

# n2n-post2site

AI-assisted content publishing MCP server for blogs and product guides.

[![npm version](https://img.shields.io/npm/v/n2n-post2site)](https://www.npmjs.com/package/n2n-post2site)
[![npm total downloads](https://img.shields.io/npm/dt/n2n-post2site)](https://www.npmjs.com/package/n2n-post2site)
[![license](https://img.shields.io/github/license/n2ns/n2n-post2site)](https://github.com/n2ns/n2n-post2site/blob/main/LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-blue)](https://modelcontextprotocol.io)
[![node version](https://img.shields.io/node/v/n2n-post2site)](https://nodejs.org)
[![DataFrog.io](https://datafrog.io/badges/datafrog.svg)](https://datafrog.io)

---

> **Draft with AI. Publish with intent.**

n2n-post2site is an open-source Model Context Protocol (MCP) server that lets an AI assistant draft, edit, review, and publish website content through a narrow Content Publishing API Contract. It is a local MCP bridge between your IDE assistant and your website content API — intentionally small, with no database access, shell access, deployment access, payment access, or user administration access.

## 💡 What is n2n-post2site?

n2n-post2site gives AI coding assistants a structured path to draft and publish website content without exposing the database, file system, or deployment layer. Your backend implements the Content Publishing API Contract; the MCP server forwards AI tool calls to it.

Use it for blog posts, product guides, technical notes, release notes, and localized article drafts. It is not a CMS — no admin panel, no storage backend, no image uploads (v1), no deployment workflow.

## 📰 Publishing model

n2n-post2site works with two publishing spaces:

| Space | `content_scope` | Example |
|---|---|---|
| Company blog | omitted or empty | technical notes, announcements, changelogs |
| Product guide | `kind:key` | `product:evisa-helper` |

The backend defines which scopes are valid. A product guide should only be written after the assistant reads controlled product context with `n2n_get_product_context`.

The assistant should follow this workflow:

1. Call `n2n_get_capabilities`.
2. Search existing content with `n2n_list_posts`.
3. For product guides, call `n2n_get_product_context`.
4. Create or update one locale at a time.
5. Resume unfinished work with `n2n_list_drafts`, `n2n_get_post`, and `n2n_update_draft`.
6. Review the draft.
7. Publish only through `n2n_publish_post`.

## 🚀 Quick start

**Requirements**: Node.js 22+, an MCP-capable client, a site-scoped API key, and a backend that implements the [Content Publishing API Contract](./docs/BACKEND_API.md).

### 1. Configure your MCP client

Using the npm package:

```json
{
  "mcpServers": {
    "n2n-post2site": {
      "command": "npx",
      "args": ["-y", "n2n-post2site"],
      "env": {
        "CONTENT_API_BASE_URL": "https://your-site.com/api/v1/mcp",
        "CONTENT_API_KEY": "your-api-key"
      }
    }
  }
}
```

Using a local checkout:

```json
{
  "mcpServers": {
    "n2n-post2site": {
      "command": "node",
      "args": ["/path/to/n2n-post2site/dist/index.js"],
      "env": {
        "CONTENT_API_BASE_URL": "https://your-site.com/api/v1/mcp",
        "CONTENT_API_KEY": "your-api-key"
      }
    }
  }
}
```

- `CONTENT_API_BASE_URL`: base URL of your protected content API. Keep path and field mapping in the backend adapter.
- `CONTENT_API_KEY`: site-scoped API key. Do not put it in prompts, article content, or screenshots.

Bind one server instance to exactly one website.

## 🔗 Backend API contract

n2n-post2site connects to any backend that implements the Content Publishing API Contract. The contract defines the required endpoints, payload rules, and security requirements.

See **[Backend API Contract](./docs/BACKEND_API.md)** for the full specification.

## 🛠️ MCP tools

- **Discovery**: read backend capabilities, list existing posts, and load product context before drafting.
- **Drafting**: create posts, update posts one locale at a time, and resume unpublished drafts.
- **Publishing**: publish an approved draft through an explicit publish step.

See [Tools reference](./docs/TOOLS_REFERENCE.md) for parameter schemas and call examples.

## 📝 Content format

- Submit one locale per create or update call.
- Use Markdown for `content`.
- Use fenced code blocks for commands, JSON, YAML, and code examples.
- Use Markdown image syntax for images.
- Always include descriptive image alt text.
- Reference public image URLs or existing site paths.
- This MCP does not upload images in v1.

Image example:

```md
![Product dashboard showing content status](/images/guides/content-status.png)
```

## 🔐 Security and governance notes

n2n-post2site should not expose:

- Delete operations.
- Product configuration writes.
- Pricing plan writes.
- User administration.
- Payment or subscription administration.
- Database queries.
- Log access.
- Shell commands.
- Deployment or server operations.

Recommended backend behavior:

- Sanitize backend errors before returning them to the AI client.
- Use a site-scoped API key with the minimum permissions needed.
- Create drafts by default.
- Keep create/update and publish separate.
- Set `published_at` on the backend, not from MCP input.

## 📖 Related docs

- **[Backend API Contract](./docs/BACKEND_API.md)**: Endpoints, payload rules, and security requirements for backend implementors.
- **[Tools reference](./docs/TOOLS_REFERENCE.md)**: MCP tool parameter schemas and call examples.
- **[Roadmap](./ROADMAP.md)**: Planned features and what's coming next.
- **[Changelog](./CHANGELOG.md)**: Version history and release notes.
- **[Contributing](./CONTRIBUTING.md)**: How to report issues and contribute.
- **[Security](./SECURITY.md)**: How to report vulnerabilities.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built by [N2NS Lab](https://n2ns.com), the open-source lab of [datafrog.io](https://datafrog.io) for practical AI developer tools.
