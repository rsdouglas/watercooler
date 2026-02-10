import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  computeScore,
  recencyBoost,
} from './ranking.js';

const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
const oldIso = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

describe('ranking', () => {
  describe('computeScore', () => {
    it('row with all zeros has positive score from recency only', () => {
      const score = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      expect(score).toBeGreaterThan(0);
    });

    it('up=1 gives higher score than all zeros', () => {
      const zero = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      const withUp = computeScore({
        up: 1,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      expect(withUp).toBeGreaterThan(zero);
    });

    it('down=1 gives lower score than all zeros', () => {
      const zero = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      const withDown = computeScore({
        up: 0,
        down: 1,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      expect(withDown).toBeLessThan(zero);
    });

    it('applied=1 gives higher score than all zeros', () => {
      const zero = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      const withApplied = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 1,
        created_at: nowIso
      });
      expect(withApplied).toBeGreaterThan(zero);
    });

    it('newer created_at gives higher score than older (same engagement)', () => {
      const newer = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: nowIso
      });
      const older = computeScore({
        up: 0,
        down: 0,
        bookmarks: 0,
        applied: 0,
        created_at: oldIso
      });
      expect(newer).toBeGreaterThan(older);
    });
  });

  describe('recencyBoost', () => {
    it('newer date gives higher recency boost', () => {
      const boostNew = recencyBoost(nowIso);
      const boostOld = recencyBoost(oldIso);
      expect(boostNew).toBeGreaterThan(boostOld);
    });
  });
});
