# Contributing

Thanks for helping improve N2N Post2Site.

## Development Setup

```bash
npm install
npm run check
```

`npm run check` runs the TypeScript build and the full test suite.
It also checks the built `dist/` MCP surface and runs the protocol smoke test against a local mock backend.

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Add or update tests for behavior changes.
- Update `README.md`, `docs/TOOLS_REFERENCE.md`, `docs/RESOURCES_REFERENCE.md`, and `docs/BACKEND_API.md` when MCP tools, resources, the backend API contract, or safety boundaries change.
- Run `npm run check` before opening a PR.

## Commit Hygiene

- Do not commit `.env` files or API keys.
- Do not commit generated `node_modules/` or `dist/`.
- Explain public behavior changes in the PR description.

## Backend Contract

N2N Post2Site is a generic MCP client of the Post2Site publishing HTTP contract. Changes to MCP tool schemas, resource URIs, or resource templates should remain compatible with any conforming backend, not just the Laravel implementation. If a change requires a backend update, document the new contract requirement clearly in the PR.

## Changelog

Public changes should be recorded in `CHANGELOG.md`.
