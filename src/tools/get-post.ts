import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { getPostSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerGetPostTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_get_post',
    'Read one existing article or guide by numeric ID or slug. Use this before updating a post, completing missing locales, or writing a follow-up article that depends on previous content.',
    getPostSchema.shape,
    async (input) => {
      const parsed = getPostSchema.parse(input);
      const result = await client.getPost(parsed.id_or_slug);
      return createTextResult(result);
    }
  );
}
