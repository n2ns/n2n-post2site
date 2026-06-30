# Security Policy

## Supported Versions

Security fixes target the latest published version of N2N Post2Site.

## Reporting a Vulnerability

Please do not open a public issue for suspected vulnerabilities.

Report security concerns through GitHub private vulnerability reporting for this repository, or contact the repository maintainers through the security channel listed on the organization profile.

When reporting, include:

- A description of the vulnerability.
- Steps to reproduce or a proof of concept.
- Affected versions or commit hashes.
- Any known impact or mitigation.

We aim to acknowledge reports within 5 business days.

## Security Model

N2N Post2Site runs locally as an MCP server. It does not store content locally — all reads and writes go through the configured backend API.

Key boundaries to be aware of:

- **API key handling**: `CONTENT_API_KEY` is passed as an environment variable and sent in request headers. Do not put the API key in prompts, article content, README examples, or screenshots.
- **Backend trust boundary**: N2N Post2Site does not validate backend responses beyond HTTP status codes. Use a backend that sanitizes error messages before returning them to the MCP client, to avoid leaking internal implementation details into the AI context.
- **API key authentication**: Treat `CONTENT_API_KEY` as the only credential for the publishing API. Publishing still requires the explicit `n2n_publish_draft` tool call with `publish_confirmed: true`.
- **No delete operations**: N2N Post2Site intentionally does not expose delete endpoints. Draft cleanup and content removal should be handled through backend admin controls, not through the MCP interface.
