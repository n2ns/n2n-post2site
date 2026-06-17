import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentScopeFormat, scopeContextSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerGetScopeContextTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_get_scope_context',
    'Read the controlled context for a content_scope before writing scoped content. The backend returns content_scope plus host-defined facts (for example canonical_url, docs_url, summary, key_points, do_not_claim) so the article does not invent facts.',
    scopeContextSchema.shape,
    async (input) => {
      const parsed = scopeContextSchema.parse(input);
      assertContentScopeFormat(parsed.content_scope);
      const result = await client.getScopeContext(parsed);
      return createTextResult(result);
    }
  );
}
