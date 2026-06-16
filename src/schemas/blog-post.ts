import { z } from 'zod';

export const contentTypeSchema = z.enum(['technical', 'announcement', 'changelog', 'guide']);
export const statusSchema = z.enum(['draft', 'published']);
export const localeSchema = z.enum(['en', 'zh_CN', 'es', 'de']);
export const capabilitiesSchema = z.object({});

export const listPostsSchema = z.object({
  status: statusSchema.optional().describe('Filter by publication status.'),
  type: contentTypeSchema.optional().describe('Filter by content type. Use guide for product or collection guide articles.'),
  content_scope: z.string().optional().describe('Optional site-defined canonical publishing scope for guides, products, or collections. Use kind:key, for example product:example-product. Use an empty string to list unscoped company blog posts when the backend supports it.'),
  q: z.string().optional().describe('Search query across title, content, and translations.'),
  per_page: z.number().int().min(1).max(100).optional().describe('Page size. Defaults to the server value.'),
});

export const listDraftsSchema = listPostsSchema.omit({ status: true });

export const getPostSchema = z.object({
  id_or_slug: z.string().min(1).describe('Numeric ID or slug of the article.'),
});

export const productContextSchema = z.object({
  content_scope: z.string().min(1).describe('Product guide scope in kind:key format, for example product:evisa-helper. Read this before writing a product guide.'),
});

export const createPostSchema = z.object({
  slug: z.string().min(1).describe('Globally unique URL slug.'),
  type: contentTypeSchema.default('technical').describe('Use guide for product or collection guide articles.'),
  content_scope: z.string().optional().describe('Required when type is guide. Use kind:key, for example product:example-product, project:example-project, or collection:example-collection.'),
  locale: localeSchema.default('en').describe('Locale for this single-language submission. Submit one locale per tool call.'),
  title: z.string().min(1).describe('Plain text title for the selected locale. Do not use Markdown here.'),
  excerpt: z.string().optional().describe('Plain text summary for the selected locale. No Markdown headings, tables, or images.'),
  content: z.string().min(1).describe('Markdown article body for the selected locale. Markdown image syntax is allowed. Inline HTML is allowed when useful.'),
  thumbnail: z.string().optional().describe('Optional public image path or URL for the article thumbnail.'),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id_or_slug: z.string().min(1).describe('Numeric ID or slug of the article to update.'),
});

export const updateDraftSchema = updatePostSchema;

export const publishPostSchema = getPostSchema;

export type ListPostsInput = z.infer<typeof listPostsSchema>;
export type ListDraftsInput = z.infer<typeof listDraftsSchema>;
export type GetPostInput = z.infer<typeof getPostSchema>;
export type ProductContextInput = z.infer<typeof productContextSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type PublishPostInput = z.infer<typeof publishPostSchema>;

export function assertContentPostShape(input: { type?: string; content_scope?: string | null }): void {
  const type = input.type ?? 'technical';
  const content_scope = input.content_scope;

  if (type === 'guide' && !content_scope) {
    throw new Error('content_scope is required when type is guide. Use a kind:key value such as product:example-product, project:example-project, or collection:example-collection.');
  }

  if (type !== 'guide' && content_scope) {
    throw new Error('content_scope is only allowed when type is guide. Omit content_scope for unscoped company blog posts.');
  }

  if (content_scope && !/^[a-z][a-z0-9_-]*:[a-z0-9][a-z0-9_-]*$/.test(content_scope)) {
    throw new Error('content_scope must use kind:key format, for example product:example-product.');
  }
}
