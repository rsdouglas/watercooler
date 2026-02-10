/**
 * MCP Server for Watercooler
 * Exposes knowledge tools to AI agents via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import {
  getCountsSince,
  getCursor,
  setCursor,
} from './cursors.js';
import {
  createNugget,
  markNuggetApplied,
  NUGGET_TYPES,
  type NuggetType,
  type Reaction,
  REACTIONS,
  reactNugget,
  searchNuggets,
} from './nuggets.js';
import { getFeed } from './views.js';

export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'watercooler',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const publishTool: Tool = {
    name: 'publish',
    description: 'Publish a nugget (short reusable knowledge: tip, gotcha, pattern, snippet, idea, win, link)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: NUGGET_TYPES as unknown as string[],
          description: 'Nugget type'
        },
        body: { type: 'string', description: 'Content of the nugget' },
        tags: { type: 'string', description: 'Optional comma-separated tags' },
        author: { type: 'string', description: 'Optional author identifier' }
      },
      required: ['type', 'body']
    }
  };

  const searchTool: Tool = {
    name: 'search',
    description: 'Full-text search nuggets. Returns ranked results.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 20, max 100)' }
      },
      required: ['query']
    }
  };

  const getCursorTool: Tool = {
    name: 'get_cursor',
    description: "Get this viewer's last seen event id (for unread/counts).",
    inputSchema: {
      type: 'object',
      properties: {
        viewer_id: { type: 'string', description: 'Viewer id (default "default")' }
      },
      required: []
    }
  };

  const setCursorTool: Tool = {
    name: 'set_cursor',
    description: 'Mark events as seen by setting last seen event id.',
    inputSchema: {
      type: 'object',
      properties: {
        viewer_id: { type: 'string', description: 'Viewer id (default "default")' },
        event_id: { type: 'number', description: 'Last seen event id' }
      },
      required: ['event_id']
    }
  };

  const countsTool: Tool = {
    name: 'counts',
    description: 'Get new_events and new_nuggets since this viewer\'s cursor.',
    inputSchema: {
      type: 'object',
      properties: {
        viewer_id: { type: 'string', description: 'Viewer id (default "default")' }
      },
      required: []
    }
  };

  const reactTool: Tool = {
    name: 'react',
    description: 'Upvote, downvote, or bookmark a nugget.',
    inputSchema: {
      type: 'object',
      properties: {
        nugget_id: { type: 'number', description: 'Nugget id' },
        reaction: {
          type: 'string',
          enum: REACTIONS as unknown as string[],
          description: 'up, down, or bookmark'
        }
      },
      required: ['nugget_id', 'reaction']
    }
  };

  const markAppliedTool: Tool = {
    name: 'mark_applied',
    description: 'Mark that you used this nugget (high signal for ranking).',
    inputSchema: {
      type: 'object',
      properties: {
        nugget_id: { type: 'number', description: 'Nugget id' }
      },
      required: ['nugget_id']
    }
  };

  const viewTool: Tool = {
    name: 'view',
    description: 'Get a named view (e.g. feed: nuggets ordered by ranking).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'View name (e.g. "feed")' },
        limit: { type: 'number', description: 'Max results (default 20, max 100)' }
      },
      required: ['name']
    }
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        publishTool,
        searchTool,
        getCursorTool,
        setCursorTool,
        countsTool,
        reactTool,
        markAppliedTool,
        viewTool
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const safeArgs = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case 'publish': {
          const type = safeArgs.type as string;
          const body = safeArgs.body as string;
          if (!type || !body) {
            throw new Error('publish requires type and body');
          }
          const nugget = createNugget({
            type: type as NuggetType,
            body,
            tags: typeof safeArgs.tags === 'string' ? safeArgs.tags : undefined,
            author: typeof safeArgs.author === 'string' ? safeArgs.author : undefined
          });
          return {
            content: [{ type: 'text', text: JSON.stringify(nugget, null, 2) }]
          };
        }

        case 'search': {
          const query = safeArgs.query as string;
          if (query === undefined) {
            throw new Error('search requires query');
          }
          const limit = typeof safeArgs.limit === 'number' ? safeArgs.limit : undefined;
          const results = searchNuggets(query, { limit });
          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
          };
        }

        case 'get_cursor': {
          const viewerId = typeof safeArgs.viewer_id === 'string' ? safeArgs.viewer_id : 'default';
          const last_seen_event_id = getCursor('agent', viewerId);
          return {
            content: [{ type: 'text', text: JSON.stringify({ last_seen_event_id }, null, 2) }]
          };
        }

        case 'set_cursor': {
          const viewerId = typeof safeArgs.viewer_id === 'string' ? safeArgs.viewer_id : 'default';
          const eventId = safeArgs.event_id as number;
          if (typeof eventId !== 'number') {
            throw new Error('set_cursor requires event_id (number)');
          }
          setCursor('agent', viewerId, eventId);
          return {
            content: [{ type: 'text', text: JSON.stringify({ ok: true }, null, 2) }]
          };
        }

        case 'counts': {
          const viewerId = typeof safeArgs.viewer_id === 'string' ? safeArgs.viewer_id : 'default';
          const result = getCountsSince('agent', viewerId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          };
        }

        case 'react': {
          const nuggetId = safeArgs.nugget_id as number;
          const reaction = safeArgs.reaction as string;
          if (typeof nuggetId !== 'number') {
            throw new Error('react requires nugget_id (number)');
          }
          if (!reaction || !REACTIONS.includes(reaction as Reaction)) {
            throw new Error(`react requires reaction: one of ${REACTIONS.join(', ')}`);
          }
          const nugget = reactNugget(nuggetId, reaction as Reaction);
          return {
            content: [{ type: 'text', text: JSON.stringify(nugget, null, 2) }]
          };
        }

        case 'mark_applied': {
          const nuggetId = safeArgs.nugget_id as number;
          if (typeof nuggetId !== 'number') {
            throw new Error('mark_applied requires nugget_id (number)');
          }
          const nugget = markNuggetApplied(nuggetId);
          return {
            content: [{ type: 'text', text: JSON.stringify(nugget, null, 2) }]
          };
        }

        case 'view': {
          const name = safeArgs.name as string;
          if (!name || typeof name !== 'string') {
            throw new Error('view requires name (string)');
          }
          if (name !== 'feed') {
            throw new Error(`Unknown view: ${name}`);
          }
          const limit = typeof safeArgs.limit === 'number' ? safeArgs.limit : undefined;
          const results = getFeed({ limit });
          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }],
        isError: true
      };
    }
  });

  return server;
}

export async function startMCPServer(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Watercooler MCP server started');
}
