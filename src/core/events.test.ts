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
  emitEvent,
  getEventsSince,
} from './events.js';
import {
  createNugget,
  markNuggetApplied,
  reactNugget,
} from './nuggets.js';

describe('events', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watercooler-events-test-'));
    process.env.WATERCOOLER_DB_PATH = path.join(tempDir, 'events.sqlite');
    closeDb();
  });

  afterEach(() => {
    delete process.env.WATERCOOLER_DB_PATH;
    closeDb();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('emitEvent returns id and row', () => {
    const row = emitEvent({
      type: 'nugget.published',
      entityType: 'nugget',
      entityId: 1,
      summary: 'A tip'
    });
    expect(row.id).toBe(1);
    expect(row.type).toBe('nugget.published');
    expect(row.entity_type).toBe('nugget');
    expect(row.entity_id).toBe(1);
    expect(row.summary).toBe('A tip');
    expect(row.ts).toBeDefined();
  });

  it('multiple emits get sequential ids', () => {
    const a = emitEvent({ type: 'a', entityType: 'nugget', entityId: 1 });
    const b = emitEvent({ type: 'b', entityType: 'nugget', entityId: 2 });
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
  });

  it('getEventsSince returns only events after given id', () => {
    emitEvent({ type: 'first', entityType: 'nugget', entityId: 1 });
    emitEvent({ type: 'second', entityType: 'nugget', entityId: 2 });
    emitEvent({ type: 'third', entityType: 'nugget', entityId: 3 });
    const after = getEventsSince(1, 10);
    expect(after).toHaveLength(2);
    expect(after[0].type).toBe('second');
    expect(after[1].type).toBe('third');
  });

  it('getEventsSince respects limit', () => {
    emitEvent({ type: 'a', entityType: 'nugget', entityId: 1 });
    emitEvent({ type: 'b', entityType: 'nugget', entityId: 2 });
    emitEvent({ type: 'c', entityType: 'nugget', entityId: 3 });
    const after = getEventsSince(0, 2);
    expect(after).toHaveLength(2);
    expect(after[0].type).toBe('a');
    expect(after[1].type).toBe('b');
  });

  it('reactNugget emits nugget.reacted with payload', () => {
    const n = createNugget({ type: 'tip', body: 'x' });
    reactNugget(n.id, 'up');
    const events = getEventsSince(0, 10);
    const reacted = events.filter((e) => e.type === 'nugget.reacted');
    expect(reacted).toHaveLength(1);
    expect(reacted[0].entity_id).toBe(n.id);
    expect(reacted[0].summary).toBe('up');
    expect(JSON.parse(reacted[0].payload!)).toEqual({ reaction: 'up' });
  });

  it('markNuggetApplied emits nugget.applied', () => {
    const n = createNugget({ type: 'tip', body: 'x' });
    markNuggetApplied(n.id);
    const events = getEventsSince(0, 10);
    const applied = events.filter((e) => e.type === 'nugget.applied');
    expect(applied).toHaveLength(1);
    expect(applied[0].entity_id).toBe(n.id);
    expect(applied[0].summary).toBe('applied');
  });
});
