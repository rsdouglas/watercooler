export interface RankingWeights {
  w_up: number;
  w_down: number;
  w_bookmark: number;
  w_applied: number;
  recency_scale: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  w_up: 1,
  w_down: 1,
  w_bookmark: 1.5,
  w_applied: 2,
  recency_scale: 10
};

export interface ScoreRow {
  up: number;
  down: number;
  bookmarks: number;
  applied: number;
  created_at: string;
}

function parseCreatedAt(created_at: string): Date {
  // SQLite stores YYYY-MM-DD HH:MM:SS (no tz) — treat as UTC
  let s = created_at.includes('T') ? created_at : created_at.replace(' ', 'T');
  if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s += 'Z';
  }
  return new Date(s);
}

export function recencyBoost(created_at: string, weights: RankingWeights = DEFAULT_WEIGHTS): number {
  const created = parseCreatedAt(created_at);
  const now = Date.now();
  const daysSince = Math.max(0, (now - created.getTime()) / (24 * 60 * 60 * 1000));
  return weights.recency_scale / (1 + daysSince);
}

export function computeScore(
  row: ScoreRow,
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  const engagement =
    weights.w_up * Math.log(1 + row.up) -
    weights.w_down * Math.log(1 + row.down) +
    weights.w_bookmark * Math.log(1 + row.bookmarks) +
    weights.w_applied * Math.log(1 + row.applied);
  const recency = recencyBoost(row.created_at, weights);
  return engagement + recency;
}
