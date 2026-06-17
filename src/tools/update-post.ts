import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentScopeFormat, updatePostSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerUpdatePostTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_update_post',
    'Update one locale of an existing article or guide by ID or slug. Always call n2n_get_post first so edits preserve existing content and metadata. content must be a Markdown document string; inline HTML is allowed when useful. title and excerpt must be plain text. Use repeated calls with different locale values to add missing language versions.',
    updatePostSchema.shape,
    async (input) => {
      const parsed = updatePostSchema.parse(input);
      assertContentScopeFormat(parsed.content_scope);
      const result = await client.updatePost(parsed);
      return createTextResult(result);
    }
  );
}
