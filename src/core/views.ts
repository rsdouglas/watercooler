import { getDb } from './db.js';
import type { NuggetRow } from './nuggets.js';
import { computeScore } from './ranking.js';

const FEED_QUERY_LIMIT = 500;
const MAX_FEED_LIMIT = 100;

export function getFeed(opts: { limit?: number } = {}): NuggetRow[] {
  const database = getDb();
  const limit = Math.min(opts.limit ?? 20, MAX_FEED_LIMIT);
  const rows = database
    .prepare(`SELECT * FROM nuggets ORDER BY id DESC LIMIT ?`)
    .all(FEED_QUERY_LIMIT) as NuggetRow[];
  const withScores = rows.map((row) => ({ row, score: computeScore(row) }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, limit).map(({ row }) => row);
}
