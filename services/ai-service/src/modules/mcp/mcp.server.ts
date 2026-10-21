import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const products = {
  'KB-100': {
    sku: 'KB-100',
    name: 'Mekanik Klavye',
    price: 1499,
    currency: 'TRY',
    stockCount: 12,
  },
  'MS-200': {
    sku: 'MS-200',
    name: 'Kablosuz Fare',
    price: 799,
    currency: 'TRY',
    stockCount: 25,
  },
} as const;

const createServer = (): McpServer => {
  const server = new McpServer({
    name: 'modern-backend-lab',
    version: '1.0.0',
  });

  server.registerTool(
    'get_sample_product',
    {
      description: 'SKU koduna göre örnek ürün bilgisi getirir.',
      inputSchema: z.object({
        sku: z.enum(['KB-100', 'MS-200']).describe('Ürün stok kodu'),
      }),
      outputSchema: z.object({
        sku: z.string(),
        name: z.string(),
        price: z.number(),
        currency: z.string(),
        stockCount: z.number(),
      }),
    },
    async ({ sku }) => {
      const product = products[sku];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(product),
          },
        ],
        structuredContent: product,
      };
    },
  );

  return server;
};

void serveStdio(createServer);

console.error('Modern Backend Lab MCP server started.');
