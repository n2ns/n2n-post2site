import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Config } from './config.js';
import { ContentClient } from './content-client.js';
import { registerResources } from './resources/index.js';
import { registerAssetTools } from './tools/assets.js';
import { registerDraftTools } from './tools/drafts.js';
import { registerInventoryTools } from './tools/inventory.js';
import { registerPublishingTools } from './tools/publishing.js';

export function createServer(config: Config): McpServer {
  const client = new ContentClient(config);

  const server = new McpServer({
    name: 'n2n-post2site',
    version: '0.3.0',
  }, {
    instructions: 'Post2Site exposes passive publishing context as MCP resources and active publishing operations as MCP tools. Read post2site://capabilities, post2site://site-context, and post2site://editorial-policy before drafting. Use list tools to discover resource URIs, then read detail resources.',
  });

  registerInventoryTools(server, client);
  registerDraftTools(server, client);
  registerAssetTools(server, client);
  registerPublishingTools(server, client);
  registerResources(server, client);

  return server;
}
