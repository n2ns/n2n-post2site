# Contributing

Thanks for helping improve N2N Post2Site.

## Development Setup

```bash
npm install
npm run check
```

`npm run check` runs the TypeScript build and the full test suite.

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Add or update tests for behavior changes.
- Update `README.md` when tool schemas, the backend API contract, or safety boundaries change.
- Run `npm run check` before opening a PR.

## Commit Hygiene

- Do not commit `.env` files or API keys.
- Do not commit generated `node_modules/` or `dist/`.
- Explain user-visible behavior changes in the PR description.

## Backend Contract

N2N Post2Site is a generic MCP client of the Content Publishing API Contract. Changes to the MCP tool schemas should remain compatible with any conforming backend, not just a specific implementation. If a change requires a backend update, document the new contract requirement clearly in the PR.

## Changelog

User-visible changes should be recorded in `CHANGELOG.md`.
