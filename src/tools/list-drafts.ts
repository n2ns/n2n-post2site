import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { listDraftsSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerListDraftsTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_list_drafts',
    'List unpublished draft articles or product guides. Use this before resuming previous AI-written drafts. This tool always filters status=draft; use type, content_scope, q, and per_page to narrow the results.',
    listDraftsSchema.shape,
    async (input) => {
      const parsed = listDraftsSchema.parse(input);
      const result = await client.listDrafts(parsed);
      return createTextResult(result);
    }
  );
}
