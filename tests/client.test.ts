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

  it('reads discovery endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = new ContentClient(config);
    await client.getCapabilities();
    await client.getSiteContext();
    await client.getEditorialPolicy();

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      'https://example.com/api/v1/mcp/capabilities',
      'https://example.com/api/v1/mcp/site-context',
      'https://example.com/api/v1/mcp/editorial-policy',
    ]);
  });

  it('lists inventory through the inventory endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.listInventory({
      type: 'guide',
      topic: 'visa-policy',
      q: 'official site',
      per_page: 20,
    });

    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(calledUrl.pathname).toBe('/api/v1/mcp/inventory/resources');
    expect(calledUrl.searchParams.get('type')).toBe('guide');
    expect(calledUrl.searchParams.get('topic')).toBe('visa-policy');
    expect(calledUrl.searchParams.get('q')).toBe('official site');
    expect(calledUrl.searchParams.get('per_page')).toBe('20');
  });

  it('validates local working drafts without creating server drafts', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ publishable: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.validateWorkingDraft({
      mode: 'draft',
      article: {
        mode: 'create',
        target_identifier: 'example-guide',
        content_payload: { title: 'Example' },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/working-drafts/validate',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"target_identifier":"example-guide"'),
      })
    );
  });

  it('creates and updates server drafts through draft endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.createDraft({
      mode: 'create',
      target_identifier: 'example-guide',
      content_payload: { locales: { en: { title: 'Example' } } },
    });
    await client.updateDraft({
      draft_id: 'draft_123',
      content_payload: { locales: { en: { title: 'Updated' } } },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/api/v1/mcp/drafts',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.com/api/v1/mcp/drafts/draft_123',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"Updated"'),
      })
    );
  });

  it('uploads selected assets only through the asset endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ asset_id: 'asset_123' }), { status: 201, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.uploadAsset({
      draft_id: 'draft_123',
      purpose: 'blog_thumbnail',
      filename: 'cover.webp',
      content_type: 'image/webp',
      data_base64: 'ZmFrZQ==',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/assets',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"purpose":"blog_thumbnail"'),
      })
    );
  });

  it('publishes drafts with explicit confirmation and api key headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'published' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const client = new ContentClient(config);
    await client.publishDraft({
      draft_id: 'draft_123',
      publish_confirmed: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/v1/mcp/drafts/draft_123/publish',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-KEY': 'test_key',
        }),
        body: expect.stringContaining('"publish_confirmed":true'),
      })
    );
  });

  it('returns validation payloads for draft validation blockers', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ publishable: false, blockers: [{ code: 'missing_title' }] }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const client = new ContentClient(config);
    await expect(client.validateDraft({ draft_id: 'draft_123', mode: 'publish' })).resolves.toEqual({
      publishable: false,
      blockers: [{ code: 'missing_title' }],
    });
  });

  it('returns validation payloads for working draft and publish blockers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ publishable: false, blockers: [{ code: 'missing_locales' }] }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ publishable: false, blockers: [{ code: 'missing_thumbnail' }] }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const client = new ContentClient(config);
    await expect(client.validateWorkingDraft({
      mode: 'publish',
      article: {
        mode: 'create',
        target_identifier: 'draft-with-blockers',
        content_payload: {},
      },
    })).resolves.toEqual({
      publishable: false,
      blockers: [{ code: 'missing_locales' }],
    });

    await expect(client.publishDraft({
      draft_id: 'draft_123',
      publish_confirmed: true,
    })).resolves.toEqual({
      publishable: false,
      blockers: [{ code: 'missing_thumbnail' }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws generic readable errors for failed api calls', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401, statusText: 'Unauthorized' })
    );

    const client = new ContentClient(config);
    await expect(client.getDraft({ draft_id: 'missing' })).rejects.toThrow(/Content API request failed: 401 Unauthorized/);
  });
});
