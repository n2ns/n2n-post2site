<p align="center">
  <img src="./assets/n2n-post2site-logo.png" width="128" alt="n2n-post2site logo">
</p>

# n2n-post2site

Local MCP bridge for AI-assisted website publishing.

n2n-post2site lets an AI IDE client talk to a protected website content API without exposing a database, filesystem, shell, deployment process, payments, or account administration. It is a thin stdio MCP server: validate tool input, map it to HTTP, and return the backend response.

## Architecture

```text
AI IDE client
  -> MCP stdio
n2n-post2site
  -> HTTPS + X-API-KEY
website content API
  -> host adapter handles storage, policy, preview, publish
```

For Laravel sites, [`n2ns/laravel-post2site`](https://github.com/n2ns/laravel-post2site) is the first-party backend package for this contract.

## Workflow

The intended authoring loop is:

1. Read `post2site://capabilities`, `post2site://site-context`, and `post2site://editorial-policy`.
2. Inspect existing content with `n2n_list_inventory`, `post2site://inventory/stats`, and `n2n_check_duplicates`.
3. Draft locally in the chat/IDE. Use `n2n_validate_working_draft` for non-persistent backend validation.
4. After the draft is confirmed for remote saving, call `n2n_create_draft`.
5. Upload only the selected image with `n2n_upload_asset`, then update the draft if needed.
6. Validate and preview with `n2n_validate_draft` and `n2n_preview_draft`.
7. Publish only after explicit publish confirmation with `n2n_publish_draft`.

The MCP server does not define blog fields such as `type`, `topics`, `geo_tags`, `seo_keywords`, or `locales`. Those live inside the host-declared `content_payload` object and are validated by the backend.

## Quick Start

Requirements:

- Node.js 22+
- An MCP-capable IDE/client
- A backend implementing the Post2Site publishing HTTP contract
- A content API key

Using npm:

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

`CONTENT_API_BASE_URL` should point at the protected publishing API base, for example `https://your-site.example/api/v1/mcp`. Keep the API key out of prompts, screenshots, and article content.

## MCP Resources

Static resources:

- `post2site://capabilities`
- `post2site://site-context`
- `post2site://editorial-policy`
- `post2site://inventory/stats`

Resource templates:

- `post2site://inventory/resources/{target_identifier}`
- `post2site://drafts/{draft_id}`

List tools include canonical resource URIs and MCP `resource_link` blocks when returned rows can be opened as resources.

## MCP Tools

Inventory:

- `n2n_list_inventory`
- `n2n_check_duplicates`

Drafting:

- `n2n_validate_working_draft`
- `n2n_list_drafts`
- `n2n_create_draft`
- `n2n_update_draft`
- `n2n_validate_draft`
- `n2n_preview_draft`

Assets and publishing:

- `n2n_upload_asset`
- `n2n_publish_draft`

See [Resources Reference](./docs/RESOURCES_REFERENCE.md) and [Tools Reference](./docs/TOOLS_REFERENCE.md) for examples.

## Security Boundaries

n2n-post2site should not expose:

- Delete operations.
- Direct database queries.
- Filesystem writes.
- Shell commands.
- Deployment or server operations.
- Product, pricing, payment, subscription, or account administration.
- Server-managed lifecycle fields such as `published_at`, `author`, or host markers.

The backend is responsible for authentication, validation, preview rendering, publication, audit rules, and server-managed fields.

## Development

```bash
npm run build
npm test
npm run smoke:mcp
npm run check
```

`npm run check` runs build, unit tests, built-surface checks, and the MCP protocol smoke test.

## Related Docs

- [Backend API Contract](./docs/BACKEND_API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Resources Reference](./docs/RESOURCES_REFERENCE.md)
- [Tools Reference](./docs/TOOLS_REFERENCE.md)
- [Client Smoke Testing](./docs/CLIENT_SMOKE.md)
- [Mock Backend Example](./examples/mock-backend/README.md)
- [Roadmap](./ROADMAP.md)
- [Changelog](./CHANGELOG.md)
- [Security](./SECURITY.md)

## License

MIT
