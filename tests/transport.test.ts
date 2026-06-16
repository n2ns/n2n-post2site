import { afterEach, describe, expect, it, vi } from 'vitest';

import { FetchHttpTransport } from '../src/transport/http.js';
import { ContentClient } from '../src/content-client.js';

describe('transport and transport-aware client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses JSON and text response bodies in FetchHttpTransport', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      .mockResolvedValueOnce(new Response('plain text', { status: 200 }));

    const transport = new FetchHttpTransport({
      apiBaseUrl: 'https://example.com/api/v1/mcp',
      apiKey: 'test_key',
    });

    const jsonResult = await transport.request('/capabilities', { method: 'GET' });
    const textResult = await transport.request('/capabilities', { method: 'GET' });

    expect(jsonResult.body).toEqual({ ok: true });
    expect(textResult.body).toBe('plain text');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(jsonResult).toMatchObject({
      status: 200,
      ok: true,
      body: { ok: true },
    });
    expect(textResult).toMatchObject({
      status: 200,
      ok: true,
      body: 'plain text',
    });
  });

  it('forwards requests through injected transport in ContentClient', async () => {
    const calls: { path: string; init: RequestInit }[] = [];
    const transport = {
      request: async (path: string, init: RequestInit) => {
        calls.push({ path, init });
        return {
          status: 200,
          statusText: 'OK',
          ok: true,
          body: { ok: true },
        };
      },
    };

    const client = new ContentClient(
      {
        apiBaseUrl: 'https://example.com/api/v1/mcp',
        apiKey: 'test_key',
      },
      transport
    );

    await client.getCapabilities();

    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/capabilities');
    expect(calls[0].init).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_key',
        'X-API-KEY': 'test_key',
      }),
    });
  });
});
