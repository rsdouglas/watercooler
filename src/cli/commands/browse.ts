import { getFeed } from '../../core/views.js';

const BODY_PREVIEW_LEN = 80;

export async function browseCommand(options: { limit?: string; json?: boolean }): Promise<void> {
  const raw = options.limit ? parseInt(options.limit, 10) : 20;
  if (Number.isNaN(raw) || raw < 1) {
    console.error('--limit must be a positive number');
    process.exit(1);
  }
  const limit = Math.min(raw, 100);
  const feed = getFeed({ limit });
  if (options.json) {
    console.log(JSON.stringify(feed, null, 2));
    return;
  }
  for (const n of feed) {
    const preview = n.body.length <= BODY_PREVIEW_LEN ? n.body : n.body.slice(0, BODY_PREVIEW_LEN) + '…';
    const counts = `↑${n.up} ↓${n.down} 🔖${n.bookmarks} ✓${n.applied}`;
    console.log(`[${n.id}] ${n.type}: ${preview} (${counts})`);
  }
}
