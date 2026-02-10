import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  afterEach,
  beforeEach,
} from 'vitest';

import { closeDb } from './db.js';

let tempDir: string;

export function useTempDb(prefix = 'watercooler-test') {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'test.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
}
