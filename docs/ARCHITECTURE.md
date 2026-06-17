# N2N Post2Site Architecture

This document describes the current architecture of `n2n-post2site`. The goal is to keep boundaries clear, preserve interface compatibility, and give future changes stable extension points.

## 1. What it is

`n2n-post2site` is an MCP server. It:

- Loads environment configuration and creates an MCP server instance.
- Exposes nine content publishing tools to MCP clients.
- Translates tool arguments into HTTP calls against a backend content API.
- Wraps backend responses into MCP-displayable text.

It does not own persistence, authorization, review policy, or content-ranking decisions. Those belong to the backend API provider.

## 2. Layers

### 2.1 Entry (`src/index.ts`)

- Creates the server via `createServer(loadConfig())`.
- Connects to the MCP client over `StdioServerTransport`.
- Owns only process lifecycle and failure output.

### 2.2 Configuration (`src/config.ts`)

- Reads `CONTENT_API_BASE_URL` and `CONTENT_API_KEY`.
- Fails fast on missing values.
- Normalizes trailing slashes on `CONTENT_API_BASE_URL`.

### 2.3 Assembly (`src/server.ts`)

Build-and-register only:

1. Construct `ContentClient`.
2. Create `McpServer`.
3. Register the nine tools, in order:

- `n2n_get_capabilities`
- `n2n_list_posts`
- `n2n_list_drafts`
- `n2n_get_post`
- `n2n_get_scope_context`
- `n2n_create_post`
- `n2n_update_post`
- `n2n_update_draft`
- `n2n_publish_post`

### 2.4 Tools (`src/tools/*.ts`)

Each file is one MCP tool:

- Validate input (Zod schema + lightweight assertions).
- Call the matching `ContentClient` method.
- Return a uniform `text` result.

Tools do not deal with low-level HTTP, headers, JSON parsing, or path building.

### 2.5 Transport and client

- `src/transport/http.ts` — the `HttpTransport` interface and the default `FetchHttpTransport` wrapping `fetch`; handles response parsing (JSON/text) and status passthrough.
- `src/content-client.ts` — builds paths and HTTP methods, injects auth headers (`X-API-KEY` / `Authorization`), turns non-2xx responses into errors, assembles list and route parameters, and implements the `updateDraft` flow:
  1. `GET /posts/{id_or_slug}`
  2. require `status === 'draft'`
  3. then `PATCH /posts/{id_or_slug}`

### 2.6 Schemas and validation (`src/schemas/blog-post.ts`)

- Zod schemas define every tool's input.
- `type` and `locale` are free strings; the backend is the source of truth for supported values (discoverable via `n2n_get_capabilities`).
- `assertContentScopeFormat` performs a contract-level format check only: when present, `content_scope` must be `kind:key`. Whether a scope is *required* or *prohibited* for a given type is decided and enforced by the backend (`capabilities.content.content_scope.required_for_types`).

### 2.7 Output (`src/result.ts`)

- `createTextResult` wraps any backend payload into MCP `content: [{ type: 'text', text: ... }]`, keeping all tools' return shape consistent.

## 3. Request flow

Typical call (`n2n_create_post`):

1. The tool receives arguments.
2. Zod schema validation + assertions.
3. `ContentClient.createPost` is called.
4. `ContentClient` builds the request and sends it via `HttpTransport.request`.
5. The response body is parsed and returned.
6. The tool wraps it with `createTextResult` for the MCP client.

## 4. Key invariants

- Tool contract is stable (nine tools, names, argument semantics).
- Backend contract is stable (see `docs/BACKEND_API.md`).
- CLI/deploy entry is stable (`bin` points to `dist/index.js`).
- Fail-fast error behavior: missing config or invalid arguments error immediately.

## 5. Test boundaries

- `tests/server.test.ts` — all nine tools register.
- `tests/transport.test.ts` / `tests/client.test.ts` — request-layer behavior of `FetchHttpTransport` and `ContentClient`.
- `tests/schema.test.ts` — input schemas and `content_scope` format checks.

## 6. Limits and future direction

The design is layered but intentionally a lightweight monolith:

- No runtime retry, idempotency, rate limiting, or backoff.
- A single error mode (errors are thrown uniformly).
- Tool capabilities are documented statically.

Possible extensions:

- An `errors.ts` with a unified API error model.
- Strategic retry / idempotency in the client layer.
- A service layer (e.g. `PostService`) for richer flows.
- End-to-end contract tests covering error response shapes.
