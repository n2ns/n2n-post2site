export type McpToolResult = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

export function createTextResult(value: unknown): McpToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
