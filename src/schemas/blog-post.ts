import { z } from 'zod';

export const statusSchema = z.enum(['draft', 'published']);
export const capabilitiesSchema = z.object({});

const CONTENT_SCOPE_FORMAT = /^[a-z][a-z0-9_-]*:[a-z0-9][a-z0-9_-]*$/;

export const listPostsSchema = z.object({
  status: statusSchema.optional().describe('Filter by publication status.'),
  type: z.string().optional().describe('Filter by content type. Call n2n_get_capabilities for supported types.'),
  content_scope: z.string().optional().describe('Filter by content_scope (kind:key). Use an empty string to list unscoped posts when the backend supports it.'),
  q: z.string().optional().describe('Search query across title and content.'),
  per_page: z.number().int().min(1).max(100).optional().describe('Page size. Defaults to the server value.'),
});

export const listDraftsSchema = listPostsSchema.omit({ status: true });

export const getPostSchema = z.object({
  id_or_slug: z.string().min(1).describe('Numeric ID or slug of the article.'),
});

export const scopeContextSchema = z.object({
  content_scope: z.string().min(1).describe('Content scope in kind:key format, for example product:example. Read this before writing scoped content. Call n2n_get_capabilities for supported kinds.'),
});

export const createPostSchema = z.object({
  slug: z.string().min(1).describe('Globally unique URL slug.'),
  type: z.string().optional().describe('Content type. Call n2n_get_capabilities for supported types. The backend applies its default when omitted.'),
  content_scope: z.string().optional().describe('Optional kind:key categorization, for example product:example. The backend requires it for certain content types; call n2n_get_capabilities for supported kinds, examples, and which types require it.'),
  locale: z.string().optional().describe('Single-locale code for this submission. Submit one locale per call. Call n2n_get_capabilities for supported locales. The backend applies its default when omitted.'),
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
export type ScopeContextInput = z.infer<typeof scopeContextSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type PublishPostInput = z.infer<typeof publishPostSchema>;

/**
 * Contract-level format check only. Whether a content_scope is required or
 * prohibited for a given type is decided by the backend (capabilities
 * .content.content_scope.required_for_types) and enforced server-side.
 */
export function assertContentScopeFormat(contentScope?: string | null): void {
  if (contentScope && !CONTENT_SCOPE_FORMAT.test(contentScope)) {
    throw new Error('content_scope must use kind:key format, for example product:example.');
  }
}
