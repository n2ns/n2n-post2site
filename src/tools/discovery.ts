import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createTextResult } from '../result.js';
import { emptySchema } from '../schemas/blog-post.js';

export function registerDiscoveryTools(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_get_capabilities',
    'Read the publishing contract, workflow flags, auth mode, safety boundaries, and host-declared schema before any writing action.',
    emptySchema.shape,
    async (input) => {
      emptySchema.parse(input);
      return createTextResult(await client.getCapabilities());
    }
  );

  server.tool(
    'n2n_get_site_context',
    'Read host site context such as positioning, supported locales, public URL patterns, and product/content orientation before choosing a topic.',
    emptySchema.shape,
    async (input) => {
      emptySchema.parse(input);
      return createTextResult(await client.getSiteContext());
    }
  );

  server.tool(
    'n2n_get_editorial_policy',
    'Read host editorial policy, required content fields, evidence rules, CTA rules, prohibited claims, and publish blockers before drafting.',
    emptySchema.shape,
    async (input) => {
      emptySchema.parse(input);
      return createTextResult(await client.getEditorialPolicy());
    }
  );
}
