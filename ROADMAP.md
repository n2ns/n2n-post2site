# N2N Post2Site Roadmap

This document describes the planned direction for N2N Post2Site. It reflects the current state of the project and the areas where the most useful work can happen next.

---

## Current State — v0.1.x

The v0.1 series establishes the core publishing workflow:

- Read backend capabilities before drafting content.
- Search existing posts before creating new ones.
- Read controlled product facts before writing product guides.
- Create and update drafts one locale at a time.
- Publish through a separate, explicit tool call.

The MCP client is intentionally thin. It adds no local state and no content logic. The backend remains responsible for authentication, validation, storage, preview, and publishing rules.

---

## v0.2 — Schema and Discovery

**Goal**: remove hardcoded assumptions, make the client adapt to what the backend reports.

- **Dynamic locale list**: read supported locales from `GET /capabilities` instead of using a fixed enum in the MCP schema. This allows backends to support additional locales without requiring a client update.
- **Dynamic content type list**: same approach for `technical`, `announcement`, `changelog`, `guide`, and any types the backend adds later.
- **Post list pagination**: add `page` (or a cursor field) alongside the existing `per_page` filter so assistants can page through large content archives.
- **Date range filter**: add `created_after` and `updated_after` filters to `n2n_list_posts` for discovering recent or recently changed content.

---

## v0.3 — Image and Asset Support

**Goal**: allow AI assistants to include images in articles without requiring manual uploads.

- **Image upload tool** (`n2n_upload_image`): accept a local file path or public URL and return a site-hosted image path the assistant can embed in article content. This is explicitly deferred from v0.1.
- **Thumbnail support**: wire the existing `thumbnail` field in the create/update schema to an uploaded image path or public URL.
- Content format guidance: document inline image syntax and alt text requirements clearly.

---

## v0.4 — Backend Contract Reference

**Goal**: make it practical for teams to implement the Content Publishing API Contract on their own backend.

- **OpenAPI specification**: publish a machine-readable spec for the seven endpoints the MCP client calls (`/capabilities`, `/products/{scope}`, `/posts`, `/posts/{id}`, `/posts/{id}/publish`). This gives backend authors a clear target to implement against.
- **Reference backend**: provide a minimal reference implementation or adapter package for a common web framework. This would implement the required endpoints without requiring teams to interpret the README contract section by hand.
- **Contract conformance tests**: a test suite that any backend implementation can run to verify it satisfies the contract.

---

## v0.5 — Draft Management

**Goal**: let assistants clean up draft content they created.

- **Delete draft tool** (`n2n_delete_draft`): allow deletion of unpublished drafts only. Published posts remain outside the MCP scope — deletion of live content requires backend-side admin controls.
- **Draft listing**: add a dedicated draft-only listing view with richer status fields.

---

## Out of Scope

These will not be added to N2N Post2Site:

- CMS admin panel or content management UI.
- Database access or direct storage operations.
- User or team management.
- Pricing, payment, or subscription management.
- Deployment or server operations.
- Shell access.
- Multi-site selection inside tool arguments — use one MCP server configuration per site.

---

## Version Policy

- **v0.x**: iterative development; minor API surface changes possible between minor versions.
- **v1.0**: stable API contract; breaking changes require a major version bump.

Until v1.0, the Content Publishing API Contract (the backend endpoint signatures) may receive additive changes. Backends should treat unknown fields in requests as optional and return unknown fields in responses without error.
