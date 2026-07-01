# N2N Post2Site Roadmap

## Current State - v0.3.x

The v0.3 series exposes the clean Post2Site MCP publishing surface:

- Read host capabilities, site context, editorial policy, and inventory stats through MCP Resources.
- Inspect existing inventory and topic coverage through list/search tools.
- Check duplicate risk before saving.
- Validate local-only working drafts without persistence.
- Create, update, validate, and preview server drafts.
- Upload only selected assets.
- Publish with explicit publish confirmation.
- Follow `resource_link` blocks from list and mutation tool responses to detail resources.
- Run protocol-level MCP smoke testing with `npm run smoke:mcp`.

The MCP client remains intentionally thin. Host content fields live inside `content_payload`; the backend remains responsible for validation, storage, preview, and publishing.

## Next - Client Ergonomics

- Complete real-client smoke checks for Antigravity IDE, Claude Code, and Codex.
- Add concrete client configuration snippets once those client checks are verified.
- Improve examples for following `resource_link` results in clients with weaker resource UI.

## Contract Reference

- Publish an OpenAPI-style reference for the HTTP endpoints if host implementers need generated clients.
- Add backend conformance tests that any non-Laravel implementation can run.
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
- MCP Prompts, subscriptions, and completion support until there is a concrete target-client need.
