import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentClient } from '../src/content-client.js';

const config = {
  apiBaseUrl: 'https://example.com/api/v1/mcp',
  apiKey: 'test_key',
};

describe('ContentClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads capabilities through the configured capabilities endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ contract: 'Content Publishing API Contract' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = new ContentClient(config);
    await client.getCapabilities();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/capabilities',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('creates posts through the configured posts endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.createPost({
      slug: 'example-guide',
      type: 'guide',
      content_scope: 'product:example-product',
      status: 'draft',
      title: { en: 'Example Guide' },
      content: { en: '## Markdown body' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/posts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_key',
          'X-API-KEY': 'test_key',
        }),
        body: expect.stringContaining('"content_scope":"product:example-product"'),
      })
    );
  });

  it('publishes posts through the publish endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.publishPost('example-guide');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/posts/example-guide/publish',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws generic readable errors for failed api calls', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401, statusText: 'Unauthorized' })
    );

    const client = new ContentClient(config);
    await expect(client.getPost('missing')).rejects.toThrow(/Content API request failed: 401 Unauthorized/);
  });
});
