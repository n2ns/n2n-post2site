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

  it('registers all expected tools through createServer', () => {
    const toolSpy = vi.spyOn(McpServer.prototype, 'tool');

    const server = createServer(config);
    const toolNames = toolSpy.mock.calls.map((call) => call[0]);

    expect(server).toBeInstanceOf(McpServer);
    expect(toolNames).toEqual([
      'n2n_get_capabilities',
      'n2n_list_posts',
      'n2n_list_drafts',
      'n2n_get_post',
      'n2n_get_product_context',
      'n2n_create_post',
      'n2n_update_post',
      'n2n_update_draft',
      'n2n_publish_post',
    ]);
    expect(toolSpy).toHaveBeenCalledTimes(9);
  });
});
