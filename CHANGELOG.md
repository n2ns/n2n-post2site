# Changelog

All notable changes to N2N Post2Site are documented in this file.

## Unreleased

### Changed

- **Breaking:** renamed the `n2n_get_product_context` tool to `n2n_get_scope_context`, and the backend endpoint from `GET /products/{content_scope}` to `GET /scopes/{content_scope}`.
- Treat `content_scope` as generic `kind:key` metadata. Client-side validation now only checks the `kind:key` format; whether a scope is required or prohibited for a content type is decided by the backend (`capabilities.content.content_scope.required_for_types`).
- Relaxed `type` and `locale` tool inputs from fixed enums to free strings; the backend's `capabilities` is the source of truth for supported values. `status` remains an enum.
- Genericized tool descriptions and documentation to remove product-only assumptions.

### Removed

- Removed the client-side `type`/`content_scope` coupling (`assertContentPostShape`), replaced by a format-only `assertContentScopeFormat`.
- Removed the internal `docs/REFACTOR_PLAN.md` working document.

## [0.1.3] - 2026-06-17

### Added

- Added `n2n_list_drafts` for listing unpublished drafts through the existing posts endpoint with `status=draft`.
- Added `n2n_update_draft`, which reads the target post first and refuses to patch unless the backend reports `status: "draft"`.
- Added `docs/ARCHITECTURE.md` to document runtime layers, module boundaries, and request flow.

### Changed

- Added `docs/ARCHITECTURE.md` to the README related docs list.
- Bumped package version to `0.1.3`.

## [0.1.2] - 2026-06-15

### Added

- Added `n2n_get_product_context` for reading a controlled product fact sheet before drafting product guides.
- Documented the required product context fields: `content_scope`, `canonical_url`, `docs_url`, `summary`, `key_points`, and `do_not_claim`.
- Added client and schema coverage for product context lookups.

### Changed

- Product guide creation guidance now requires reading product context before drafting.
- Content creation guidance now requires searching existing posts first, and update guidance requires reading the target post first.
- Clarified that create/update must not send publication governance fields such as `status`, `published_at`, `user_id`, or `author`; publishing remains a separate explicit tool call.
- Version bumped to `0.1.2`.

## [0.1.1] - 2026-06-15

### Changed

- Switched create and update inputs to a single-locale model with flat `locale`, `title`, `excerpt`, and `content` fields.
- Removed create/update exposure for direct publication fields from the MCP schema.
- Documented `missing_locales` and `next_actions` follow-up flow.

## [0.1.0] - 2026-06-14

### Added

- Initial local MCP server for AI-assisted content publishing.
- Tools for capabilities, listing posts, reading posts, creating drafts, updating drafts, and publishing posts.
