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
  reactNugget,
} from './nuggets.js';
import { getFeed } from './views.js';

describe('views', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-views-test-'));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'views.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getFeed', () => {
    it('returns nuggets ordered by score (upvoted first)', () => {
      const a = createNugget({ type: 'tip', body: 'first' });
      const b = createNugget({ type: 'tip', body: 'second' });
      const c = createNugget({ type: 'tip', body: 'third' });
      reactNugget(b.id, 'up');
      reactNugget(b.id, 'up');
      const feed = getFeed({ limit: 3 });
      expect(feed).toHaveLength(3);
      const firstId = feed[0].id;
      expect(firstId).toBe(b.id);
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
