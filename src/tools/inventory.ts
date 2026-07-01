import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import {
  addInventoryResourceUris,
  collectInventoryResourceLinks,
  createJsonResult,
} from '../result.js';
import {
  checkDuplicatesSchema,
  listInventorySchema,
} from '../schemas/blog-post.js';

export function registerInventoryTools(server: McpServer, client: ContentClient): void {
  server.registerTool(
    'n2n_list_inventory',
    {
      title: 'List Inventory',
      description: 'List existing host content before drafting to avoid duplicate topics and find internal-link candidates. Filters are host-defined. Returned items include canonical post2site:// inventory resource URIs for detail reads.',
      inputSchema: listInventorySchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      const parsed = listInventorySchema.parse(input);
      const result = addInventoryResourceUris(await client.listInventory(parsed));
      return createJsonResult(result, collectInventoryResourceLinks(result));
    }
  );

  server.registerTool(
    'n2n_check_duplicates',
    {
      title: 'Check Duplicates',
      description: 'Check duplicate risk for a proposed target identifier and host-defined content_payload before saving a server draft.',
      inputSchema: checkDuplicatesSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      const parsed = checkDuplicatesSchema.parse(input);
      return createJsonResult(await client.checkDuplicates(parsed));
    }
  );
}
