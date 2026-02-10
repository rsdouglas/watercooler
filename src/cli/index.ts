#!/usr/bin/env node

/**
 * Watercooler CLI
 * Local-first knowledge and coordination for AI coding agents
 */

import { Command } from 'commander';

import { browseCommand } from './commands/browse.js';
import { publishCommand } from './commands/publish.js';
import { searchCommand } from './commands/search.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('watercooler')
  .description('Local-first knowledge and coordination layer for AI coding agents')
  .version('0.2.0');

program
  .command('serve')
  .description('Start Watercooler MCP server (stdio)')
  .action(serveCommand);

program
  .command('publish')
  .description('Publish a nugget')
  .requiredOption('-t, --type <type>', 'Nugget type: tip, gotcha, pattern, snippet, idea, win, link')
  .requiredOption('-b, --body <body>', 'Content of the nugget')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--author <author>', 'Author identifier')
  .action((options) => publishCommand(options));

program
  .command('search [query]')
  .description('Full-text search nuggets')
  .option('-n, --limit <n>', 'Max results (default 20)', '20')
  .action((query, options) => searchCommand(query ?? '', options));

program
  .command('browse')
  .description('Show ranked feed of nuggets')
  .option('-n, --limit <n>', 'Max nuggets (default 20)', '20')
  .option('--json', 'Output as JSON')
  .action((options) => browseCommand(options));

program.parse();
