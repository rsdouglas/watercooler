import { getDb } from './db.js';
import { emitEvent } from './events.js';
import { redactBody } from './redaction.js';

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

export const REACTIONS = ['up', 'down', 'bookmark'] as const;
export type Reaction = (typeof REACTIONS)[number];

function getNuggetOrThrow(id: number): NuggetRow {
  const database = getDb();
  const row = database.prepare('SELECT * FROM nuggets WHERE id = ?').get(id) as NuggetRow | undefined;
  if (!row) throw new Error(`Nugget not found: ${id}`);
  return row;
}

export function reactNugget(nuggetId: number, reaction: Reaction): NuggetRow {
  getNuggetOrThrow(nuggetId);
  const database = getDb();
  const col = reaction === 'up' ? 'up' : reaction === 'down' ? 'down' : 'bookmarks';
  database.prepare(`UPDATE nuggets SET ${col} = ${col} + 1 WHERE id = ?`).run(nuggetId);
  emitEvent({
    type: 'nugget.reacted',
    entityType: 'nugget',
    entityId: nuggetId,
    summary: reaction,
    payload: JSON.stringify({ reaction })
  });
  return database.prepare('SELECT * FROM nuggets WHERE id = ?').get(nuggetId) as NuggetRow;
}

export function markNuggetApplied(nuggetId: number): NuggetRow {
  getNuggetOrThrow(nuggetId);
  const database = getDb();
  database.prepare('UPDATE nuggets SET applied = applied + 1 WHERE id = ?').run(nuggetId);
  emitEvent({
    type: 'nugget.applied',
    entityType: 'nugget',
    entityId: nuggetId,
    summary: 'applied'
  });
  return database.prepare('SELECT * FROM nuggets WHERE id = ?').get(nuggetId) as NuggetRow;
}

export function createNugget(input: CreateNuggetInput): NuggetRow {
  const database = getDb();
  const tags = (input.tags ?? '').trim();
  const author = (input.author ?? '').trim();
  if (!NUGGET_TYPES.includes(input.type)) {
    throw new Error(`Invalid type: ${input.type}. Must be one of: ${NUGGET_TYPES.join(', ')}`);
  }
  const body = redactBody(input.body.trim(), 'strict');
  const stmt = database.prepare(`
    INSERT INTO nuggets (type, body, tags, author)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(input.type, body, tags, author);
  const row = database.prepare('SELECT * FROM nuggets WHERE id = ?').get(result.lastInsertRowid) as NuggetRow;
  emitEvent({
    type: 'nugget.published',
    entityType: 'nugget',
    entityId: row.id,
    summary: row.body.slice(0, 200),
    actor: row.author || undefined
  });
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
