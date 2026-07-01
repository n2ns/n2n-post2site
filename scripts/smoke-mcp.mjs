#!/usr/bin/env node

import http from 'node:http';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const expectedTools = [
  'n2n_list_inventory',
  'n2n_check_duplicates',
  'n2n_validate_working_draft',
  'n2n_list_drafts',
  'n2n_create_draft',
  'n2n_update_draft',
  'n2n_validate_draft',
  'n2n_preview_draft',
  'n2n_upload_asset',
  'n2n_publish_draft',
];

const expectedResources = [
  'post2site://capabilities',
  'post2site://site-context',
  'post2site://editorial-policy',
  'post2site://inventory/stats',
];

const expectedTemplates = [
  'post2site://inventory/resources/{target_identifier}',
  'post2site://drafts/{draft_id}',
];

const forbiddenTools = [
  'n2n_get_capabilities',
  'n2n_get_site_context',
  'n2n_get_editorial_policy',
  'n2n_get_inventory_resource',
  'n2n_get_inventory_stats',
  'n2n_get_draft',
];

const calls = [];
const backend = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  calls.push({ method: request.method, path: url.pathname });

  void readBody(request).then((body) => {
    route(request.method ?? 'GET', url, body, response);
  }).catch((error) => {
    json(response, 500, { error: { message: error.message } });
  });
});

backend.listen(0, '127.0.0.1');
await once(backend, 'listening');

const { port } = backend.address();
const baseUrl = `http://127.0.0.1:${port}`;
const client = new Client({ name: 'n2n-post2site-smoke', version: '1.0.0' }, {
  capabilities: {
    resources: {},
  },
});
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, 'dist/index.js')],
  cwd: root,
  env: {
    ...safeEnv(),
    CONTENT_API_BASE_URL: baseUrl,
    CONTENT_API_KEY: 'smoke-key',
  },
  stderr: 'pipe',
});

let stderr = '';
transport.stderr?.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await client.connect(transport);

  assertIncludes(client.getInstructions() ?? '', 'passive publishing context as MCP resources', 'server instructions mention resources');

  const capabilities = client.getServerCapabilities();
  assert(capabilities?.tools, 'server advertises tools capability');
  assert(capabilities?.resources, 'server advertises resources capability');
  assert(!capabilities?.prompts, 'server does not advertise prompts capability');
  assert(!capabilities?.completion, 'server does not advertise completion capability');

  const toolsResult = await client.listTools();
  assertSameSet(toolsResult.tools.map((tool) => tool.name), expectedTools, 'tool surface');

  const resourcesResult = await client.listResources();
  assertSameSet(resourcesResult.resources.map((resource) => resource.uri), expectedResources, 'static resources');

  const templatesResult = await client.listResourceTemplates();
  assertSameSet(templatesResult.resourceTemplates.map((template) => template.uriTemplate), expectedTemplates, 'resource templates');

  const caps = await readJsonResource('post2site://capabilities');
  assertEqual(caps.contract, 'post2site-publishing', 'capabilities resource contract');

  const inventoryDetail = await readJsonResource('post2site://inventory/resources/guides%2Fexample-post');
  assertEqual(inventoryDetail.item.target_identifier, 'guides/example-post', 'slash identifier detail resource');

  const draftDetail = await readJsonResource('post2site://drafts/draft_123');
  assertEqual(draftDetail.draft_id, 'draft_123', 'draft detail resource');

  const inventoryList = await client.callTool({
    name: 'n2n_list_inventory',
    arguments: { q: 'example', per_page: 10 },
  });
  assertResourceLink(inventoryList, 'post2site://inventory/resources/guides%2Fexample-post');
  assertEqual(
    inventoryList.structuredContent.data[0].resource_uri,
    'post2site://inventory/resources/guides%2Fexample-post',
    'inventory structuredContent contains resource_uri'
  );

  const draftCreate = await client.callTool({
    name: 'n2n_create_draft',
    arguments: {
      mode: 'create',
      target_identifier: 'example-post',
      content_payload: { title: 'Example' },
    },
  });
  assertResourceLink(draftCreate, 'post2site://drafts/draft_123');

  await assertToolUnavailable(forbiddenTools[0]);

  assert(
    calls.some((call) => call.path === '/inventory/resources/guides%2Fexample-post'),
    'backend received encoded slash identifier path'
  );

  console.log('MCP smoke passed');
  console.log(`tools=${expectedTools.length} resources=${expectedResources.length} templates=${expectedTemplates.length}`);
} catch (error) {
  if (stderr.trim()) {
    console.error('Server stderr:');
    console.error(stderr.trim());
  }
  throw error;
} finally {
  await transport.close().catch(() => {});
  backend.close();
  await once(backend, 'close').catch(() => {});
}

async function readJsonResource(uri) {
  const result = await client.readResource({ uri });
  const first = result.contents[0];
  assert(first, `resource ${uri} returned content`);
  assertEqual(first.mimeType, 'application/json', `${uri} mime type`);
  assert(typeof first.text === 'string', `${uri} returned text`);
  return JSON.parse(first.text);
}

