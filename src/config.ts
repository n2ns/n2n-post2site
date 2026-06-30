export type Config = {
  apiBaseUrl: string;
  apiKey: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiBaseUrl = normalizeBaseUrl(env.CONTENT_API_BASE_URL ?? '');
  const apiKey = env.CONTENT_API_KEY;

  if (!apiBaseUrl) {
    throw new Error('CONTENT_API_BASE_URL is required. Point it at your protected content API base URL.');
  }

  if (!apiKey) {
    throw new Error('CONTENT_API_KEY is required. Pass a content API key as an environment variable.');
  }

  return { apiBaseUrl, apiKey };
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
