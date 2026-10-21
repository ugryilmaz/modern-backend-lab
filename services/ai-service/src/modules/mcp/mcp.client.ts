import { fileURLToPath } from 'node:url';
import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';

const mcpServerPath = fileURLToPath(
  new URL('./mcp.server.ts', import.meta.url),
);

const mcpClient = await createMCPClient({
  transport: new Experimental_StdioMCPTransport({
    command: 'npx',
    args: ['tsx', mcpServerPath],
  }),
});

export default mcpClient;
