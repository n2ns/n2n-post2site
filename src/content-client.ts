import type { CreatePostInput, ListDraftsInput, ListPostsInput, ScopeContextInput, UpdateDraftInput, UpdatePostInput } from './schemas/blog-post.js';
import type { Config } from './config.js';
import { FetchHttpTransport, type HttpTransport } from './transport/http.js';

const POSTS_PATH = '/posts';
const CAPABILITIES_PATH = '/capabilities';
const SCOPES_PATH = '/scopes';

export class ContentClient {
  constructor(
    private readonly config: Config,
    private readonly transport: HttpTransport = new FetchHttpTransport(config)
  ) {}

  async getCapabilities(): Promise<unknown> {
    return this.request(CAPABILITIES_PATH, { method: 'GET' });
  }

  async listPosts(input: ListPostsInput): Promise<unknown> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) {
        continue;
      }

      params.set(key, String(value));
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`${POSTS_PATH}${suffix}`, { method: 'GET' });
  }

  async listDrafts(input: ListDraftsInput): Promise<unknown> {
    return this.listPosts({ ...input, status: 'draft' });
  }

  async getPost(idOrSlug: string): Promise<unknown> {
    return this.request(`${POSTS_PATH}/${encodeURIComponent(idOrSlug)}`, { method: 'GET' });
  }

  async getScopeContext(input: ScopeContextInput): Promise<unknown> {
    return this.request(`${SCOPES_PATH}/${encodeURIComponent(input.content_scope)}`, { method: 'GET' });
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

  async updateDraft(input: UpdateDraftInput): Promise<unknown> {
    const existingPost = await this.getPost(input.id_or_slug);
    assertDraftStatus(existingPost);

    return this.updatePost(input);
  }

  async publishPost(idOrSlug: string): Promise<unknown> {
    return this.request(`${POSTS_PATH}/${encodeURIComponent(idOrSlug)}/publish`, {
      method: 'POST',
    });
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const response = await this.transport.request(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey,
        Authorization: `Bearer ${this.config.apiKey}`,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Content API request failed: ${response.status} ${response.statusText}: ${formatBody(response.body)}`);
    }

    return response.body;
  }
}

function formatBody(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}

function assertDraftStatus(body: unknown): void {
  const status = extractPostStatus(body);
  if (status === 'draft') {
    return;
  }

  if (status) {
    throw new Error(`n2n_update_draft requires a draft post. Current status: ${status}.`);
  }

  throw new Error('n2n_update_draft could not verify draft status. The backend GET /posts/{id_or_slug} response must include a status field.');
}

function extractPostStatus(body: unknown): string | undefined {
  const record = asRecord(body);
  const post = asRecord(record?.blog_post) ?? asRecord(record?.data) ?? record;
  const status = post?.status;

  return typeof status === 'string' ? status : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}
