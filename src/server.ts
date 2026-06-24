import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { Config } from './config.js';
import { ContentClient } from './content-client.js';
import { registerCreatePostTool } from './tools/create-post.js';
import { registerGetCapabilitiesTool } from './tools/get-capabilities.js';
import { registerGetPostTool } from './tools/get-post.js';
import { registerGetScopeContextTool } from './tools/get-scope-context.js';
import { registerListDraftsTool } from './tools/list-drafts.js';
import { registerListPostsTool } from './tools/list-posts.js';
import { registerPublishPostTool } from './tools/publish-post.js';
import { registerUpdateDraftTool } from './tools/update-draft.js';
import { registerUpdatePostTool } from './tools/update-post.js';

export function createServer(config: Config): McpServer {
  const client = new ContentClient(config);

  const server = new McpServer({
    name: 'n2n-post2site',
    version: '0.1.4',
  });

  registerGetCapabilitiesTool(server, client);
  registerListPostsTool(server, client);
  registerListDraftsTool(server, client);
  registerGetPostTool(server, client);
  registerGetScopeContextTool(server, client);
  registerCreatePostTool(server, client);
  registerUpdatePostTool(server, client);
  registerUpdateDraftTool(server, client);
  registerPublishPostTool(server, client);

  return server;
}
