import {
  describe,
  expect,
  it,
} from 'vitest';

import { createMCPServer } from './mcp-server.js';
import { useTempDb } from './test-helpers.js';

describe('MCP Server', () => {
  useTempDb('watercooler-mcp-test');

  it('createMCPServer returns a server instance', () => {
    const server = createMCPServer();
    expect(server).toBeDefined();
  });
});
