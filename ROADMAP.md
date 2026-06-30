# N2N Post2Site Roadmap

## Current State - v0.2.x

The v0.2 series aligns n2n-post2site with the Post2Site MCP publishing workflow:

- Discover host capabilities, site context, and editorial policy.
- Inspect existing inventory and topic coverage.
- Check duplicate risk before saving.
- Validate local-only working drafts without persistence.
- Create, update, validate, and preview server drafts.
- Upload only selected assets.
- Publish with explicit publish confirmation.

The MCP client remains intentionally thin. Host content fields live inside `content_payload`; the backend remains responsible for validation, storage, preview, and publishing.

## Next - Client Ergonomics

- Add richer tool descriptions for common AI IDE flows.
- Add examples for Antigravity, Claude Code, and Codex MCP configuration.
- Add a short "write article" prompt recipe that uses the two-confirmation workflow.

## Contract Reference

- Publish an OpenAPI-style reference for the HTTP endpoints.
- Add backend conformance tests that any implementation can run.
- Keep `n2ns/laravel-post2site` as the first-party Laravel backend package.

## Assets

- Improve asset metadata examples for alt text, provenance, size, and selected-image status.
- Keep unselected image candidates outside the backend contract.

## Out of Scope

- CMS admin UI.
- Database access.
- Filesystem write tools.
- Shell or deployment tools.
- Account administration.
- Payment, subscription, product, or pricing administration.
- Multi-site selection inside tool arguments. Use one MCP server config per site.
