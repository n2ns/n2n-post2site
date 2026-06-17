import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentScopeFormat, createPostSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerCreatePostTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_create_post',
    'Create a content draft with one locale per call. Before creating new content, search existing posts with n2n_list_posts to avoid duplicates. Call n2n_get_capabilities to learn supported types and which require a content_scope; for scoped content also call n2n_get_scope_context and follow the returned facts. content must be a Markdown document string; inline HTML is allowed when useful. title and excerpt must be plain text. The backend returns missing_locales when more language versions should be added. Use n2n_publish_post to publish.',
    createPostSchema.shape,
    async (input) => {
      const parsed = createPostSchema.parse(input);
      assertContentScopeFormat(parsed.content_scope);
      const result = await client.createPost(parsed);
      return createTextResult(result);
    }
  );
}
