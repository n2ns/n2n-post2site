# Backend API Contract

This document defines the HTTP contract expected by n2n-post2site. All endpoints are relative to `CONTENT_API_BASE_URL`, for example `https://example.com/api/v1/mcp`.

The backend handles storage, validation, preview rendering, publication, and host-specific content fields. n2n-post2site forwards MCP tool calls and resource reads to this API.

## Authentication

Every request sends:

```http
X-API-KEY: <CONTENT_API_KEY>
Accept: application/json
Content-Type: application/json
```

## Required Endpoints

Discovery:

```http
GET /capabilities
GET /site-context
GET /editorial-policy
```

Inventory:

```http
GET  /inventory/resources
GET  /inventory/resources/{target_identifier}
GET  /inventory/stats
POST /inventory/duplicates
```

`target_identifier` may contain `/`. Clients percent-encode it in the MCP resource URI, and the bridge forwards it to the backend as a URL-encoded path segment.

Drafts:

```http
POST  /working-drafts/validate
GET   /drafts
POST  /drafts
GET   /drafts/{draft_id}
PATCH /drafts/{draft_id}
POST  /drafts/{draft_id}/validate
GET   /drafts/{draft_id}/preview
POST  /drafts/{draft_id}/publish
```

Assets:

```http
POST /assets
```

## Content Payload Boundary

The core contract treats `content_payload` as a host-defined JSON object. The MCP bridge does not interpret fields such as `type`, `topics`, `geo_tags`, `seo_keywords`, `locales`, `thumbnail_asset_id`, or evidence records.

The backend must describe host fields through `GET /capabilities` and validate them through working draft, draft, and publish validation.

Server-managed fields must not be accepted inside `content_payload`, including:

- `status`
- `published_at`
- `author`
- `content_origin`
- `managed_by`
- `authoring_source`
- `source_type`
- `content_scope`

## Draft Creation

```http
POST /drafts
```

```json
{
  "mode": "create",
  "target_identifier": "example-guide",
  "content_payload": {
    "host_field": "host-defined value"
  },
  "client_metadata": {}
}
```

The response should include at least:

```json
{
  "draft_id": "draft_01...",
  "mode": "create",
  "target_identifier": "example-guide",
  "status": "draft",
  "version": 1,
  "content_payload": {},
  "asset_refs": [],
  "validation_state": {},
  "client_metadata": {},
  "created_at": "2026-07-02T00:00:00.000000Z",
  "updated_at": "2026-07-02T00:00:00.000000Z",
  "published_at": null,
  "publish_result": null
}
```

## Asset Upload

```http
POST /assets
```

```json
{
  "draft_id": "draft_01...",
  "purpose": "primary_image",
  "filename": "cover.webp",
  "content_type": "image/webp",
  "data_base64": "...",
  "metadata": {}
}
```

Only selected assets should be uploaded. Unselected image candidates should remain local to the AI/chat workflow.

## Publish

```http
POST /drafts/{draft_id}/publish
```

```json
{
  "publish_confirmed": true,
  "acknowledged_warnings": []
}
```

Publish must be explicit and separate from draft create/update. The backend should validate publish blockers before writing the host public resource.

## Error Shape

Backends should return sanitized JSON errors. A common shape is:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Selected content is invalid.",
    "field": "content_payload.locales.en.title"
  }
}
```

## Security Requirements

- Do not expose delete tools.
- Do not expose raw database or filesystem access.
- Do not expose shell or deployment operations.
- Keep path mapping and host field mapping in the backend adapter.
- Sanitize server errors before returning them to the MCP client.
