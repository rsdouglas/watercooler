import { getDb } from './db.js';

export function getCursor(viewerType: string, viewerId: string): number {
  const database = getDb();
  const row = database
    .prepare(
      'SELECT last_seen_event_id FROM cursors WHERE viewer_type = ? AND viewer_id = ?'
    )
    .get(viewerType, viewerId) as { last_seen_event_id: number } | undefined;
  return row ? row.last_seen_event_id : 0;
}

export function setCursor(viewerType: string, viewerId: string, eventId: number): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO cursors (viewer_type, viewer_id, last_seen_event_id, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (viewer_type, viewer_id) DO UPDATE SET
         last_seen_event_id = excluded.last_seen_event_id,
         updated_at = excluded.updated_at`
    )
    .run(viewerType, viewerId, eventId);
}

export interface CountsResult {
  new_events: number;
  new_nuggets: number;
  last_seen_event_id: number;
}

export function getCountsSince(viewerType: string, viewerId: string): CountsResult {
  const cursor = getCursor(viewerType, viewerId);
  const database = getDb();
  const total = database
    .prepare('SELECT COUNT(*) as n FROM events WHERE id > ?')
    .get(cursor) as { n: number };
  const nuggets = database
    .prepare(
      "SELECT COUNT(*) as n FROM events WHERE id > ? AND type = 'nugget.published'"
    )
    .get(cursor) as { n: number };
  return {
    new_events: total.n,
    new_nuggets: nuggets.n,
    last_seen_event_id: cursor
  };
}
