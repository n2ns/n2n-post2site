import type { Config } from '../config.js';

export type TransportResponse = {
  status: number;
  statusText: string;
  ok: boolean;
  body: unknown;
};

export interface HttpTransport {
  request(path: string, init: RequestInit): Promise<TransportResponse>;
}

export class FetchHttpTransport implements HttpTransport {
  private readonly baseUrl: string;

  constructor(config: Config) {
    this.baseUrl = config.apiBaseUrl;
  }

  async request(path: string, init: RequestInit): Promise<TransportResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, init);

    const text = await response.text();
    const body = parseJsonOrText(text);

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      body,
    };
  }
}

function parseJsonOrText(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
