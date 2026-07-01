# Client Smoke Testing

This document covers smoke testing the local MCP server surface after the clean Tool/Resource refactor.

Supported target clients:

- Claude Code
- Codex
- Antigravity IDE

Gemini CLI is not required for this project when Antigravity IDE is the Google/Gemini-side client in use.

## Protocol Smoke

Run:

```bash
npm run smoke:mcp
```

The script:

- Builds `dist/index.js`.
- Starts a local mock Post2Site HTTP backend.
- Starts `dist/index.js` over MCP stdio.
- Verifies exactly 10 Tools.
- Verifies exactly 4 static Resources.
- Verifies exactly 2 Resource Templates.
- Verifies the server does not advertise Prompts or Completion.
- Reads static and template resources.
- Verifies slash-containing inventory identifiers use `%2F`.
- Calls list/create tools and checks returned `resource_link` blocks.
- Verifies removed read tools are unavailable.

This is the required automated smoke before checking individual clients.

## Temporary MCP Server Config

Use a local backend during client smoke. The protocol smoke script starts its own backend, but GUI/CLI clients need a backend that stays running while the client is open.

Example server entry:

```json
{
  "command": "node",
  "args": ["/home/deploy/_projects/_workspace/n2n-post2site/dist/index.js"],
  "env": {
    "CONTENT_API_BASE_URL": "http://127.0.0.1:PORT",
    "CONTENT_API_KEY": "smoke-key"
  }
}
```

Replace `PORT` with the local mock or staging backend port.

## Claude Code

Smoke target:

- MCP server starts without stderr errors.
- Tool list shows the final 10 tools only.
- Resources include:
  - `post2site://capabilities`
  - `post2site://site-context`
  - `post2site://editorial-policy`
  - `post2site://inventory/stats`
- Resource templates include:
  - `post2site://inventory/resources/{target_identifier}`
  - `post2site://drafts/{draft_id}`
- Removed read tools are not offered.
- Reading `post2site://capabilities` returns JSON.
- Calling `n2n_list_inventory` returns a `resource_link` to an inventory detail resource.

Use the client-specific MCP config location for your Claude Code install, then point the server entry at local `dist/index.js`.

## Codex

Smoke target:

- MCP server starts from the configured command.
- Server instructions mention Resources for passive context and Tools for active operations.
- Tool discovery shows the final 10 tools only.
- Removed read tools are not offered.
- Resource reads work where the Codex surface exposes MCP resources.
- If Codex UI exposes resources less directly than Claude Code or Antigravity, keep the clean MCP design and use protocol smoke as the hard functional check.

Use the local Codex MCP config for this workspace and point the server entry at local `dist/index.js`.

## Antigravity IDE

Smoke target:

- Antigravity starts the configured MCP server without errors.
- MCP panel or equivalent server view shows the final tool list and resources/templates.
- `post2site://capabilities` can be opened as JSON.
- `post2site://inventory/resources/guides%2Fexample-post` can be opened when the backend provides that identifier.
- `n2n_list_inventory` returns a resource link that can be followed or copied into a resource read.

If the Antigravity remote CLI does not provide non-interactive MCP introspection, treat this as a GUI smoke:

1. Add the temporary MCP server entry.
2. Open the workspace in Antigravity IDE.
3. Confirm the MCP server is connected.
4. Confirm tools/resources/templates match the protocol smoke output.
5. Run one inventory list call and one resource read.

## Pass Criteria

Client smoke passes when:

- `npm run smoke:mcp` passes.
- Claude Code, Codex, and Antigravity IDE can start the server from local `dist/index.js`.
- No client displays removed read tools.
- At least one client-visible path can read Resources.
- List tools expose usable resource URIs or `resource_link` blocks.
