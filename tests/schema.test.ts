import { describe, expect, it } from 'vitest';
import { assertContentScopeFormat, createPostSchema, listDraftsSchema, scopeContextSchema } from '../src/schemas/blog-post.js';

describe('blog post schemas', () => {
  it('leaves type and locale to the backend default when omitted', () => {
    const parsed = createPostSchema.parse({
      slug: 'company-post',
      title: 'Title',
      content: '## Markdown\n\nBody',
    });

    expect(parsed.type).toBeUndefined();
    expect(parsed.locale).toBeUndefined();
  });

  it('accepts a kind:key scope context lookup', () => {
    const parsed = scopeContextSchema.parse({ content_scope: 'product:evisa-helper' });

    expect(parsed.content_scope).toBe('product:evisa-helper');
  });

  it('does not expose status on draft-only listing input', () => {
    const parsed = listDraftsSchema.parse({
      status: 'published',
      type: 'guide',
    });

    expect(parsed).toEqual({ type: 'guide' });
  });

  it('rejects a malformed content_scope but accepts kind:key', () => {
    expect(() => assertContentScopeFormat('example-product')).toThrow(/kind:key/);
    expect(() => assertContentScopeFormat('product:example')).not.toThrow();
    expect(() => assertContentScopeFormat(undefined)).not.toThrow();
  });
});
