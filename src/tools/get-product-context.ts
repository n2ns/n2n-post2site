import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { assertContentPostShape, productContextSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerGetProductContextTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_get_product_context',
    'Read the controlled product fact sheet before writing a product guide. The backend returns content_scope, canonical_url, docs_url, summary, key_points, and do_not_claim so the article does not invent product facts.',
    productContextSchema.shape,
    async (input) => {
      const parsed = productContextSchema.parse(input);
      assertContentPostShape({ type: 'guide', content_scope: parsed.content_scope });
      const result = await client.getProductContext(parsed);
      return createTextResult(result);
    }
  );
}
