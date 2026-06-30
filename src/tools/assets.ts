import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createTextResult } from '../result.js';
import { uploadAssetSchema } from '../schemas/blog-post.js';

export function registerAssetTools(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_upload_asset',
    'Upload only a selected asset, such as the chosen thumbnail image. Do not upload unselected image candidates.',
    uploadAssetSchema.shape,
    async (input) => {
      const parsed = uploadAssetSchema.parse(input);
      return createTextResult(await client.uploadAsset(parsed));
    }
  );
}
