import {
  describe,
  expect,
  it,
} from 'vitest';

import { getEventsSince } from './events.js';
import {
  createNugget,
  markNuggetApplied,
  NUGGET_TYPES,
  reactNugget,
  searchNuggets,
} from './nuggets.js';
import { useTempDb } from './test-helpers.js';

describe('nuggets', () => {
  useTempDb('watercooler-nuggets-test');

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

    it('throws for empty body', () => {
      expect(() =>
        createNugget({ type: 'tip', body: '   ' })
      ).toThrow(/body must not be empty/);
    });

    it('auto-increments id', () => {
      const a = createNugget({ type: 'tip', body: 'first' });
      const b = createNugget({ type: 'tip', body: 'second' });
      expect(b.id).toBe(a.id + 1);
    });

    it('emits nugget.published event', () => {
      const n = createNugget({ type: 'pattern', body: 'Retry with backoff' });
      const events = getEventsSince(0, 10);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('nugget.published');
      expect(events[0].entity_type).toBe('nugget');
      expect(events[0].entity_id).toBe(n.id);
    });
  });

  describe('searchNuggets', () => {
    it('returns recent nuggets for empty query', () => {
      createNugget({ type: 'tip', body: 'first' });
      createNugget({ type: 'tip', body: 'second' });
      const results = searchNuggets('');
      expect(results).toHaveLength(2);
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

    it('returns empty array on malformed FTS5 syntax instead of crashing', () => {
      createNugget({ type: 'tip', body: 'test content' });
      expect(searchNuggets('"unclosed')).toEqual([]);
      expect(searchNuggets('(bad paren')).toEqual([]);
    });
  });

  describe('reactNugget', () => {
    it('increments counters correctly', () => {
      const n = createNugget({ type: 'tip', body: 'test' });
      const afterUp = reactNugget(n.id, 'up');
      expect(afterUp.up).toBe(1);
      expect(afterUp.down).toBe(0);
      expect(afterUp.bookmarks).toBe(0);
      const afterUp2 = reactNugget(n.id, 'up');
      expect(afterUp2.up).toBe(2);
      const afterBookmark = reactNugget(n.id, 'bookmark');
      expect(afterBookmark.bookmarks).toBe(1);
    });

    it('throws for non-existent nugget id', () => {
      expect(() => reactNugget(99999, 'up')).toThrow(/Nugget not found/);
    });
  });

  describe('markNuggetApplied', () => {
    it('increments applied', () => {
      const n = createNugget({ type: 'tip', body: 'test' });
      const a1 = markNuggetApplied(n.id);
      expect(a1.applied).toBe(1);
      const a2 = markNuggetApplied(n.id);
      expect(a2.applied).toBe(2);
    });

    it('throws for non-existent nugget id', () => {
      expect(() => markNuggetApplied(99999)).toThrow(/Nugget not found/);
    });
  });
});
