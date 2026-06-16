import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createTextResult } from '../result.js';
import { capabilitiesSchema } from '../schemas/blog-post.js';
import { ContentClient } from '../content-client.js';

export function registerGetCapabilitiesTool(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_get_capabilities',
    'Read the backend Content Publishing API Contract before creating or updating content. Use this to discover supported content types, locales, content_scope rules, and product guide scopes.',
    capabilitiesSchema.shape,
    async (input) => {
      capabilitiesSchema.parse(input);
      const result = await client.getCapabilities();
      return createTextResult(result);
    }
  );
}
