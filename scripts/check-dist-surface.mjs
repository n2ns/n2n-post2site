import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = [
  'registerPrompt(',
  '.prompt(',
  'setRequestHandler(Prompt',
  'setRequestHandler(Complete',
  'n2n_get_capabilities',
  'n2n_get_site_context',
  'n2n_get_editorial_policy',
  'n2n_get_inventory_resource',
  'n2n_get_inventory_stats',
  'n2n_get_draft',
  'n2n_list_posts',
  'n2n_get_post',
  'n2n_get_product_context',
  'n2n_create_post',
  'n2n_update_post',
  'n2n_publish_post',
];

const required = [
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
  'post2site://capabilities',
  'post2site://site-context',
  'post2site://editorial-policy',
  'post2site://inventory/stats',
  'post2site://inventory/resources/{target_identifier}',
  'post2site://drafts/{draft_id}',
];

const distText = readDistFiles('dist');
const forbiddenHits = forbidden.filter((name) => distText.includes(name));
if (forbiddenHits.length > 0) {
  throw new Error(`dist contains deleted tool names: ${forbiddenHits.join(', ')}`);
}

const missing = required.filter((name) => !distText.includes(name));
if (missing.length > 0) {
  throw new Error(`dist is missing required MCP surface entries: ${missing.join(', ')}`);
}

function readDistFiles(dir) {
  let text = '';
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      text += readDistFiles(path);
      continue;
    }

    if (entry.endsWith('.js')) {
      text += readFileSync(path, 'utf8');
    }
  }

  return text;
}
