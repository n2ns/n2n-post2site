# n2n-post2site Tools Reference

Tools are reserved for complex queries and actions. Read-only site context and single-resource reads are exposed as MCP resources instead; see [Resources Reference](./RESOURCES_REFERENCE.md).

All tools call the backend at `CONTENT_API_BASE_URL` with `X-API-KEY: CONTENT_API_KEY`.

## Inventory

### `n2n_list_inventory`

List existing content before drafting. Returned items include `resource_uri` when they can be opened through `post2site://inventory/resources/{target_identifier}`.

```json
{
  "type": "guide",
  "topic": "visa-policy",
  "q": "official website",
  "per_page": 20
}
```

### `n2n_check_duplicates`

Check duplicate risk for proposed host content.

```json
{
  "mode": "create",
  "target_identifier": "example-guide",
  "content_payload": {
    "type": "guide",
    "topics": ["visa-policy"]
  }
}
```

## Drafts

### `n2n_validate_working_draft`

Validate a local-only working draft without creating a server draft.

```json
{
  "mode": "draft",
  "article": {
    "mode": "create",
    "target_identifier": "example-guide",
    "content_payload": {
      "type": "guide",
      "locales": {
        "en": {
          "title": "Example Guide",
          "excerpt": "Short summary.",
          "content": "Markdown body"
        }
      }
    }
  }
}
```

### `n2n_list_drafts`

List saved server drafts. Returned items include `resource_uri` when they can be opened through `post2site://drafts/{draft_id}`.

```json
{
  "status": "draft",
  "per_page": 20
}
```

### `n2n_create_draft`

Create a server draft after the working draft is confirmed for remote saving. The response includes the canonical draft resource URI.

```json
{
  "mode": "create",
  "target_identifier": "example-guide",
  "content_payload": {
    "type": "guide",
    "thumbnail_asset_id": "asset_or_path",
    "locales": {
      "en": {
        "title": "Example Guide",
        "excerpt": "Short summary.",
        "content": "Markdown body"
      }
    }
  }
}
```

### `n2n_update_draft`

Update a server draft. Use `post2site://drafts/{draft_id}` to read the draft.

```json
{
  "draft_id": "draft_01...",
  "content_payload": {
    "type": "guide",
    "locales": {
      "en": {
        "title": "Updated Guide",
        "excerpt": "Updated summary.",
        "content": "Updated Markdown body"
      }
    }
  }
}
```

### `n2n_validate_draft`

Validate a saved draft.

```json
{
  "draft_id": "draft_01...",
  "mode": "publish"
}
```

### `n2n_preview_draft`

Return host preview URL(s) for a saved draft.

```json
{
  "draft_id": "draft_01..."
}
```

## Assets

### `n2n_upload_asset`

Upload only the selected asset.

```json
{
  "draft_id": "draft_01...",
  "purpose": "primary_image",
  "filename": "cover.webp",
  "content_type": "image/webp",
  "data_base64": "..."
}
```

## Publishing

### `n2n_publish_draft`

Publish after explicit publish confirmation.

```json
{
  "draft_id": "draft_01...",
  "publish_confirmed": true,
  "acknowledged_warnings": []
}
```
