import type {
  CheckDuplicatesInput,
  CreateDraftInput,
  GetDraftInput,
  GetInventoryResourceInput,
  InventoryStatsInput,
  ListDraftsInput,
  ListInventoryInput,
  PreviewDraftInput,
  PublishDraftInput,
  UpdateDraftInput,
  UploadAssetInput,
  ValidateDraftInput,
  ValidateWorkingDraftInput,
} from './schemas/blog-post.js';
import type { Config } from './config.js';
import { FetchHttpTransport, type HttpTransport } from './transport/http.js';

export class ContentClient {
  constructor(
    private readonly config: Config,
    private readonly transport: HttpTransport = new FetchHttpTransport(config)
  ) {}

  async getCapabilities(): Promise<unknown> {
    return this.request('/capabilities', { method: 'GET' });
  }

  async getSiteContext(): Promise<unknown> {
    return this.request('/site-context', { method: 'GET' });
  }

  async getEditorialPolicy(): Promise<unknown> {
    return this.request('/editorial-policy', { method: 'GET' });
  }

  async listInventory(input: ListInventoryInput): Promise<unknown> {
    return this.request(`/inventory/resources${queryString(input)}`, { method: 'GET' });
  }

  async getInventoryResource(input: GetInventoryResourceInput): Promise<unknown> {
    return this.request(`/inventory/resources/${encodeURIComponent(input.target_identifier)}`, { method: 'GET' });
  }

  async getInventoryStats(input: InventoryStatsInput): Promise<unknown> {
    return this.request(`/inventory/stats${queryString(input)}`, { method: 'GET' });
  }

  async checkDuplicates(input: CheckDuplicatesInput): Promise<unknown> {
    return this.request('/inventory/duplicates', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async validateWorkingDraft(input: ValidateWorkingDraftInput): Promise<unknown> {
    return this.request('/working-drafts/validate', {
      method: 'POST',
      body: JSON.stringify(input),
    }, [422]);
  }

  async listDrafts(input: ListDraftsInput): Promise<unknown> {
    return this.request(`/drafts${queryString(input)}`, { method: 'GET' });
  }

  async createDraft(input: CreateDraftInput): Promise<unknown> {
    return this.request('/drafts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getDraft(input: GetDraftInput): Promise<unknown> {
    return this.request(`/drafts/${encodeURIComponent(input.draft_id)}`, { method: 'GET' });
  }

  async updateDraft(input: UpdateDraftInput): Promise<unknown> {
    const { draft_id: draftId, ...payload } = input;

    return this.request(`/drafts/${encodeURIComponent(draftId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async validateDraft(input: ValidateDraftInput): Promise<unknown> {
    const { draft_id: draftId, ...payload } = input;

    return this.request(`/drafts/${encodeURIComponent(draftId)}/validate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, [422]);
  }

  async previewDraft(input: PreviewDraftInput): Promise<unknown> {
    return this.request(`/drafts/${encodeURIComponent(input.draft_id)}/preview`, { method: 'GET' });
  }

  async publishDraft(input: PublishDraftInput): Promise<unknown> {
    const {
      draft_id: draftId,
      ...payload
    } = input;

    return this.request(`/drafts/${encodeURIComponent(draftId)}/publish`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, [422]);
  }

  async uploadAsset(input: UploadAssetInput): Promise<unknown> {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  private async request(path: string, init: RequestInit, okStatuses: number[] = []): Promise<unknown> {
    const response = await this.transport.request(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok && !okStatuses.includes(response.status)) {
      throw new Error(`Content API request failed: ${response.status} ${response.statusText}: ${formatBody(response.body)}`);
    }

    return response.body;
  }
}

function queryString(input: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function formatBody(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}
