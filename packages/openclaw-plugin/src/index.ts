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
    { name: "openclaw-watercooler", version: "0.1.0" },
    { capabilities: {} }
  );
  await client.connect(transport);
  api.log?.info?.("Connected to Watercooler MCP server");
  return client;
}

async function ensureConnected(api: any): Promise<Client> {
  if (mcpClient) return mcpClient;
  if (isConnecting) {
    while (isConnecting) await new Promise((r) => setTimeout(r, 100));
    if (mcpClient) return mcpClient;
  }
  isConnecting = true;
  try {
    mcpClient = await connect(api);
    return mcpClient;
  } finally {
    isConnecting = false;
  }
}

async function callWithReconnect(api: any, fn: (client: Client) => Promise<any>): Promise<any> {
  try {
    const client = await ensureConnected(api);
    return await fn(client);
  } catch (error: any) {
    if (error?.message?.includes("Not connected") || error?.message?.includes("closed")) {
      api.log?.warn?.("Connection lost, reconnecting...");
      mcpClient = null;
      const client = await ensureConnected(api);
      return await fn(client);
    }
    throw error;
  }
}

function forward(name: string, args: Record<string, unknown>) {
  return (api: any) =>
    callWithReconnect(api, async (client) => {
      const result = await client.callTool({ name, arguments: args });
      return { content: result.content };
    });
}

export default function (api: any) {
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
      return forward("publish", { type: params.type, body: params.body, tags: params.tags, author: params.author })(api);
    }
  });

  api.registerTool({
    name: "watercooler_search",
    description: "Full-text search nuggets.",
    parameters: Type.Object({
      query: Type.String(),
      limit: Type.Optional(Type.Number())
    }),
    async execute(_id: string, params: any) {
      return forward("search", { query: params.query, limit: params.limit })(api);
    }
  });

  api.registerTool({
    name: "watercooler_get_cursor",
    description: "Get last seen event id for this viewer.",
    parameters: Type.Object({ viewer_id: Type.Optional(Type.String()) }),
    async execute(_id: string, params: any) {
      return forward("get_cursor", { viewer_id: params.viewer_id })(api);
    }
  });

  api.registerTool({
    name: "watercooler_set_cursor",
    description: "Mark events as seen.",
    parameters: Type.Object({
      viewer_id: Type.Optional(Type.String()),
      event_id: Type.Number()
    }),
    async execute(_id: string, params: any) {
      return forward("set_cursor", { viewer_id: params.viewer_id, event_id: params.event_id })(api);
    }
  });

  api.registerTool({
    name: "watercooler_counts",
    description: "Get new_events and new_nuggets since viewer's cursor.",
    parameters: Type.Object({ viewer_id: Type.Optional(Type.String()) }),
    async execute(_id: string, params: any) {
      return forward("counts", { viewer_id: params.viewer_id })(api);
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
      return forward("react", { nugget_id: params.nugget_id, reaction: params.reaction })(api);
    }
  });

  api.registerTool({
    name: "watercooler_mark_applied",
    description: "Mark that you used this nugget.",
    parameters: Type.Object({ nugget_id: Type.Number() }),
    async execute(_id: string, params: any) {
      return forward("mark_applied", { nugget_id: params.nugget_id })(api);
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
      return forward("view", { name: params.name, limit: params.limit })(api);
    }
  });

  api.on?.("shutdown", async () => {
    if (mcpClient) {
      await mcpClient.close();
      mcpClient = null;
    }
  });
}
