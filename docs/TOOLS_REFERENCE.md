# n2n-post2site Tools Reference

All tools call the backend at `CONTENT_API_BASE_URL` with `X-API-KEY: CONTENT_API_KEY`.

## Discovery

### `n2n_get_capabilities`

Read workflow flags, auth mode, safety boundaries, endpoints, and host-declared schema.

```json
{}
```

### `n2n_get_site_context`

Read host positioning, product/content context, supported locales, and URL patterns.

```json
{}
```

### `n2n_get_editorial_policy`

Read host editorial policy, evidence rules, CTA rules, prohibited claims, and publish blockers.

```json
{}
```

## Inventory

### `n2n_list_inventory`

List existing content before drafting.

```json
{
  "type": "guide",
  "topic": "visa-policy",
  "q": "official website",
  "per_page": 20
}
```

### `n2n_get_inventory_resource`

Read one existing content resource by host target identifier.

```json
{
  "target_identifier": "vietnam-evisa-official-website-guide"
}
```

### `n2n_get_inventory_stats`

Read host inventory statistics such as topic counts.

```json
{
  "type": "guide"
}
```

### `n2n_check_duplicates`

Check duplicate risk for a proposed article.

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

List saved server drafts.

```json
{
  "status": "draft",
  "per_page": 20
}
```

### `n2n_create_draft`

Create a server draft after the working draft is confirmed for remote saving.

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

### `n2n_get_draft`

Read one server draft.

```json
{
  "draft_id": "draft_01..."
}
```

### `n2n_update_draft`

Update a server draft.

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
  "purpose": "blog_thumbnail",
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
