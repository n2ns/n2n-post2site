import { describe, expect, it } from 'vitest';
import { assertContentPostShape, createPostSchema, listDraftsSchema, productContextSchema } from '../src/schemas/blog-post.js';

describe('blog post schemas', () => {
  it('defaults single-locale submissions to English', () => {
    const parsed = createPostSchema.parse({
      slug: 'company-post',
      type: 'technical',
      title: 'Title',
      content: '## Markdown\n\nBody',
    });

    expect(parsed.locale).toBe('en');
  });

  it('requires content_scope for guides', () => {
    expect(() => assertContentPostShape({ type: 'guide' })).toThrow(/content_scope is required/);
    expect(() => assertContentPostShape({ type: 'guide', content_scope: 'product:example-product' })).not.toThrow();
  });

  it('accepts product context lookup scope', () => {
    const parsed = productContextSchema.parse({ content_scope: 'product:evisa-helper' });

    expect(parsed.content_scope).toBe('product:evisa-helper');
  });

  it('does not expose status on draft-only listing input', () => {
    const parsed = listDraftsSchema.parse({
      status: 'published',
      type: 'guide',
    });

    expect(parsed).toEqual({ type: 'guide' });
  });

  it('requires kind:key content_scope format', () => {
    expect(() => assertContentPostShape({ type: 'guide', content_scope: 'example-product' })).toThrow(/kind:key/);
  });

  it('rejects content_scope for company blog posts', () => {
    expect(() => assertContentPostShape({ type: 'technical', content_scope: 'product:example-product' })).toThrow(/only allowed/);
  });
});
