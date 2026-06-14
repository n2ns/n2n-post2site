# Changelog

All notable changes to N2N WriteLane are documented in this file.

## [0.1.2] - 2026-06-15

### Added

- Added `n2n_get_product_context` for reading a controlled product fact sheet before drafting product guides.
- Documented the required product context fields: `content_scope`, `canonical_url`, `docs_url`, `summary`, `key_points`, and `do_not_claim`.
- Added client and schema coverage for product context lookups.

### Changed

- Product guide creation guidance now requires reading product context before drafting.
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
