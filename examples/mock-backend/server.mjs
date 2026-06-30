#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.API_KEY ?? 'demo-key';

const now = () => new Date().toISOString();
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
};

const inventory = new Map([
  ['welcome-guide', {
    id: 'post_1',
    target_identifier: 'welcome-guide',
    display_label: 'Welcome Guide',
    status: 'published',
    urls: { canonical: `http://127.0.0.1:${PORT}/blog/welcome-guide` },
    summary: 'Seeded published guide.',
    host_fields: { type: 'guide', topics: ['getting-started'] },
  }],
]);
const drafts = new Map();
const assets = new Map();

const capabilities = {
  contract: 'post2site-publishing',
  contract_version: '1.0',
  package_version: 'mock',
  base_path: '/',
  host_profile: 'mock-backend',
  workflow: {
    statuses: ['draft', 'published'],
    default_status: 'draft',
    supports_drafts: true,
    supports_preview: true,
    supports_assets: true,
    supports_publish_confirmation: true,
  },
  auth: {
    required: true,
    mode: 'api_key',
    header: 'X-API-KEY',
    authorization_header_supported: false,
    client_attribution: false,
  },
  endpoints: {
    capabilities: 'GET /capabilities',
    site_context: 'GET /site-context',
    editorial_policy: 'GET /editorial-policy',
    inventory_resources: 'GET /inventory/resources',
    inventory_resource: 'GET /inventory/resources/{target_identifier}',
    inventory_stats: 'GET /inventory/stats',
    inventory_duplicates: 'POST /inventory/duplicates',
    working_draft_validate: 'POST /working-drafts/validate',
    drafts: 'GET /drafts',
    create_draft: 'POST /drafts',
    get_draft: 'GET /drafts/{draft_id}',
    update_draft: 'PATCH /drafts/{draft_id}',
    validate_draft: 'POST /drafts/{draft_id}/validate',
    preview_draft: 'GET /drafts/{draft_id}/preview',
    publish_draft: 'POST /drafts/{draft_id}/publish',
    upload_asset: 'POST /assets',
  },
  host_schema: {
    default_locale: 'en',
    locales: ['en', 'zh'],
    types: ['guide', 'note'],
    topics: ['getting-started', 'release-notes'],
    content_fields: {
      type: { field_path: 'content_payload.type', required_for_publish: true },
      topics: { field_path: 'content_payload.topics', required_for_publish: true },
      locales: { field_path: 'content_payload.locales', required_for_publish: true },
      thumbnail_asset_id: { field_path: 'content_payload.thumbnail_asset_id', required_for_publish: false },
    },
    asset_limits: {
      allowed_content_types: ['image/webp', 'image/png', 'image/jpeg'],
      allowed_purposes: ['blog_thumbnail'],
      max_bytes: 3145728,
    },
  },
  safety: {
    delete_exposed: false,
    database_access_exposed: false,
    shell_access_exposed: false,
    server_operations_exposed: false,
  },
};

const forbiddenPayloadFields = new Set([
  'status',
  'published_at',
  'author',
  'content_origin',
  'managed_by',
  'authoring_source',
  'source_type',
  'content_scope',
]);

const siteContext = {
  site_name: 'Mock Site',
  default_locale: 'en',
  supported_locales: ['en', 'zh'],
  public_url_patterns: {
    default: '/blog/{target_identifier}',
  },
};

const editorialPolicy = {
  policy_version: 'mock-1',
  content_model: {
    required_fields: ['target_identifier', 'content_payload.locales.en.title', 'content_payload.locales.en.content'],
    optional_fields: ['content_payload.thumbnail_asset_id'],
    field_paths: {
      title: 'content_payload.locales.en.title',
      content: 'content_payload.locales.en.content',
    },
  },
  source_rules: [],
  cta_rules: [],
  prohibited_claims: [],
  publish_blockers: ['missing_title', 'missing_content'],
  host_metadata: {},
};

const isAuthorized = (req) => req.headers['x-api-key'] === API_KEY;

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

function validatePayload(targetIdentifier, payload) {
  const issues = [];
  if (!targetIdentifier) {
    issues.push(issue('missing_target_identifier', 'target_identifier', 'blocker', 'Target identifier is required.'));
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    issues.push(issue('invalid_content_payload', 'content_payload', 'blocker', 'content_payload must be an object.'));
    return issues;
  }
  for (const field of forbiddenPayloadFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      issues.push(issue('server_managed_field', `content_payload.${field}`, 'blocker', `${field} is managed by the host application.`));
    }
  }
  if (!payload.type) {
    issues.push(issue('missing_type', 'content_payload.type', 'blocker', 'type is required.'));
  }
  const en = payload.locales?.en;
  if (!en?.title) {
    issues.push(issue('missing_title', 'content_payload.locales.en.title', 'blocker', 'English title is required.'));
  }
  if (!en?.content) {
    issues.push(issue('missing_content', 'content_payload.locales.en.content', 'blocker', 'English content is required.'));
  }
  return issues;
}

