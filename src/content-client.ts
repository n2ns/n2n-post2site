import type { Config } from './config.js';
import type { CreatePostInput, ListPostsInput, ProductContextInput, UpdatePostInput } from './schemas/blog-post.js';

const POSTS_PATH = '/posts';
const CAPABILITIES_PATH = '/capabilities';
const PRODUCTS_PATH = '/products';

export class ContentClient {
  constructor(private readonly config: Config) {}

  async getCapabilities(): Promise<unknown> {
    return this.request(CAPABILITIES_PATH, { method: 'GET' });
  }

  async listPosts(input: ListPostsInput): Promise<unknown> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      params.set(key, String(value));
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`${POSTS_PATH}${suffix}`, { method: 'GET' });
  }

  async getPost(idOrSlug: string): Promise<unknown> {
    return this.request(`${POSTS_PATH}/${encodeURIComponent(idOrSlug)}`, { method: 'GET' });
  }

  async getProductContext(input: ProductContextInput): Promise<unknown> {
    return this.request(`${PRODUCTS_PATH}/${encodeURIComponent(input.content_scope)}`, { method: 'GET' });
  }

  async createPost(input: CreatePostInput): Promise<unknown> {
    return this.request(POSTS_PATH, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updatePost(input: UpdatePostInput): Promise<unknown> {
    const { id_or_slug: idOrSlug, ...payload } = input;
    return this.request(`${POSTS_PATH}/${encodeURIComponent(idOrSlug)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async publishPost(idOrSlug: string): Promise<unknown> {
    return this.request(`${POSTS_PATH}/${encodeURIComponent(idOrSlug)}/publish`, {
      method: 'POST',
    });
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey,
        Authorization: `Bearer ${this.config.apiKey}`,
        ...(init.headers ?? {}),
      },
    });

    const text = await response.text();
    const body = parseJsonOrText(text);

    if (!response.ok) {
      throw new Error(`Content API request failed: ${response.status} ${response.statusText}: ${formatBody(body)}`);
    }

    return body;
  }
}

function parseJsonOrText(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatBody(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}
