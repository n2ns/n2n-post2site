import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createTextResult } from '../result.js';
import {
  checkDuplicatesSchema,
  getInventoryResourceSchema,
  inventoryStatsSchema,
  listInventorySchema,
} from '../schemas/blog-post.js';

export function registerInventoryTools(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_list_inventory',
    'List existing host content before drafting to avoid duplicate topics and find internal-link candidates. Filters are host-defined.',
    listInventorySchema.shape,
    async (input) => {
      const parsed = listInventorySchema.parse(input);
      return createTextResult(await client.listInventory(parsed));
    }
  );

  server.tool(
    'n2n_get_inventory_resource',
    'Read one existing host content resource by target identifier, usually a slug.',
    getInventoryResourceSchema.shape,
    async (input) => {
      const parsed = getInventoryResourceSchema.parse(input);
      return createTextResult(await client.getInventoryResource(parsed));
    }
  );

  server.tool(
    'n2n_get_inventory_stats',
    'Read host inventory statistics such as topic counts so new articles can fill under-covered areas.',
    inventoryStatsSchema.shape,
    async (input) => {
      const parsed = inventoryStatsSchema.parse(input);
      return createTextResult(await client.getInventoryStats(parsed));
    }
  );

  server.tool(
    'n2n_check_duplicates',
    'Check duplicate risk for a proposed target identifier and host-defined content_payload before saving a server draft.',
    checkDuplicatesSchema.shape,
    async (input) => {
      const parsed = checkDuplicatesSchema.parse(input);
      return createTextResult(await client.checkDuplicates(parsed));
    }
  );
}
