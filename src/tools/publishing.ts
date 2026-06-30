import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createTextResult } from '../result.js';
import { publishDraftSchema } from '../schemas/blog-post.js';

export function registerPublishingTools(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_publish_draft',
    'Publish a validated server draft only after explicit publish confirmation. This writes the host public resource through the backend adapter.',
    publishDraftSchema.shape,
    async (input) => {
      const parsed = publishDraftSchema.parse(input);
      return createTextResult(await client.publishDraft(parsed));
    }
  );
}
