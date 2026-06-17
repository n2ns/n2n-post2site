import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { listPostsSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerListPostsTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_list_posts',
    'Search and list existing posts before drafting new content, to avoid duplicate topics and conflicting guidance. Filter by content_scope for scoped content, or content_scope="" for unscoped posts when the backend supports it.',
    listPostsSchema.shape,
    async (input) => {
      const parsed = listPostsSchema.parse(input);
      const result = await client.listPosts(parsed);
      return createTextResult(result);
    }
  );
}
