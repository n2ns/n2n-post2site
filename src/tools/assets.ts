import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createJsonResult } from '../result.js';
import { uploadAssetSchema } from '../schemas/blog-post.js';

export function registerAssetTools(server: McpServer, client: ContentClient): void {
  server.registerTool(
    'n2n_upload_asset',
    {
      title: 'Upload Asset',
      description: 'Upload only a selected asset, such as the chosen thumbnail image. Do not upload unselected image candidates.',
      inputSchema: uploadAssetSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (input) => {
      const parsed = uploadAssetSchema.parse(input);
      return createJsonResult(await client.uploadAsset(parsed));
    }
  );
}
