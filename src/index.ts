#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadConfig } from './config.js';
import { ContentClient } from './content-client.js';
import {
  assertContentPostShape,
  capabilitiesSchema,
  createPostSchema,
  getPostSchema,
  listPostsSchema,
  productContextSchema,
  publishPostSchema,
  updatePostSchema,
} from './schemas/blog-post.js';

const server = new McpServer({
  name: 'n2n-writelane',
  version: '0.1.2',
});

const client = new ContentClient(loadConfig());

server.tool(
  'n2n_get_capabilities',
  'Read the backend Content Publishing API Contract before creating or updating content. Use this to discover supported content types, locales, content_scope rules, and product guide scopes.',
  capabilitiesSchema.shape,
  async (input) => {
    capabilitiesSchema.parse(input);
    const result = await client.getCapabilities();
    return textResult(result);
  }
);

server.tool(
  'n2n_list_posts',
  'List website articles or product guides from the configured content API. Use content_scope for site-defined guide/product areas, and content_scope="" for unscoped company blog posts when the backend supports it.',
  listPostsSchema.shape,
  async (input) => {
    const parsed = listPostsSchema.parse(input);
    const result = await client.listPosts(parsed);
    return textResult(result);
  }
);

server.tool(
  'n2n_get_post',
  'Get one article or guide by numeric ID or slug from the configured site.',
  getPostSchema.shape,
  async (input) => {
    const parsed = getPostSchema.parse(input);
    const result = await client.getPost(parsed.id_or_slug);
    return textResult(result);
  }
);

server.tool(
  'n2n_get_product_context',
  'Read the controlled product fact sheet before writing a product guide. The backend returns content_scope, canonical_url, docs_url, summary, key_points, and do_not_claim so the article does not invent product facts.',
  productContextSchema.shape,
  async (input) => {
    const parsed = productContextSchema.parse(input);
    assertContentPostShape({ type: 'guide', content_scope: parsed.content_scope });
    const result = await client.getProductContext(parsed);
    return textResult(result);
  }
);

server.tool(
  'n2n_create_post',
  'Create an article draft or product guide draft with one locale per call. Before creating a product guide, call n2n_get_product_context for the target content_scope and follow its canonical_url, docs_url, summary, key_points, and do_not_claim. content must be a Markdown document string; inline HTML is allowed when useful. title and excerpt must be plain text. The backend returns missing_locales when more language versions should be added. Use n2n_publish_post to publish.',
  createPostSchema.shape,
  async (input) => {
    const parsed = createPostSchema.parse(input);
    assertContentPostShape(parsed);
    const result = await client.createPost(parsed);
    return textResult(result);
  }
);

server.tool(
  'n2n_update_post',
  'Update one locale of an existing article or guide by ID or slug. content must be a Markdown document string; inline HTML is allowed when useful. title and excerpt must be plain text. Use repeated calls with different locale values to add missing language versions.',
  updatePostSchema.shape,
  async (input) => {
    const parsed = updatePostSchema.parse(input);
    assertContentPostShape(parsed);
    const result = await client.updatePost(parsed);
    return textResult(result);
  }
);

server.tool(
  'n2n_publish_post',
  'Publish an existing article or guide by ID or slug. Publishing is intentionally separate from create/update to avoid accidental publication.',
  publishPostSchema.shape,
  async (input) => {
    const parsed = publishPostSchema.parse(input);
    const result = await client.publishPost(parsed.id_or_slug);
    return textResult(result);
  }
);

function textResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`n2n-writelane failed: ${message}`);
  process.exit(1);
});
