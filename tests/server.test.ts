import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createServer } from '../src/server.js';

const config = {
  apiBaseUrl: 'https://example.com/api/v1/mcp',
  apiKey: 'test_key',
};

describe('MCP server wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the clean MCP publishing surface through createServer', () => {
    const toolSpy = vi.spyOn(McpServer.prototype, 'registerTool');
    const resourceSpy = vi.spyOn(McpServer.prototype, 'registerResource');
    const promptSpy = vi.spyOn(McpServer.prototype, 'registerPrompt');

    const server = createServer(config);
    const toolNames = toolSpy.mock.calls.map((call) => call[0]);
    const resourceNames = resourceSpy.mock.calls.map((call) => call[0]);

    expect(server).toBeInstanceOf(McpServer);
    expect(toolNames).toEqual([
      'n2n_list_inventory',
      'n2n_check_duplicates',
      'n2n_validate_working_draft',
      'n2n_list_drafts',
      'n2n_create_draft',
      'n2n_update_draft',
      'n2n_validate_draft',
      'n2n_preview_draft',
      'n2n_upload_asset',
      'n2n_publish_draft',
    ]);
    expect(toolSpy).toHaveBeenCalledTimes(10);
    expect(resourceNames).toEqual([
      'post2site-capabilities',
      'post2site-site-context',
      'post2site-editorial-policy',
      'post2site-inventory-stats',
      'post2site-inventory-resource',
      'post2site-draft',
    ]);
    expect(resourceSpy).toHaveBeenCalledTimes(6);
    expect(resourceSpy.mock.calls.filter((call) => typeof call[1] === 'string')).toHaveLength(4);
    expect(resourceSpy.mock.calls.filter((call) => call[1] instanceof ResourceTemplate)).toHaveLength(2);
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it('resource read callbacks return MCP JSON contents and decode template variables once', async () => {
    const resourceSpy = vi.spyOn(McpServer.prototype, 'registerResource');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      new Response(JSON.stringify({ url: String(input) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    createServer(config);

    const capabilitiesCallback = resourceSpy.mock.calls.find((call) => call[0] === 'post2site-capabilities')?.[3];
    expect(capabilitiesCallback).toBeDefined();
    const capabilities = await capabilitiesCallback?.(new URL('post2site://capabilities'), {} as never);
    expect(capabilities?.contents[0]).toEqual(expect.objectContaining({
      uri: 'post2site://capabilities',
      mimeType: 'application/json',
    }));

    const inventoryCallback = resourceSpy.mock.calls.find((call) => call[0] === 'post2site-inventory-resource')?.[3];
    expect(inventoryCallback).toBeDefined();
    const inventory = await inventoryCallback?.(
      new URL('post2site://inventory/resources/guides%2Fexample-post'),
      { target_identifier: 'guides%2Fexample-post' },
      {} as never
    );
    expect(inventory?.contents[0]?.uri).toBe('post2site://inventory/resources/guides%2Fexample-post');
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://example.com/api/v1/mcp/inventory/resources/guides%2Fexample-post');

    const draftCallback = resourceSpy.mock.calls.find((call) => call[0] === 'post2site-draft')?.[3];
    expect(draftCallback).toBeDefined();
    const draft = await draftCallback?.(
      new URL('post2site://drafts/draft_123'),
      { draft_id: 'draft_123' },
      {} as never
    );
    expect(draft?.contents[0]?.uri).toBe('post2site://drafts/draft_123');
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('https://example.com/api/v1/mcp/drafts/draft_123');
  });

  it('list tools return canonical resource links for follow-up detail reads', async () => {
    const toolSpy = vi.spyOn(McpServer.prototype, 'registerTool');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ target_identifier: 'guides/example-post', display_label: 'Example Post' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ draft_id: 'draft_123', target_identifier: 'draft-post' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    createServer(config);

    const listInventory = toolSpy.mock.calls.find((call) => call[0] === 'n2n_list_inventory')?.[2];
    const inventoryResult = await listInventory?.({}, {} as never);
    expect(inventoryResult?.structuredContent?.data).toEqual([
      expect.objectContaining({
        resource_uri: 'post2site://inventory/resources/guides%2Fexample-post',
      }),
    ]);
    expect(inventoryResult?.content).toContainEqual(expect.objectContaining({
      type: 'resource_link',
      uri: 'post2site://inventory/resources/guides%2Fexample-post',
      name: 'Example Post',
    }));

    const listDrafts = toolSpy.mock.calls.find((call) => call[0] === 'n2n_list_drafts')?.[2];
    const draftsResult = await listDrafts?.({}, {} as never);
    expect(draftsResult?.structuredContent?.data).toEqual([
      expect.objectContaining({
        resource_uri: 'post2site://drafts/draft_123',
      }),
    ]);
    expect(draftsResult?.content).toContainEqual(expect.objectContaining({
      type: 'resource_link',
      uri: 'post2site://drafts/draft_123',
    }));
  });

  it('detail resources fail clearly when JSON payloads exceed the size limit', async () => {
    const resourceSpy = vi.spyOn(McpServer.prototype, 'registerResource');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ content_payload: { body: 'x'.repeat(210 * 1024) } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    createServer(config);

    const draftCallback = resourceSpy.mock.calls.find((call) => call[0] === 'post2site-draft')?.[3];
    await expect(draftCallback?.(
      new URL('post2site://drafts/draft_large'),
      { draft_id: 'draft_large' },
      {} as never
    )).rejects.toThrow(/exceeding the 204800 byte JSON limit/);
  });
});
