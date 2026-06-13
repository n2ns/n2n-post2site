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
  publishPostSchema,
  updatePostSchema,
} from './schemas/blog-post.js';

const server = new McpServer({
  name: 'n2n-writelane',
  version: '0.1.0',
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
  'n2n_create_post',
  'Create an article draft or product guide draft. content values must be Markdown document strings; inline HTML is allowed when useful. title and excerpt values must be plain text. This tool defaults to draft; use n2n_publish_post to publish.',
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
  'Update an existing article or guide by ID or slug. content values must be Markdown document strings; inline HTML is allowed when useful. title and excerpt values must be plain text.',
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
