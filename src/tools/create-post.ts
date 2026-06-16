import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentPostShape, createPostSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerCreatePostTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_create_post',
    'Create an article draft or product guide draft with one locale per call. Before creating new content, search existing posts with n2n_list_posts to avoid duplicates. Before creating a product guide, also call n2n_get_product_context for the target content_scope and follow its canonical_url, docs_url, summary, key_points, and do_not_claim. content must be a Markdown document string; inline HTML is allowed when useful. title and excerpt must be plain text. The backend returns missing_locales when more language versions should be added. Use n2n_publish_post to publish.',
    createPostSchema.shape,
    async (input) => {
      const parsed = createPostSchema.parse(input);
      assertContentPostShape(parsed);
      const result = await client.createPost(parsed);
      return createTextResult(result);
    }
  );
}
