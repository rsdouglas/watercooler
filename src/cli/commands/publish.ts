import {
  createNugget,
  NUGGET_TYPES,
} from '../../core/nuggets.js';

export async function publishCommand(options: {
  type?: string;
  body?: string;
  tags?: string;
  author?: string;
}): Promise<void> {
  const { type, body, tags, author } = options;
  if (!type || !body) {
    console.error('Usage: watercooler publish --type <type> --body <body> [--tags <tags>] [--author <author>]');
    console.error(`Types: ${NUGGET_TYPES.join(', ')}`);
    process.exit(1);
  }
  if (!NUGGET_TYPES.includes(type as (typeof NUGGET_TYPES)[number])) {
    console.error(`Invalid type: ${type}. Must be one of: ${NUGGET_TYPES.join(', ')}`);
    process.exit(1);
  }
  const nugget = createNugget({
    type: type as (typeof NUGGET_TYPES)[number],
    body,
    tags,
    author
  });
  console.log(JSON.stringify(nugget, null, 2));
}
