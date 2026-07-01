import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

import { ContentClient } from '../content-client.js';
import { draftResourceUri, inventoryResourceUri } from '../result.js';

const JSON_MIME = 'application/json';
const DETAIL_RESOURCE_MAX_BYTES = 200 * 1024;

export function registerResources(server: McpServer, client: ContentClient): void {
  registerDiscoveryResources(server, client);
  registerInventoryResources(server, client);
  registerDraftResources(server, client);
}

function registerDiscoveryResources(server: McpServer, client: ContentClient): void {
  server.registerResource(
    'post2site-capabilities',
    'post2site://capabilities',
    {
      title: 'Post2Site Capabilities',
      description: 'Publishing contract, workflow flags, auth mode, endpoints, and host schema summary.',
      mimeType: JSON_MIME,
      annotations: { audience: ['assistant'], priority: 1 },
    },
    async (uri) => jsonResource(uri.toString(), await client.getCapabilities())
  );

  server.registerResource(
    'post2site-site-context',
    'post2site://site-context',
    {
      title: 'Post2Site Site Context',
      description: 'Host positioning, locale, public URL, and content orientation context.',
      mimeType: JSON_MIME,
      annotations: { audience: ['assistant'], priority: 0.9 },
    },
    async (uri) => jsonResource(uri.toString(), await client.getSiteContext())
  );

  server.registerResource(
    'post2site-editorial-policy',
    'post2site://editorial-policy',
    {
      title: 'Post2Site Editorial Policy',
      description: 'Required fields, evidence rules, CTA rules, prohibited claims, and publish blockers.',
      mimeType: JSON_MIME,
      annotations: { audience: ['assistant'], priority: 1 },
    },
    async (uri) => jsonResource(uri.toString(), await client.getEditorialPolicy())
  );
}

function registerInventoryResources(server: McpServer, client: ContentClient): void {
  server.registerResource(
    'post2site-inventory-stats',
    'post2site://inventory/stats',
    {
      title: 'Post2Site Inventory Stats',
      description: 'Unfiltered host inventory statistics.',
      mimeType: JSON_MIME,
      annotations: { audience: ['assistant'], priority: 0.7 },
    },
    async (uri) => jsonResource(uri.toString(), await client.getInventoryStats({}))
  );

  server.registerResource(
    'post2site-inventory-resource',
    new ResourceTemplate('post2site://inventory/resources/{target_identifier}', { list: undefined }),
    {
      title: 'Post2Site Inventory Resource',
      description: 'A single host inventory resource by target identifier. Private data depends on host policy.',
      mimeType: JSON_MIME,
    },
    async (_uri, variables) => {
      const targetIdentifier = requiredTemplateValue(variables.target_identifier, 'target_identifier');
      const result = await client.getInventoryResource({ target_identifier: targetIdentifier });
      return jsonResource(inventoryResourceUri(targetIdentifier), result, DETAIL_RESOURCE_MAX_BYTES);
    }
  );
}

function registerDraftResources(server: McpServer, client: ContentClient): void {
  server.registerResource(
    'post2site-draft',
    new ResourceTemplate('post2site://drafts/{draft_id}', { list: undefined }),
    {
      title: 'Post2Site Private Draft',
      description: 'Private server draft state by draft_id. Do not attach unless this draft is relevant to the current task.',
      mimeType: JSON_MIME,
    },
    async (_uri, variables) => {
      const draftId = requiredTemplateValue(variables.draft_id, 'draft_id');
      const result = await client.getDraft({ draft_id: draftId });
      return jsonResource(draftResourceUri(draftId), result, DETAIL_RESOURCE_MAX_BYTES);
    }
  );
}

function jsonResource(uri: string, value: unknown, maxBytes?: number): ReadResourceResult {
  const text = JSON.stringify(value, null, 2);
  const bytes = Buffer.byteLength(text, 'utf8');

  if (maxBytes !== undefined && bytes > maxBytes) {
    throw new Error(`Resource ${uri} is ${bytes} bytes, exceeding the ${maxBytes} byte JSON limit.`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: JSON_MIME,
        text,
      },
    ],
  };
}

function requiredTemplateValue(value: string | string[] | undefined, name: string): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    throw new Error(`Missing resource template variable: ${name}`);
  }

  return decodeOnce(raw);
}

function decodeOnce(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
