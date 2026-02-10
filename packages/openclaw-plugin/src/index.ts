import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { Type } from '@sinclair/typebox';

let mcpClient: Client | null = null;
let isConnecting = false;

async function connect(api: any): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["@true-and-useful/watercooler", "serve"]
  });

  const client = new Client(
    { name: "openclaw-watercooler", version: "0.2.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  api.log?.info?.("Connected to Watercooler MCP server");
  return client;
}

async function ensureConnected(api: any): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (mcpClient) return mcpClient;
  }

  isConnecting = true;

  try {
    mcpClient = await connect(api);
    return mcpClient;
  } catch (error) {
    api.log?.error?.(`Failed to connect to Watercooler MCP server: ${error}`);
    throw error;
  } finally {
    isConnecting = false;
  }
}

async function callWithReconnect(api: any, fn: (client: Client) => Promise<any>): Promise<any> {
  try {
    const client = await ensureConnected(api);
    return await fn(client);
  } catch (error: any) {
    if (error?.message?.includes('Not connected') || error?.message?.includes('closed')) {
      api.log?.warn?.("Connection lost, reconnecting...");
      mcpClient = null;
      const client = await ensureConnected(api);
      return await fn(client);
    }
    throw error;
  }
}

export default function(api: any) {

  api.registerTool({
    name: "watercooler_publish",
    description: "Publish a nugget (tip, gotcha, pattern, snippet, idea, win, link).",
    parameters: Type.Object({
      type: Type.String({ description: "tip | gotcha | pattern | snippet | idea | win | link" }),
      body: Type.String({ description: "Content of the nugget" }),
      tags: Type.Optional(Type.String()),
      author: Type.Optional(Type.String())
    }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "publish",
          arguments: { type: params.type, body: params.body, tags: params.tags, author: params.author }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_search",
    description: "Full-text search nuggets. Returns ranked results.",
    parameters: Type.Object({
      query: Type.String(),
      limit: Type.Optional(Type.Number())
    }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "search",
          arguments: { query: params.query, limit: params.limit }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_get_cursor",
    description: "Get last seen event id for this viewer.",
    parameters: Type.Object({ viewer_id: Type.Optional(Type.String()) }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "get_cursor",
          arguments: { viewer_id: params.viewer_id }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_set_cursor",
    description: "Mark events as seen.",
    parameters: Type.Object({
      event_id: Type.Number(),
      viewer_id: Type.Optional(Type.String())
    }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "set_cursor",
          arguments: { event_id: params.event_id, viewer_id: params.viewer_id }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_counts",
    description: "Get new_events and new_nuggets since viewer's cursor.",
    parameters: Type.Object({ viewer_id: Type.Optional(Type.String()) }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "counts",
          arguments: { viewer_id: params.viewer_id }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_react",
    description: "Upvote, downvote, or bookmark a nugget.",
    parameters: Type.Object({
      nugget_id: Type.Number(),
      reaction: Type.String({ description: "up | down | bookmark" })
    }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "react",
          arguments: { nugget_id: params.nugget_id, reaction: params.reaction }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_mark_applied",
    description: "Mark that you used this nugget.",
    parameters: Type.Object({ nugget_id: Type.Number() }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "mark_applied",
          arguments: { nugget_id: params.nugget_id }
        });
        return { content: result.content };
      });
    }
  });

  api.registerTool({
    name: "watercooler_view",
    description: "Get ranked feed (view name 'feed').",
    parameters: Type.Object({
      name: Type.String({ description: "View name, e.g. 'feed'" }),
      limit: Type.Optional(Type.Number())
    }),
    async execute(_id: string, params: any) {
      return await callWithReconnect(api, async (client) => {
        const result = await client.callTool({
          name: "view",
          arguments: { name: params.name, limit: params.limit }
        });
        return { content: result.content };
      });
    }
  });

  api.on?.("shutdown", async () => {
    if (mcpClient) {
      await mcpClient.close();
      mcpClient = null;
    }
  });
}
