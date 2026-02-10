import * as fs from 'fs';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { getDb } from './db.js';
import { useTempDb } from './test-helpers.js';

describe('db', () => {
  useTempDb('watercooler-db-test');

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
    getDb();
    expect(fs.existsSync(process.env.WATERCOOLER_DB_PATH!)).toBe(true);
  });
});
