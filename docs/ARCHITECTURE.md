# N2N Post2Site Architecture

n2n-post2site is a local stdio MCP server. It is intentionally a thin bridge between an AI IDE client and a protected website publishing API.

## Layers

### Entry

`src/index.ts`

- Loads `CONTENT_API_BASE_URL` and `CONTENT_API_KEY`.
- Creates the MCP server.
- Connects through `StdioServerTransport`.

### Configuration

`src/config.ts`

- Requires `CONTENT_API_BASE_URL`.
- Requires `CONTENT_API_KEY`.
- Removes trailing slashes from the base URL.

### Server Assembly

`src/server.ts`

Registers 4 static resources:

- `post2site://capabilities`
- `post2site://site-context`
- `post2site://editorial-policy`
- `post2site://inventory/stats`

Registers 2 resource templates:

- `post2site://inventory/resources/{target_identifier}`
- `post2site://drafts/{draft_id}`

Registers 10 tools:

- `n2n_list_inventory`
- `n2n_check_duplicates`
- `n2n_validate_working_draft`
- `n2n_list_drafts`
- `n2n_create_draft`
- `n2n_update_draft`
- `n2n_validate_draft`
- `n2n_preview_draft`
- `n2n_upload_asset`
- `n2n_publish_draft`

Read-only site context, inventory stats, individual inventory resources, and individual drafts are resources, not tools.

### Tools

`src/tools/*.ts`

Tools only:

- Validate input with Zod.
- Call a `ContentClient` method.
- Wrap the backend response with `createJsonResult`.
- Add canonical resource URIs and MCP `resource_link` content blocks when returned data can be opened as a resource.

They do not handle host content rules, storage, publish policy, or review logic.

### Resources

`src/resources/*.ts`

Resources only:

- Read backend data without changing state.
- Return `application/json` resource contents.
- Enforce a 200 KiB JSON text limit for detail resources.
- Decode resource template variables once before calling the HTTP client.

### Client and Transport

`src/content-client.ts`

- Builds paths for the Post2Site publishing HTTP contract.
- Sends `X-API-KEY`.
- Converts non-2xx responses to readable errors.

`src/transport/http.ts`

- Wraps `fetch`.
- Parses JSON or text responses.

### Schemas

`src/schemas/blog-post.ts`

Defines MCP input shapes. `content_payload` is intentionally `record<string, unknown>` because host apps define fields through `/capabilities` and validate them on the backend.

## Request Flow

Typical publish flow:

1. AI reads discovery resources and calls inventory tools.
2. AI drafts locally in the chat/IDE.
3. AI calls `n2n_validate_working_draft` for non-persistent checks.
4. Draft is confirmed for remote saving.
5. AI calls `n2n_create_draft`.
6. Image is selected; AI calls `n2n_upload_asset`.
7. AI calls `n2n_update_draft` if the selected asset changes payload.
8. AI calls `n2n_validate_draft` and `n2n_preview_draft`.
9. Publish is explicitly confirmed.
10. AI calls `n2n_publish_draft`.

## Invariants

- No delete tools.
- No direct database, filesystem, shell, or deployment access.
- No backend-specific content fields in MCP core schemas.
- No server-managed lifecycle fields in MCP payloads.
- Publish is explicit and separate from draft create/update.
- No compatibility aliases for removed tools.
- The backend is the source of truth for validation, preview, publish, and public URLs.

## Tests

- `tests/server.test.ts`: tool/resource registration and resource-link behavior.
- `tests/client.test.ts`: HTTP path, header, and payload mapping.
- `tests/schema.test.ts`: MCP input schema behavior.
- `tests/transport.test.ts`: transport parsing and injected transport behavior.
- `scripts/check-dist-surface.mjs`: built output guard for the final MCP surface.
- `scripts/smoke-mcp.mjs`: protocol-level stdio smoke test against a local mock backend.
