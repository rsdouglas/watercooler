export const DEFAULT_MAX_BODY_LENGTH = 20_000;

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi;
const SECRET_PATTERN = /(api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[\w\-]+['"]?/gi;

export function redactBody(body: string): string {
  let out = body
    .replace(BEARER_PATTERN, '[REDACTED]')
    .replace(SECRET_PATTERN, '$1: [REDACTED]');
  if (out.length > DEFAULT_MAX_BODY_LENGTH) {
    out = out.slice(0, DEFAULT_MAX_BODY_LENGTH) + '…';
  }
  return out;
}
