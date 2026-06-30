import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createServer } from '../src/server.js';

const config = {
  apiBaseUrl: 'https://example.com/api/v1/mcp',
  apiKey: 'test_key',
};

describe('MCP server wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the MCP publishing workflow tools through createServer', () => {
    const toolSpy = vi.spyOn(McpServer.prototype, 'tool');

    const server = createServer(config);
    const toolNames = toolSpy.mock.calls.map((call) => call[0]);

    expect(server).toBeInstanceOf(McpServer);
    expect(toolNames).toEqual([
      'n2n_get_capabilities',
      'n2n_get_site_context',
      'n2n_get_editorial_policy',
      'n2n_list_inventory',
      'n2n_get_inventory_resource',
      'n2n_get_inventory_stats',
      'n2n_check_duplicates',
      'n2n_validate_working_draft',
      'n2n_list_drafts',
      'n2n_create_draft',
      'n2n_get_draft',
      'n2n_update_draft',
      'n2n_validate_draft',
      'n2n_preview_draft',
      'n2n_upload_asset',
      'n2n_publish_draft',
    ]);
    expect(toolSpy).toHaveBeenCalledTimes(16);
  });
});
