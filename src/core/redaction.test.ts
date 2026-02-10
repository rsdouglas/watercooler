import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  DEFAULT_MAX_BODY_LENGTH,
  redactBody,
} from './redaction.js';

describe('redaction', () => {
  it('redacts Bearer token', () => {
    const body = 'Use Authorization: Bearer sk-abc123xyz in the header';
    const out = redactBody(body);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('sk-abc123xyz');
  });

  it('redacts api_key style secrets', () => {
    const body = 'Set api_key=secret123 in config';
    const out = redactBody(body);
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('secret123');
  });

  it('leaves normal text unchanged when under limit', () => {
    const body = 'Just a tip about SQLite WAL mode';
    const out = redactBody(body);
    expect(out).toBe(body);
  });

  it('truncates body over max length with ellipsis', () => {
    const body = 'x'.repeat(DEFAULT_MAX_BODY_LENGTH + 100);
    const out = redactBody(body);
    expect(out.length).toBe(DEFAULT_MAX_BODY_LENGTH + 1);
    expect(out.endsWith('…')).toBe(true);
  });
});
