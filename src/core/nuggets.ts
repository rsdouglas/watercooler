import { getDb } from './db.js';

export const NUGGET_TYPES = ['tip', 'gotcha', 'pattern', 'snippet', 'idea', 'win', 'link'] as const;
export type NuggetType = (typeof NUGGET_TYPES)[number];

export interface NuggetRow {
  id: number;
  type: string;
  body: string;
  tags: string;
  author: string;
  created_at: string;
  up: number;
  down: number;
  bookmarks: number;
  applied: number;
}

export interface CreateNuggetInput {
  type: NuggetType;
  body: string;
  tags?: string;
  author?: string;
}

export interface SearchNuggetsOptions {
  limit?: number;
}

export function createNugget(input: CreateNuggetInput): NuggetRow {
  const database = getDb();
  const tags = (input.tags ?? '').trim();
  const author = (input.author ?? '').trim();
  if (!NUGGET_TYPES.includes(input.type)) {
    throw new Error(`Invalid type: ${input.type}. Must be one of: ${NUGGET_TYPES.join(', ')}`);
  }
  const stmt = database.prepare(`
    INSERT INTO nuggets (type, body, tags, author)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(input.type, input.body.trim(), tags, author);
  const row = database.prepare('SELECT * FROM nuggets WHERE id = ?').get(result.lastInsertRowid) as NuggetRow;
  return row;
}

export function searchNuggets(query: string, opts: SearchNuggetsOptions = {}): NuggetRow[] {
  const database = getDb();
  const limit = Math.min(opts.limit ?? 20, 100);
  const trimmed = query.trim();
  if (!trimmed) {
    const stmt = database.prepare(`
      SELECT * FROM nuggets ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as NuggetRow[];
  }
  const stmt = database.prepare(`
    SELECT n.* FROM nuggets n
    INNER JOIN nuggets_fts ON nuggets_fts.rowid = n.id
    WHERE nuggets_fts MATCH ?
    ORDER BY nuggets_fts.rank
    LIMIT ?
  `);
  return stmt.all(trimmed, limit) as NuggetRow[];
}
