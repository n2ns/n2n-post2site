# Mock Post2Site Backend

A minimal zero-dependency backend implementing the Post2Site MCP publishing HTTP contract. It stores inventory, drafts, and assets in memory, so all data resets on restart.

## Run

```bash
API_KEY=demo-key PORT=8787 node server.mjs
```

## Configure n2n-post2site

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

## Demonstrates

- API-key auth through `X-API-KEY`.
- Discovery endpoints.
- Inventory and duplicate checks.
- Inventory detail reads for `post2site://inventory/resources/{target_identifier}`, including percent-encoded `/` values.
- Non-persistent working draft validation.
- Server draft create, update, validate, preview, and publish.
- Selected asset upload.
- Explicit publish confirmation through `publish_confirmed`.

For automated MCP surface verification, use the built-in protocol smoke test from the project root:

```bash
npm run smoke:mcp
```
