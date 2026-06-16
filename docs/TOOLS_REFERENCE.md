# MCP Tools Reference

## `n2n_get_capabilities`

Read backend capabilities before creating or updating content.

```json
{}
```

## `n2n_list_posts`

Search existing posts before drafting new content.

```json
{
  "status": "draft",
  "type": "guide",
  "content_scope": "product:example-product",
  "q": "setup guide",
  "per_page": 20
}
```

`status` is only a filter here. Do not send `status` in create or update calls.

## `n2n_list_drafts`

List unpublished drafts. This is a draft-only convenience tool over `GET /posts?status=draft`.

```json
{
  "type": "guide",
  "content_scope": "product:example-product",
  "q": "setup guide",
  "per_page": 20
}
```

## `n2n_get_post`

Read an existing post before updating it, completing missing locales, or writing a follow-up.

```json
{
  "id_or_slug": "example-product-guide"
}
```

## `n2n_get_product_context`

Read controlled product facts before drafting a product guide.

```json
{
  "content_scope": "product:example-product"
}
```

## `n2n_create_post`

Create a draft. Publishing is separate.

Company blog example:

```json
{
  "slug": "content-workflow-notes",
  "type": "technical",
  "locale": "en",
  "title": "Content Workflow Notes",
  "excerpt": "Practical notes from shipping a content workflow.",
  "content": "## Notes\n\nMarkdown content..."
}
```

Product guide example:

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

## `n2n_update_post`

Update one locale of an existing post. Call `n2n_get_post` first.

```json
{
  "id_or_slug": "example-product-guide",
  "locale": "de",
  "title": "So verwenden Sie Example Product",
  "excerpt": "A localized summary for the selected locale.",
  "content": "## Ueberblick\n\nLocalized Markdown content..."
}
```

## `n2n_update_draft`

Update one locale of an unpublished draft. The client reads the post first and refuses to patch unless the backend reports `status: "draft"`.

```json
{
  "id_or_slug": "example-product-guide",
  "locale": "en",
  "title": "How to Use Example Product",
  "excerpt": "A refined summary for the draft.",
  "content": "## Overview\n\nUpdated draft Markdown content..."
}
```

## `n2n_publish_post`

Publish an existing draft.

```json
{
  "id_or_slug": "example-product-guide"
}
```

## Client method mapping

- `ContentClient.listDrafts(input)` calls `GET /posts` with `status=draft` plus the provided list filters.
- `ContentClient.updateDraft(input)` calls `GET /posts/{id_or_slug}` first, checks `status === "draft"`, then calls `PATCH /posts/{id_or_slug}`.
