import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Config } from './config.js';
import { ContentClient } from './content-client.js';
import { registerAssetTools } from './tools/assets.js';
import { registerDiscoveryTools } from './tools/discovery.js';
import { registerDraftTools } from './tools/drafts.js';
import { registerInventoryTools } from './tools/inventory.js';
import { registerPublishingTools } from './tools/publishing.js';

export function createServer(config: Config): McpServer {
  const client = new ContentClient(config);

  const server = new McpServer({
    name: 'n2n-post2site',
    version: '0.2.0',
  });

  registerDiscoveryTools(server, client);
  registerInventoryTools(server, client);
  registerDraftTools(server, client);
  registerAssetTools(server, client);
  registerPublishingTools(server, client);

  return server;
}
