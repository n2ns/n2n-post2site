#!/usr/bin/env node
// Minimal reference backend for the n2n-post2site Content Publishing API Contract.
// Zero dependencies, in-memory storage. For local testing only — not for production.
//
//   API_KEY=demo-key PORT=8787 node server.mjs
//
// Then point the MCP server at it:
//   CONTENT_API_BASE_URL=http://127.0.0.1:8787
//   CONTENT_API_KEY=demo-key
//
// See ../../docs/BACKEND_API.md for the full contract this implements.

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.API_KEY ?? 'demo-key';

// --- Contract data ---------------------------------------------------------

const SUPPORTED_LOCALES = ['en', 'zh'];

const CAPABILITIES = {
  content: {
    types: ['note', 'guide'],
    statuses: ['draft', 'published'],
    locales: SUPPORTED_LOCALES,
    input_fields: ['slug', 'type', 'content_scope', 'locale', 'title', 'excerpt', 'content'],
    content_scope: {
      format: 'kind:key',
      kinds: ['product'],
      examples: ['product:example-product'],
      required_for_types: ['guide'], // notes are unscoped; guides require a scope
    },
  },
  scopes: ['product:example-product'],
  safety: {
    server_managed_fields: ['status', 'published_at', 'user_id', 'author'],
  },
};

const SCOPES = {
  'product:example-product': {
    content_scope: 'product:example-product',
    canonical_url: 'https://example.com/products/example-product',
    docs_url: 'https://example.com/docs/example-product',
    summary: 'Example Product is a demo product used by the mock backend.',
    key_points: ['Runs locally', 'Has a free tier', 'Supports en and zh'],
    do_not_claim: ['Do not claim it is the fastest on the market.'],
  },
};

// In-memory posts. Each record is a single (slug, locale) version.
let nextId = 1;
const posts = new Map(); // id -> post

function seed() {
  const id = `post_${nextId++}`;
  posts.set(id, {
    id,
    slug: 'welcome',
    type: 'note',
    content_scope: null,
    locale: 'en',
    title: 'Welcome',
    excerpt: 'A seeded published note.',
    content: '## Welcome\n\nThis post is seeded by the mock backend.',
    status: 'published',
    published_at: new Date().toISOString(),
    link: `http://127.0.0.1:${PORT}/posts/welcome`,
  });
}
seed();

// --- Helpers ---------------------------------------------------------------

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
};

const isAuthorized = (req) => {
  const header = req.headers['x-api-key'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return header === API_KEY;
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
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

const findPost = (idOrSlug) =>
  posts.get(idOrSlug) ?? [...posts.values()].find((p) => p.slug === idOrSlug);

const missingLocales = (slug) => {
  const present = new Set([...posts.values()].filter((p) => p.slug === slug).map((p) => p.locale));
  return SUPPORTED_LOCALES.filter((l) => !present.has(l));
};

// Reject server-managed fields and HTML documents; validate content_scope rules.
function validatePayload(body, { partial }) {
  for (const field of CAPABILITIES.safety.server_managed_fields) {
    if (field in body) return `Field "${field}" is server-managed and must not be sent.`;
  }
  if (typeof body.content === 'string' && /<\/?(html|head|body)\b/i.test(body.content)) {
    return 'content must not be a full HTML document.';
  }
  const type = body.type;
  if (!partial && !CAPABILITIES.content.types.includes(type)) {
    return `type must be one of: ${CAPABILITIES.content.types.join(', ')}.`;
  }
  if (type) {
    const requiresScope = CAPABILITIES.content.content_scope.required_for_types.includes(type);
    if (requiresScope && !body.content_scope) return `type "${type}" requires a content_scope.`;
    if (!requiresScope && body.content_scope) return `type "${type}" must not have a content_scope.`;
  }
  if (body.content_scope && !/^[a-z]+:[a-z0-9-]+$/i.test(body.content_scope)) {
    return 'content_scope must use kind:key format.';
  }
  return null;
}

// --- Router ----------------------------------------------------------------

const server = createServer(async (req, res) => {
  if (!isAuthorized(req)) return json(res, 401, { error: 'Unauthorized' });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // GET /capabilities
    if (method === 'GET' && /\/capabilities$/.test(path)) {
      return json(res, 200, CAPABILITIES);
    }

    // GET /scopes/{content_scope}
    let m = path.match(/\/scopes\/([^/]+)$/);
    if (method === 'GET' && m) {
      const scope = decodeURIComponent(m[1]);
      const ctx = SCOPES[scope];
      return ctx ? json(res, 200, ctx) : json(res, 404, { error: `Unknown content_scope: ${scope}` });
    }

    // POST /posts/{id_or_slug}/publish
    m = path.match(/\/posts\/([^/]+)\/publish$/);
    if (method === 'POST' && m) {
      const post = findPost(decodeURIComponent(m[1]));
      if (!post) return json(res, 404, { error: 'Post not found' });
      post.status = 'published';
      post.published_at = new Date().toISOString();
      return json(res, 200, { ...post, next_actions: [] });
    }

    // GET / PATCH /posts/{id_or_slug}
    m = path.match(/\/posts\/([^/]+)$/);
    if (m) {
      const post = findPost(decodeURIComponent(m[1]));
      if (!post) return json(res, 404, { error: 'Post not found' });

      if (method === 'GET') return json(res, 200, post);

      if (method === 'PATCH') {
        const body = await readBody(req);
        const err = validatePayload(body, { partial: true });
        if (err) return json(res, 422, { error: err });
        Object.assign(post, body); // one locale per call
        return json(res, 200, { ...post, missing_locales: missingLocales(post.slug) });
      }
    }

    // GET / POST /posts
    if (/\/posts$/.test(path)) {
      if (method === 'GET') {
        const { status, type, content_scope, q } = Object.fromEntries(url.searchParams);
        let list = [...posts.values()];
        if (status) list = list.filter((p) => p.status === status);
        if (type) list = list.filter((p) => p.type === type);
        if (content_scope !== undefined) list = list.filter((p) => (p.content_scope ?? '') === content_scope);
        if (q) list = list.filter((p) => (p.title + p.content).toLowerCase().includes(q.toLowerCase()));
        return json(res, 200, {
          posts: list.map(({ id, title, slug, link, status, type, locale }) => ({ id, title, slug, link, status, type, locale })),
        });
      }

      if (method === 'POST') {
        const body = await readBody(req);
        const err = validatePayload(body, { partial: false });
        if (err) return json(res, 422, { error: err });
        const id = `post_${nextId++}`;
        const post = {
          id,
          slug: body.slug,
          type: body.type,
          content_scope: body.content_scope ?? null,
          locale: body.locale,
          title: body.title,
          excerpt: body.excerpt ?? '',
          content: body.content ?? '',
          status: 'draft', // always created as draft; publish is a separate step
          published_at: null,
          link: `http://127.0.0.1:${PORT}/posts/${body.slug}`,
        };
        posts.set(id, post);
        return json(res, 201, { ...post, missing_locales: missingLocales(post.slug) });
      }
    }

    return json(res, 404, { error: `No route for ${method} ${path}` });
  } catch (e) {
    return json(res, 400, { error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`Mock content backend listening on http://127.0.0.1:${PORT} (API_KEY=${API_KEY})`);
});
