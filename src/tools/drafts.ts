import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { ContentClient } from '../content-client.js';
import {
  addDraftResourceUris,
  collectDraftResourceLinks,
  createJsonResult,
  draftResourceLink,
} from '../result.js';
import {
  createDraftSchema,
  listDraftsSchema,
  previewDraftSchema,
  updateDraftSchema,
  validateDraftSchema,
  validateWorkingDraftSchema,
} from '../schemas/blog-post.js';

export function registerDraftTools(server: McpServer, client: ContentClient): void {
  server.registerTool(
    'n2n_validate_working_draft',
    {
      title: 'Validate Working Draft',
      description: 'Run backend validation against a local-only working draft without creating a server draft or uploading assets.',
      inputSchema: validateWorkingDraftSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      const parsed = validateWorkingDraftSchema.parse(input);
      return createJsonResult(await client.validateWorkingDraft(parsed));
    }
  );

  server.registerTool(
    'n2n_list_drafts',
    {
      title: 'List Drafts',
      description: 'List server-side drafts previously saved through n2n_create_draft. Returned items include canonical post2site:// draft resource URIs for detail reads.',
      inputSchema: listDraftsSchema.shape,
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      const parsed = listDraftsSchema.parse(input);
      const result = addDraftResourceUris(await client.listDrafts(parsed));
      return createJsonResult(result, collectDraftResourceLinks(result));
    }
  );

  server.registerTool(
    'n2n_create_draft',
    {
      title: 'Create Draft',
      description: 'Create a server-side draft only after the working draft is confirmed for remote saving. content_payload is host-defined.',
      inputSchema: createDraftSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async (input) => {
      const parsed = createDraftSchema.parse(input);
      const result = addDraftResourceUris(await client.createDraft(parsed));
      return createJsonResult(result, collectDraftResourceLinks(result));
    }
  );

  server.registerTool(
    'n2n_update_draft',
    {
      title: 'Update Draft',
      description: 'Update a server-side draft.',
      inputSchema: updateDraftSchema.shape,
      annotations: { readOnlyHint: false },
    },
    async (input) => {
      const parsed = updateDraftSchema.parse(input);
      const result = addDraftResourceUris(await client.updateDraft(parsed));
      return createJsonResult(result, [draftResourceLink(parsed.draft_id)]);
    }
  );

  server.registerTool(
    'n2n_validate_draft',
    {
      title: 'Validate Draft',
      description: 'Validate a saved server draft in draft or publish mode and return host blockers and warnings.',
      inputSchema: validateDraftSchema.shape,
      annotations: { readOnlyHint: false },
    },
    async (input) => {
      const parsed = validateDraftSchema.parse(input);
      return createJsonResult(await client.validateDraft(parsed), [draftResourceLink(parsed.draft_id)]);
    }
  );

  server.registerTool(
    'n2n_preview_draft',
    {
      title: 'Preview Draft',
      description: 'Return host preview URLs for a saved server draft. Use this before publish confirmation.',
      inputSchema: previewDraftSchema.shape,
      annotations: { readOnlyHint: false },
    },
    async (input) => {
      const parsed = previewDraftSchema.parse(input);
      const result = addDraftResourceUris(await client.previewDraft(parsed));
      return createJsonResult(result, [draftResourceLink(parsed.draft_id)]);
    }
  );
}
