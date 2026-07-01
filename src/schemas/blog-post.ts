import { z } from 'zod';

export const emptySchema = z.object({});
export const draftModeSchema = z.enum(['create', 'update_existing']);
export const validationModeSchema = z.enum(['draft', 'publish']);

const contentPayloadSchema = z.record(z.unknown()).describe('Host-defined JSON object. Read post2site://capabilities before shaping it.');
const clientMetadataSchema = z.record(z.unknown()).optional().describe('Optional non-secret client metadata for backend attribution.');

export const listInventorySchema = z.object({
  target_identifier: z.string().optional().describe('Optional host target identifier, usually a slug.'),
  status: z.string().optional().describe('Optional host-defined status filter.'),
  type: z.string().optional().describe('Optional host-defined content type filter.'),
  topic: z.string().optional().describe('Optional host-defined topic filter.'),
  q: z.string().optional().describe('Optional search query.'),
  per_page: z.number().int().min(1).max(100).optional().describe('Maximum result count.'),
});

export const getInventoryResourceSchema = z.object({
  target_identifier: z.string().min(1).describe('Host target identifier, usually a slug.'),
});

export const inventoryStatsSchema = z.object({
  type: z.string().optional().describe('Optional host-defined type filter.'),
  topic: z.string().optional().describe('Optional host-defined topic filter.'),
});

export const checkDuplicatesSchema = z.object({
  mode: draftModeSchema.optional().describe('Authoring mode for duplicate checks.'),
  target_identifier: z.string().optional().describe('Proposed host target identifier, usually a slug.'),
  content_payload: contentPayloadSchema,
  client_metadata: clientMetadataSchema,
});

export const draftArticleSchema = z.object({
  mode: draftModeSchema,
  target_identifier: z.string().optional().describe('Host target identifier, usually a slug.'),
  content_payload: contentPayloadSchema,
  client_metadata: clientMetadataSchema,
});

export const validateWorkingDraftSchema = z.object({
  mode: validationModeSchema.optional().describe('Validation strictness. draft is lenient; publish applies publish blockers.'),
  article: draftArticleSchema,
});

export const listDraftsSchema = z.object({
  status: z.string().optional().describe('Optional draft status filter, for example draft or published.'),
  per_page: z.number().int().min(1).max(100).optional().describe('Maximum result count.'),
});

export const createDraftSchema = draftArticleSchema;

export const getDraftSchema = z.object({
  draft_id: z.string().min(1).describe('Server draft id returned by n2n_create_draft or n2n_list_drafts.'),
});

export const updateDraftSchema = z.object({
  draft_id: z.string().min(1).describe('Server draft id.'),
  mode: draftModeSchema.optional(),
  target_identifier: z.string().optional(),
  content_payload: contentPayloadSchema.optional(),
  client_metadata: clientMetadataSchema,
});

export const validateDraftSchema = z.object({
  draft_id: z.string().min(1).describe('Server draft id.'),
  mode: validationModeSchema.optional().describe('Validation strictness.'),
});

export const previewDraftSchema = getDraftSchema;

export const uploadAssetSchema = z.object({
  draft_id: z.string().optional().describe('Optional server draft id to bind the asset immediately.'),
  purpose: z.string().min(1).describe('Host-declared asset purpose. Read post2site://capabilities first.'),
  filename: z.string().min(1).describe('Original filename for the selected asset.'),
  content_type: z.string().min(1).describe('MIME type, for example image/webp.'),
  data_base64: z.string().min(1).describe('Base64 encoded selected asset bytes. Upload only the selected image.'),
  metadata: z.record(z.unknown()).optional().describe('Optional asset metadata such as alt text or provenance.'),
});

export const publishDraftSchema = z.object({
  draft_id: z.string().min(1).describe('Server draft id.'),
  publish_confirmed: z.boolean().refine((value) => value === true, {
    message: 'Publishing requires explicit publish confirmation.',
  }),
  acknowledged_warnings: z.array(z.string()).optional().describe('Warning codes explicitly acknowledged before publish.'),
});

export type ListInventoryInput = z.infer<typeof listInventorySchema>;
export type GetInventoryResourceInput = z.infer<typeof getInventoryResourceSchema>;
export type InventoryStatsInput = z.infer<typeof inventoryStatsSchema>;
export type CheckDuplicatesInput = z.infer<typeof checkDuplicatesSchema>;
export type ValidateWorkingDraftInput = z.infer<typeof validateWorkingDraftSchema>;
export type ListDraftsInput = z.infer<typeof listDraftsSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type GetDraftInput = z.infer<typeof getDraftSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type ValidateDraftInput = z.infer<typeof validateDraftSchema>;
export type PreviewDraftInput = z.infer<typeof previewDraftSchema>;
export type UploadAssetInput = z.infer<typeof uploadAssetSchema>;
export type PublishDraftInput = z.infer<typeof publishDraftSchema>;
