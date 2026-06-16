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
      locale: 'en',
      title: 'Example Guide',
      content: '## Markdown body',
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

  it('lists drafts through the posts endpoint with a draft status filter', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.listDrafts({
      type: 'guide',
      content_scope: 'product:example-product',
      q: 'setup',
      per_page: 20,
    });

    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.pathname).toBe('/api/v1/mcp/posts');
    expect(calledUrl.searchParams.get('status')).toBe('draft');
    expect(calledUrl.searchParams.get('type')).toBe('guide');
    expect(calledUrl.searchParams.get('content_scope')).toBe('product:example-product');
    expect(calledUrl.searchParams.get('q')).toBe('setup');
    expect(calledUrl.searchParams.get('per_page')).toBe('20');
  });

  it('reads product context through the configured products endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ content_scope: 'product:evisa-helper' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = new ContentClient(config);
    await client.getProductContext({ content_scope: 'product:evisa-helper' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/products/product%3Aevisa-helper',
      expect.objectContaining({ method: 'GET' })
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

  it('updates drafts only after verifying the current post status', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 123, status: 'draft' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const client = new ContentClient(config);
    await client.updateDraft({
      id_or_slug: 'example-guide',
      locale: 'en',
      title: 'Updated Draft',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/v1/mcp/posts/example-guide',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.com/api/v1/mcp/posts/example-guide',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"title":"Updated Draft"'),
      })
    );
  });

  it('refuses to update published posts through the draft update path', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 123, status: 'published' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = new ContentClient(config);

    await expect(client.updateDraft({
      id_or_slug: 'example-guide',
      locale: 'en',
      title: 'Updated Draft',
    })).rejects.toThrow(/requires a draft post/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws generic readable errors for failed api calls', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401, statusText: 'Unauthorized' })
    );

    const client = new ContentClient(config);
    await expect(client.getPost('missing')).rejects.toThrow(/Content API request failed: 401 Unauthorized/);
  });
});
