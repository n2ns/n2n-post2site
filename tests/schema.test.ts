import { describe, expect, it } from 'vitest';
import {
  createDraftSchema,
  publishDraftSchema,
  uploadAssetSchema,
  validateWorkingDraftSchema,
} from '../src/schemas/blog-post.js';

describe('MCP publishing schemas', () => {
  it('keeps content_payload host-defined for server drafts', () => {
    const parsed = createDraftSchema.parse({
      mode: 'create',
      target_identifier: 'example-guide',
      content_payload: {
        type: 'guide',
        locales: {
          en: {
            title: 'Example',
            content: 'Markdown body',
          },
        },
      },
    });

    expect(parsed.content_payload).toEqual({
      type: 'guide',
      locales: {
        en: {
          title: 'Example',
          content: 'Markdown body',
        },
      },
    });
  });

  it('validates local working drafts without requiring persistence fields', () => {
    const parsed = validateWorkingDraftSchema.parse({
      mode: 'draft',
      article: {
        mode: 'create',
        content_payload: { title: 'Local draft' },
      },
    });

    expect(parsed.article.content_payload).toEqual({ title: 'Local draft' });
  });

  it('requires explicit publish confirmation for publish', () => {
    expect(() => publishDraftSchema.parse({
      draft_id: 'draft_123',
      publish_confirmed: false,
    })).toThrow(/explicit publish confirmation/);

    expect(publishDraftSchema.parse({
      draft_id: 'draft_123',
      publish_confirmed: true,
    }).publish_confirmed).toBe(true);
  });

  it('accepts selected asset uploads as base64 payloads', () => {
    const parsed = uploadAssetSchema.parse({
      purpose: 'blog_thumbnail',
      filename: 'cover.webp',
      content_type: 'image/webp',
      data_base64: 'ZmFrZQ==',
    });

    expect(parsed.purpose).toBe('blog_thumbnail');
  });
});
