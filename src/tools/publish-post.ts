import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { publishPostSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerPublishPostTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_publish_post',
    'Publish an existing article or guide by ID or slug. Publishing is intentionally separate from create/update to avoid accidental publication.',
    publishPostSchema.shape,
    async (input) => {
      const parsed = publishPostSchema.parse(input);
      const result = await client.publishPost(parsed.id_or_slug);
      return createTextResult(result);
    }
  );
}
