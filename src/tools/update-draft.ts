import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentPostShape, updateDraftSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerUpdateDraftTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_update_draft',
    'Update one locale of an unpublished draft by ID or slug. The client reads the post first and refuses to patch unless the backend reports status=draft. Use n2n_list_drafts and n2n_get_post before calling this tool.',
    updateDraftSchema.shape,
    async (input) => {
      const parsed = updateDraftSchema.parse(input);
      assertContentPostShape(parsed);
      const result = await client.updateDraft(parsed);
      return createTextResult(result);
    }
  );
}
