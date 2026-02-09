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

import {
  closeDb,
  getDb,
} from './db.js';

describe('db', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-db-test-'));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'db.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates nuggets and nuggets_fts tables on first getDb()', () => {
    const database = getDb();
    const nuggets = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='nuggets'").get();
    const fts = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='nuggets_fts'").get();
    expect(nuggets).toBeDefined();
    expect(fts).toBeDefined();
  });

  it('returns same instance for same path', () => {
    const a = getDb();
    const b = getDb();
    expect(a).toBe(b);
  });

  it('uses WATERCOOLER_DB_PATH when set', () => {
    const database = getDb();
    const expectedPath = path.join(tempDir, 'db.sqlite');
    expect(fs.existsSync(expectedPath)).toBe(true);
  });
});