function route(method, url, body, response) {
  if (method === 'GET' && url.pathname === '/capabilities') {
    return json(response, 200, {
      contract: 'post2site-publishing',
      host_profile: 'smoke-host',
      workflow: { supports_drafts: true },
      host_schema: {
        content_fields: {},
        inventory: {
          filterable_fields: ['q'],
          summary_fields: ['display_label'],
          stats_dimensions: ['status'],
        },
      },
    });
  }

  if (method === 'GET' && url.pathname === '/site-context') {
    return json(response, 200, { summary: 'Smoke host' });
  }

  if (method === 'GET' && url.pathname === '/editorial-policy') {
    return json(response, 200, {
      policy_version: 'smoke',
      content_model: { required_fields: [], optional_fields: [], field_paths: {} },
      publish_blockers: [],
    });
  }

  if (method === 'GET' && url.pathname === '/inventory/stats') {
    return json(response, 200, { dimensions: { status: { published: 1 } } });
  }

  if (method === 'GET' && url.pathname === '/inventory/resources') {
    return json(response, 200, {
      data: [inventoryItem('guides/example-post')],
      next_cursor: null,
    });
  }

  if (method === 'GET' && url.pathname.startsWith('/inventory/resources/')) {
    const targetIdentifier = decodeURIComponent(url.pathname.slice('/inventory/resources/'.length));
    return json(response, 200, {
      item: inventoryItem(targetIdentifier),
      host_metadata: {},
    });
  }

  if (method === 'POST' && url.pathname === '/inventory/duplicates') {
    return json(response, 200, { duplicate_risk: 'low', matches: [], checked_payload: body });
  }

  if (method === 'POST' && url.pathname === '/working-drafts/validate') {
    return json(response, 200, { publishable: true, issues: [] });
  }

  if (method === 'GET' && url.pathname === '/drafts') {
    return json(response, 200, {
      data: [draftEnvelope('draft_123')],
      next_cursor: null,
    });
  }

  if (method === 'POST' && url.pathname === '/drafts') {
    return json(response, 201, draftEnvelope('draft_123', body));
  }

  if (method === 'GET' && url.pathname === '/drafts/draft_123') {
    return json(response, 200, draftEnvelope('draft_123'));
  }

  if (method === 'PATCH' && url.pathname === '/drafts/draft_123') {
    return json(response, 200, { ...draftEnvelope('draft_123', body), version: 2 });
  }

  if (method === 'POST' && url.pathname === '/drafts/draft_123/validate') {
    return json(response, 200, { draft_id: 'draft_123', publishable: true, issues: [] });
  }

  if (method === 'GET' && url.pathname === '/drafts/draft_123/preview') {
    return json(response, 200, {
      draft_id: 'draft_123',
      preview_url: 'https://example.com/preview/draft_123',
      expires_at: '2026-07-01T12:00:00Z',
    });
  }

  if (method === 'POST' && url.pathname === '/drafts/draft_123/publish') {
    return json(response, 200, {
      draft_id: 'draft_123',
      status: 'published',
      canonical_url: 'https://example.com/resources/example-post',
    });
  }

  if (method === 'POST' && url.pathname === '/assets') {
    return json(response, 201, {
      asset_id: 'asset_123',
      purpose: body.purpose,
      content_type: body.content_type,
      url: 'https://example.com/assets/asset_123',
    });
  }

  return json(response, 404, { error: { code: 'not_found', path: url.pathname } });
}

function inventoryItem(targetIdentifier) {
  return {
    id: 'resource_guides_example_post',
    target_identifier: targetIdentifier,
    display_label: 'Example Post',
    urls: { canonical: 'https://example.com/guides/example-post', localized: {} },
    summary: {},
    host_fields: {},
  };
}

function draftEnvelope(draftId, payload = {}) {
  return {
    draft_id: draftId,
    mode: payload.mode ?? 'create',
    target_identifier: payload.target_identifier ?? 'example-post',
    status: 'draft',
    content_payload: payload.content_payload ?? { title: 'Example' },
    validation_state: { publishable: true },
    version: 1,
  };
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(value));
}

function assertResourceLink(result, uri) {
  assert(
    result.content.some((item) => item.type === 'resource_link' && item.uri === uri),
    `result contains resource_link ${uri}`
  );
}

async function assertToolUnavailable(name) {
  try {
    const result = await client.callTool({ name, arguments: {} });
    assert(result.isError === true, `deleted read tool ${name} returns an error result`);
  } catch {
    return;
  }
}

function assertSameSet(actual, expected, label) {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  assertEqual(JSON.stringify(sortedActual), JSON.stringify(sortedExpected), label);
}

function assertIncludes(value, expected, label) {
  assert(String(value).includes(expected), `${label}: expected to include ${expected}`);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function safeEnv() {
  return Object.fromEntries(Object.entries(process.env).filter((entry) => typeof entry[1] === 'string'));
}
