import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  createNugget,
  reactNugget,
} from './nuggets.js';
import { useTempDb } from './test-helpers.js';
import { getFeed } from './views.js';

describe('views', () => {
  useTempDb('watercooler-views-test');

  describe('getFeed', () => {
    it('returns nuggets ordered by score (upvoted first)', () => {
      createNugget({ type: 'tip', body: 'first' });
      const b = createNugget({ type: 'tip', body: 'second' });
      createNugget({ type: 'tip', body: 'third' });
      reactNugget(b.id, 'up');
      reactNugget(b.id, 'up');
      const feed = getFeed({ limit: 3 });
      expect(feed).toHaveLength(3);
      expect(feed[0].id).toBe(b.id);
    });

    it('respects limit', () => {
      createNugget({ type: 'tip', body: 'a' });
      createNugget({ type: 'tip', body: 'b' });
      createNugget({ type: 'tip', body: 'c' });
      const feed = getFeed({ limit: 2 });
      expect(feed).toHaveLength(2);
    });
  });
});
