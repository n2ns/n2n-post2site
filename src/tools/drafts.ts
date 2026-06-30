import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import { createTextResult } from '../result.js';
import {
  createDraftSchema,
  getDraftSchema,
  listDraftsSchema,
  previewDraftSchema,
  updateDraftSchema,
  validateDraftSchema,
  validateWorkingDraftSchema,
} from '../schemas/blog-post.js';

export function registerDraftTools(server: McpServer, client: ContentClient): void {
  server.tool(
    'n2n_validate_working_draft',
    'Run backend validation against a local-only working draft without creating a server draft or uploading assets.',
    validateWorkingDraftSchema.shape,
    async (input) => {
      const parsed = validateWorkingDraftSchema.parse(input);
      return createTextResult(await client.validateWorkingDraft(parsed));
    }
  );

  server.tool(
    'n2n_list_drafts',
    'List server-side drafts previously saved through n2n_create_draft.',
    listDraftsSchema.shape,
    async (input) => {
      const parsed = listDraftsSchema.parse(input);
      return createTextResult(await client.listDrafts(parsed));
    }
  );

  server.tool(
    'n2n_create_draft',
    'Create a server-side draft only after the working draft is confirmed for remote saving. content_payload is host-defined.',
    createDraftSchema.shape,
    async (input) => {
      const parsed = createDraftSchema.parse(input);
      return createTextResult(await client.createDraft(parsed));
    }
  );

  server.tool(
    'n2n_get_draft',
    'Read one server-side draft by draft_id before updating, previewing, or publishing it.',
    getDraftSchema.shape,
    async (input) => {
      const parsed = getDraftSchema.parse(input);
      return createTextResult(await client.getDraft(parsed));
    }
  );

  server.tool(
    'n2n_update_draft',
    'Update a server-side draft.',
    updateDraftSchema.shape,
    async (input) => {
      const parsed = updateDraftSchema.parse(input);
      return createTextResult(await client.updateDraft(parsed));
    }
  );

  server.tool(
    'n2n_validate_draft',
    'Validate a saved server draft in draft or publish mode and return host blockers and warnings.',
    validateDraftSchema.shape,
    async (input) => {
      const parsed = validateDraftSchema.parse(input);
      return createTextResult(await client.validateDraft(parsed));
    }
  );

  server.tool(
    'n2n_preview_draft',
    'Return host preview URLs for a saved server draft. Use this before publish confirmation.',
    previewDraftSchema.shape,
    async (input) => {
      const parsed = previewDraftSchema.parse(input);
      return createTextResult(await client.previewDraft(parsed));
    }
  );
}
