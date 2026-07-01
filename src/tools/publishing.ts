import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createJsonResult, draftResourceLink } from '../result.js';
import { publishDraftSchema } from '../schemas/blog-post.js';

export function registerPublishingTools(server: McpServer, client: ContentClient): void {
  server.registerTool(
    'n2n_publish_draft',
    {
      title: 'Publish Draft',
      description: 'Publish a validated server draft only after explicit publish confirmation. This writes the host public resource through the backend adapter.',
      inputSchema: publishDraftSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (input) => {
      const parsed = publishDraftSchema.parse(input);
      return createJsonResult(await client.publishDraft(parsed), [draftResourceLink(parsed.draft_id)]);
    }
  );
}
