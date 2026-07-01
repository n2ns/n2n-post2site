import type { CallToolResult, ResourceLink } from '@modelcontextprotocol/sdk/types.js';

export function createJsonResult(value: unknown, resourceLinks: ResourceLink[] = []): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
      ...resourceLinks,
    ],
    structuredContent: structuredContent(value),
  };
}

export function inventoryResourceUri(targetIdentifier: string): string {
  return `post2site://inventory/resources/${encodeURIComponent(targetIdentifier)}`;
}

export function draftResourceUri(draftId: string): string {
  return `post2site://drafts/${encodeURIComponent(draftId)}`;
}

export function inventoryResourceLink(targetIdentifier: string, name?: string): ResourceLink {
  return {
    type: 'resource_link',
    uri: inventoryResourceUri(targetIdentifier),
    name: name ?? targetIdentifier,
    title: name,
    description: 'Read the full host inventory resource.',
    mimeType: 'application/json',
  };
}

export function draftResourceLink(draftId: string, name?: string): ResourceLink {
  return {
    type: 'resource_link',
    uri: draftResourceUri(draftId),
    name: name ?? draftId,
    title: name,
    description: 'Read the full private server draft state.',
    mimeType: 'application/json',
  };
}

export function addInventoryResourceUris(value: unknown): unknown {
  return addResourceUris(value, 'target_identifier', 'resource_uri', inventoryResourceUri);
}

export function addDraftResourceUris(value: unknown): unknown {
  return addResourceUris(value, 'draft_id', 'resource_uri', draftResourceUri);
}

export function collectInventoryResourceLinks(value: unknown): ResourceLink[] {
  return collectResourceLinks(value, 'target_identifier', (targetIdentifier, item) =>
    inventoryResourceLink(targetIdentifier, displayName(item, targetIdentifier))
  );
}

export function collectDraftResourceLinks(value: unknown): ResourceLink[] {
  return collectResourceLinks(value, 'draft_id', (draftId, item) =>
    draftResourceLink(draftId, displayName(item, draftId))
  );
}

function structuredContent(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : { result: value };
}

function addResourceUris(
  value: unknown,
  idField: string,
  uriField: string,
  uriFor: (id: string) => string
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => addResourceUris(item, idField, uriField, uriFor));
  }

  if (!isRecord(value)) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] = Array.isArray(item)
      ? item.map((entry) => addResourceUris(entry, idField, uriField, uriFor))
      : addResourceUris(item, idField, uriField, uriFor);
  }

  const id = value[idField];
  if (typeof id === 'string' && !next[uriField]) {
    next[uriField] = uriFor(id);
  }

  return next;
}

function collectResourceLinks(
  value: unknown,
  idField: string,
  linkFor: (id: string, item: Record<string, unknown>) => ResourceLink
): ResourceLink[] {
  const links: ResourceLink[] = [];
  collectResourceLinksInto(value, idField, linkFor, links);
  return links;
}

function collectResourceLinksInto(
  value: unknown,
  idField: string,
  linkFor: (id: string, item: Record<string, unknown>) => ResourceLink,
  links: ResourceLink[]
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectResourceLinksInto(item, idField, linkFor, links);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const id = value[idField];
  if (typeof id === 'string') {
    links.push(linkFor(id, value));
  }

  for (const item of Object.values(value)) {
    collectResourceLinksInto(item, idField, linkFor, links);
  }
}

function displayName(item: Record<string, unknown>, fallback: string): string {
  const displayLabel = item.display_label;
  if (typeof displayLabel === 'string' && displayLabel) {
    return displayLabel;
  }

  const targetIdentifier = item.target_identifier;
  if (typeof targetIdentifier === 'string' && targetIdentifier) {
    return targetIdentifier;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
