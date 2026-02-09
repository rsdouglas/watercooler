import { createMCPServer, startMCPServer } from '../../core/mcp-server.js';

export async function serveCommand(): Promise<void> {
  const server = createMCPServer();
  await startMCPServer(server);
}
