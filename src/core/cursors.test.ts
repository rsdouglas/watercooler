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

import {
  getCountsSince,
  getCursor,
  setCursor,
} from './cursors.js';
import { closeDb } from './db.js';
import { emitEvent } from './events.js';

describe('cursors', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-cursors-test-'));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'cursors.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('getCursor returns 0 when empty', () => {
    expect(getCursor('agent', 'default')).toBe(0);
  });

  it('setCursor then getCursor returns value', () => {
    setCursor('agent', 'default', 5);
    expect(getCursor('agent', 'default')).toBe(5);
  });

  it('getCountsSince returns 0 when no events', () => {
    const c = getCountsSince('agent', 'default');
    expect(c.new_events).toBe(0);
    expect(c.new_nuggets).toBe(0);
    expect(c.last_seen_event_id).toBe(0);
  });

  it('after emitEvent, getCountsSince with cursor 0 returns new_events and new_nuggets', () => {
    emitEvent({
      type: 'nugget.published',
      entityType: 'nugget',
      entityId: 1,
      summary: 'tip'
    });
    const c = getCountsSince('agent', 'default');
    expect(c.new_events).toBe(1);
    expect(c.new_nuggets).toBe(1);
    expect(c.last_seen_event_id).toBe(0);
  });

  it('after set_cursor, getCountsSince returns 0 for new events after that id', () => {
    const e = emitEvent({
      type: 'nugget.published',
      entityType: 'nugget',
      entityId: 1,
      summary: 'tip'
    });
    setCursor('agent', 'default', e.id);
    const c = getCountsSince('agent', 'default');
    expect(c.new_events).toBe(0);
    expect(c.new_nuggets).toBe(0);
    expect(c.last_seen_event_id).toBe(e.id);
  });
});
