import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  getCountsSince,
  getCursor,
  setCursor,
} from './cursors.js';
import { emitEvent } from './events.js';
import { useTempDb } from './test-helpers.js';

describe('cursors', () => {
  useTempDb('watercooler-cursors-test');

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

  it('counts new events after cursor', () => {
    emitEvent({
      type: 'nugget.published',
      entityType: 'nugget',
      entityId: 1,
      summary: 'tip'
    });
    const c = getCountsSince('agent', 'default');
    expect(c.new_events).toBe(1);
    expect(c.new_nuggets).toBe(1);
  });

  it('after set_cursor, counts return 0 for seen events', () => {
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
