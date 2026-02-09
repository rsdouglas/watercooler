import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { closeDb } from './db.js';
import { createMCPServer } from './mcp-server.js';

describe('MCP Server', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-mcp-test-'));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'mcp.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('createMCPServer returns a server instance', () => {
    const server = createMCPServer();
    expect(server).toBeDefined();
  });
});