function issue(code, field, severity, message) {
  return { code, field, severity, source: 'mock', message };
}

function validationResult(mode, targetIdentifier, payload) {
  const blockers = validatePayload(targetIdentifier, payload);
  return {
    mode,
    publishable: blockers.length === 0,
    blockers,
    warnings: [],
    normalized_payload: payload,
  };
}

function envelope(draft) {
  return {
    draft_id: draft.draft_id,
    mode: draft.mode,
    target_identifier: draft.target_identifier,
    status: draft.status,
    content_payload: draft.content_payload,
    asset_refs: draft.asset_refs,
    validation_state: draft.validation_state,
    created_at: draft.created_at,
    updated_at: draft.updated_at,
  };
}

function assetRefs(payload) {
  return typeof payload?.thumbnail_asset_id === 'string' ? [payload.thumbnail_asset_id] : [];
}

const server = createServer(async (req, res) => {
  if (!isAuthorized(req)) return json(res, 401, { error: { code: 'unauthorized', message: 'Unauthorized' } });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    if (method === 'GET' && path === '/capabilities') return json(res, 200, capabilities);
    if (method === 'GET' && path === '/site-context') return json(res, 200, siteContext);
    if (method === 'GET' && path === '/editorial-policy') return json(res, 200, editorialPolicy);

    if (method === 'GET' && path === '/inventory/resources') {
      const q = url.searchParams.get('q')?.toLowerCase();
      let items = [...inventory.values()];
      if (q) items = items.filter((item) => item.display_label.toLowerCase().includes(q) || item.target_identifier.includes(q));
      return json(res, 200, { items, host_metadata: { total: items.length } });
    }

    let match = path.match(/^\/inventory\/resources\/([^/]+)$/);
    if (method === 'GET' && match) {
      const item = inventory.get(decodeURIComponent(match[1]));
      return item ? json(res, 200, { item, host_metadata: {} }) : json(res, 404, { error: { code: 'not_found', message: 'Not found' } });
    }

    if (method === 'GET' && path === '/inventory/stats') {
      return json(res, 200, { topics: { 'getting-started': 1 }, host_metadata: {} });
    }

    if (method === 'POST' && path === '/inventory/duplicates') {
      const body = await readBody(req);
      const target = body.target_identifier;
      const duplicate = typeof target === 'string' && inventory.has(target);
      return json(res, 200, {
        duplicate,
        issues: duplicate ? [issue('duplicate_conflict_high', 'target_identifier', 'blocker', 'Target already exists.')] : [],
        candidates: duplicate ? [inventory.get(target)] : [],
      });
    }

    if (method === 'POST' && path === '/working-drafts/validate') {
      const body = await readBody(req);
      const article = body.article ?? {};
      const validation = validationResult(body.mode ?? 'draft', article.target_identifier, article.content_payload ?? {});
      return json(res, validation.blockers.length ? 422 : 200, validation);
    }

    if (method === 'GET' && path === '/drafts') {
      const status = url.searchParams.get('status');
      let data = [...drafts.values()];
      if (status) data = data.filter((draft) => draft.status === status);
      return json(res, 200, { data: data.map(envelope), next_cursor: null });
    }

    if (method === 'POST' && path === '/drafts') {
      const body = await readBody(req);
      const validation = validationResult('draft', body.target_identifier, body.content_payload ?? {});
      if (validation.blockers.some((blocker) => blocker.code === 'server_managed_field')) {
        return json(res, 422, validation);
      }
      const draft = {
        draft_id: `draft_${randomUUID()}`,
        mode: body.mode,
        target_identifier: body.target_identifier ?? null,
        status: 'draft',
        content_payload: body.content_payload ?? {},
        asset_refs: assetRefs(body.content_payload),
        validation_state: validation,
        created_at: now(),
        updated_at: now(),
      };
      drafts.set(draft.draft_id, draft);
      return json(res, 201, envelope(draft));
    }

    match = path.match(/^\/drafts\/([^/]+)$/);
    if (match) {
      const draft = drafts.get(decodeURIComponent(match[1]));
      if (!draft) return json(res, 404, { error: { code: 'not_found', message: 'Draft not found' } });
      if (method === 'GET') return json(res, 200, envelope(draft));
      if (method === 'PATCH') {
        const body = await readBody(req);
        const nextPayload = body.content_payload ?? draft.content_payload;
        const validation = validationResult('draft', 'target_identifier' in body ? body.target_identifier : draft.target_identifier, nextPayload);
        if (validation.blockers.some((blocker) => blocker.code === 'server_managed_field')) {
          return json(res, 422, validation);
        }
        if (body.mode) draft.mode = body.mode;
        if ('target_identifier' in body) draft.target_identifier = body.target_identifier;
        if (body.content_payload) {
          draft.content_payload = body.content_payload;
          draft.asset_refs = assetRefs(body.content_payload);
        }
        draft.updated_at = now();
        draft.validation_state = validationResult('draft', draft.target_identifier, draft.content_payload);
        return json(res, 200, envelope(draft));
      }
    }

    match = path.match(/^\/drafts\/([^/]+)\/validate$/);
    if (method === 'POST' && match) {
      const draft = drafts.get(decodeURIComponent(match[1]));
      if (!draft) return json(res, 404, { error: { code: 'not_found', message: 'Draft not found' } });
      const body = await readBody(req);
      draft.validation_state = validationResult(body.mode ?? 'draft', draft.target_identifier, draft.content_payload);
      return json(res, draft.validation_state.blockers.length ? 422 : 200, draft.validation_state);
    }

    match = path.match(/^\/drafts\/([^/]+)\/preview$/);
    if (method === 'GET' && match) {
      const draft = drafts.get(decodeURIComponent(match[1]));
      if (!draft) return json(res, 404, { error: { code: 'not_found', message: 'Draft not found' } });
      return json(res, 200, {
        draft_id: draft.draft_id,
        preview_url: `http://127.0.0.1:${PORT}/preview/${draft.draft_id}`,
        preview_urls: { en: `http://127.0.0.1:${PORT}/preview/${draft.draft_id}?locale=en` },
        expires_at: null,
        host_metadata: {},
      });
    }

    match = path.match(/^\/drafts\/([^/]+)\/publish$/);
    if (method === 'POST' && match) {
      const draft = drafts.get(decodeURIComponent(match[1]));
      if (!draft) return json(res, 404, { error: { code: 'not_found', message: 'Draft not found' } });
      const body = await readBody(req);
      if (!body.publish_confirmed) return json(res, 422, { error: { code: 'validation_failed', message: 'Publish requires publish confirmation.' } });
      const validation = validationResult('publish', draft.target_identifier, draft.content_payload);
      if (validation.blockers.length) return json(res, 422, validation);
      draft.status = 'published';
      const result = {
        resource_id: `post_${draft.draft_id}`,
        status: 'published',
        canonical_url: `http://127.0.0.1:${PORT}/blog/${draft.target_identifier}`,
        localized_urls: { en: `http://127.0.0.1:${PORT}/blog/${draft.target_identifier}` },
        host_metadata: {},
      };
      inventory.set(draft.target_identifier, {
        id: result.resource_id,
        target_identifier: draft.target_identifier,
        display_label: draft.content_payload.locales?.en?.title ?? draft.target_identifier,
        status: 'published',
        urls: { canonical: result.canonical_url },
        summary: draft.content_payload.locales?.en?.excerpt ?? '',
        host_fields: { type: draft.content_payload.type, topics: draft.content_payload.topics ?? [] },
      });
      return json(res, 200, result);
    }

    if (method === 'POST' && path === '/assets') {
      const body = await readBody(req);
      if (!body.data_base64) return json(res, 422, { error: { code: 'validation_failed', message: 'data_base64 is required.' } });
      const assetId = `asset_${randomUUID()}`;
      const result = {
        asset_id: assetId,
        purpose: body.purpose,
        url: `http://127.0.0.1:${PORT}/assets/${assetId}`,
        content_type: body.content_type,
        width: null,
        height: null,
        validation: {},
        metadata: body.metadata ?? {},
      };
      assets.set(assetId, result);
      return json(res, 201, result);
    }

    return json(res, 404, { error: { code: 'not_found', message: `No route for ${method} ${path}` } });
  } catch (error) {
    return json(res, 400, { error: { code: 'bad_request', message: error instanceof Error ? error.message : String(error) } });
  }
});

server.listen(PORT, () => {
  console.log(`Mock Post2Site backend listening on http://127.0.0.1:${PORT}`);
});
