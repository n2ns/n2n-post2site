import { describe, expect, it } from 'vitest';
import { assertContentPostShape, createPostSchema } from '../src/schemas/blog-post.js';

describe('blog post schemas', () => {
  it('defaults created posts to draft', () => {
    const parsed = createPostSchema.parse({
      slug: 'company-post',
      type: 'technical',
      title: { en: 'Title' },
      content: { en: '## Markdown\n\nBody' },
    });

    expect(parsed.status).toBe('draft');
  });

  it('requires content_scope for guides', () => {
    expect(() => assertContentPostShape({ type: 'guide' })).toThrow(/content_scope is required/);
    expect(() => assertContentPostShape({ type: 'guide', content_scope: 'product:example-product' })).not.toThrow();
  });


  it('requires kind:key content_scope format', () => {
    expect(() => assertContentPostShape({ type: 'guide', content_scope: 'example-product' })).toThrow(/kind:key/);
  });

  it('rejects content_scope for company blog posts', () => {
    expect(() => assertContentPostShape({ type: 'technical', content_scope: 'product:example-product' })).toThrow(/only allowed/);
  });
});
