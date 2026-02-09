/**
 * MCP Server for Watercooler
 * Exposes knowledge tools to AI agents via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createNugget, searchNuggets, NUGGET_TYPES, type NuggetType } from './nuggets.js';

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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [publishTool, searchTool] };
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
