import { getDb } from './db.js';

export interface EmitEventInput {
  type: string;
  actor?: string;
  entityType: string;
  entityId: number;
  summary?: string;
  payload?: string;
}

export interface EventRow {
  id: number;
  ts: string;
  type: string;
  actor: string;
  entity_type: string;
  entity_id: number;
  summary: string;
  payload: string | null;
}

export function emitEvent(opts: EmitEventInput): EventRow {
  const database = getDb();
  const actor = (opts.actor ?? '').trim();
  const summary = (opts.summary ?? '').trim();
  const stmt = database.prepare(`
    INSERT INTO events (type, actor, entity_type, entity_id, summary, payload)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    opts.type,
    actor,
    opts.entityType,
    opts.entityId,
    summary,
    opts.payload ?? null
  );
  const row = database.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid) as EventRow;
  return row;
}

export function getEventsSince(eventId: number, limit = 100): EventRow[] {
  const database = getDb();
  const capped = Math.min(limit, 500);
  const stmt = database.prepare(`
    SELECT * FROM events WHERE id > ? ORDER BY id ASC LIMIT ?
  `);
  return stmt.all(eventId, capped) as EventRow[];
}
