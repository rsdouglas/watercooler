import { searchNuggets } from '../../core/nuggets.js';

export async function searchCommand(query: string, options: { limit?: string }): Promise<void> {
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;
  if (Number.isNaN(limit) || (limit !== undefined && limit < 1)) {
    console.error('--limit must be a positive number');
    process.exit(1);
  }
  const results = searchNuggets(query, { limit });
  console.log(JSON.stringify(results, null, 2));
}
