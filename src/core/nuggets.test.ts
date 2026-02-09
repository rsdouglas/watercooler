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
import {
  createNugget,
  NUGGET_TYPES,
  searchNuggets,
} from './nuggets.js';

describe('nuggets', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-test-'));
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

  describe('createNugget', () => {
    it('creates a nugget and returns it with id', () => {
      const n = createNugget({ type: 'tip', body: 'Use WAL mode' });
      expect(n.id).toBe(1);
      expect(n.type).toBe('tip');
      expect(n.body).toBe('Use WAL mode');
      expect(n.tags).toBe('');
      expect(n.author).toBe('');
      expect(n.created_at).toBeDefined();
      expect(n.up).toBe(0);
      expect(n.down).toBe(0);
      expect(n.bookmarks).toBe(0);
      expect(n.applied).toBe(0);
    });

    it('accepts tags and author', () => {
      const n = createNugget({
        type: 'gotcha',
        body: 'Race condition here',
        tags: 'async,race',
        author: 'agent:xyz'
      });
      expect(n.type).toBe('gotcha');
      expect(n.body).toBe('Race condition here');
      expect(n.tags).toBe('async,race');
      expect(n.author).toBe('agent:xyz');
    });

    it('accepts all valid types', () => {
      for (const type of NUGGET_TYPES) {
        const n = createNugget({ type, body: `body for ${type}` });
        expect(n.type).toBe(type);
      }
    });

    it('throws for invalid type', () => {
      expect(() =>
        createNugget({ type: 'invalid' as 'tip', body: 'x' })
      ).toThrow(/Invalid type/);
    });

    it('auto-increments id', () => {
      const a = createNugget({ type: 'tip', body: 'first' });
      const b = createNugget({ type: 'tip', body: 'second' });
      expect(a.id).toBe(1);
      expect(b.id).toBe(2);
    });
  });

  describe('searchNuggets', () => {
    it('returns recent nuggets for empty query', () => {
      createNugget({ type: 'tip', body: 'first' });
      createNugget({ type: 'tip', body: 'second' });
      const results = searchNuggets('');
      expect(results).toHaveLength(2);
      const bodies = results.map((r) => r.body).sort();
      expect(bodies).toEqual(['first', 'second']);
    });

    it('respects limit for empty query', () => {
      createNugget({ type: 'tip', body: 'a' });
      createNugget({ type: 'tip', body: 'b' });
      createNugget({ type: 'tip', body: 'c' });
      const results = searchNuggets('', { limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('finds nuggets by full-text match', () => {
      createNugget({ type: 'tip', body: 'Use SQLite WAL mode for better concurrency' });
      createNugget({ type: 'tip', body: 'Use PostgreSQL for analytics' });
      const results = searchNuggets('SQLite');
      expect(results).toHaveLength(1);
      expect(results[0].body).toContain('SQLite');
    });

    it('finds nuggets by tag', () => {
      createNugget({ type: 'pattern', body: 'Retry with backoff', tags: 'retry,resilience' });
      createNugget({ type: 'pattern', body: 'Circuit breaker', tags: 'resilience' });
      const results = searchNuggets('retry');
      expect(results).toHaveLength(1);
      expect(results[0].body).toBe('Retry with backoff');
    });

    it('returns empty array when no match', () => {
      createNugget({ type: 'tip', body: 'nothing special' });
      const results = searchNuggets('xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('respects limit for FTS query', () => {
      createNugget({ type: 'tip', body: 'foo bar' });
      createNugget({ type: 'tip', body: 'foo baz' });
      createNugget({ type: 'tip', body: 'foo qux' });
      const results = searchNuggets('foo', { limit: 2 });
      expect(results).toHaveLength(2);
    });
  });
});
