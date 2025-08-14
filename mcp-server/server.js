// Minimal MCP-like server that exposes tools and bridges to the browser via WebSocket.
// It does not implement the full MCP transport; instead it provides a simple tool layer
// that ChatGPT MCP client can wrap, or can be adapted to a proper MCP SDK transport.

import { WebSocketServer } from 'ws';
import { z } from 'zod';

const PORT = process.env.PORT ? Number(process.env.PORT) : 7801;
let browserSocket = null;

function safeSend(ws, data) {
  try { ws?.send(JSON.stringify(data)); } catch (_) { /* noop */ }
}

function waitForResponse(id, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const onMessage = (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg && msg.kind === 'response' && msg.id === id) {
          cleanup();
          if (msg.success) resolve(msg.data);
          else reject(new Error(msg.error || 'Unknown error'));
        }
      } catch (_) { /* ignore */ }
    };
    const cleanup = () => {
      if (browserSocket) browserSocket.off('message', onMessage);
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for browser response'));
    }, timeoutMs);
    if (!browserSocket) return reject(new Error('No browser connected'));
    browserSocket.on('message', onMessage);
  });
}

function forwardCommand(action, payload) {
  if (!browserSocket || browserSocket.readyState !== 1) throw new Error('No browser connected');
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  safeSend(browserSocket, { kind: 'command', id, action, payload });
  return waitForResponse(id);
}

function forwardQuery(action, payload) {
  if (!browserSocket || browserSocket.readyState !== 1) throw new Error('No browser connected');
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  safeSend(browserSocket, { kind: 'query', id, action, payload });
  return waitForResponse(id);
}

// Zod schemas for validation
const vector3 = z.tuple([z.number(), z.number(), z.number()]);

const tools = {
  async list_furnitures() {
    const state = await forwardQuery('getState');
    return state?.furniture?.furnitures ?? [];
  },
  async add_furniture(input) {
    const schema = z.object({ type: z.string().default('chair') });
    const { type } = schema.parse(input || {});
    await forwardCommand('addFurniture', { type });
    return { ok: true };
  },
  async add_glb_furniture(input) {
    const schema = z.object({ type: z.string(), modelPath: z.string() });
    const { type, modelPath } = schema.parse(input || {});
    await forwardCommand('addGLBFurniture', { type, modelPath });
    return { ok: true };
  },
  async select_furniture(input) {
    const schema = z.object({ index: z.number().int().nonnegative().optional(), id: z.number().optional() });
    const data = schema.parse(input || {});
    await forwardCommand('selectFurniture', data);
    return { ok: true };
  },
  async move_furniture(input) {
    const schema = z.object({ id: z.number(), position: vector3 });
    const { id, position } = schema.parse(input || {});
    await forwardCommand('moveFurniture', { id, position });
    return { ok: true };
  },
  async rotate_furniture(input) {
    const schema = z.object({ id: z.number(), rotation: vector3 });
    const { id, rotation } = schema.parse(input || {});
    await forwardCommand('rotateFurniture', { id, rotation });
    return { ok: true };
  },
  async delete_furniture() {
    await forwardCommand('deleteFurniture', {});
    return { ok: true };
  },
  async save_scene() {
    await forwardCommand('saveScene', {});
    return { ok: true };
  },
  async load_scene() {
    await forwardCommand('loadSavedScene', {});
    return { ok: true };
  }
};

function describeTools() {
  return Object.keys(tools).map((name) => ({ name }));
}

// Lightweight JSON-RPC over WS for the MCP client side (bridge)
const bridgeServer = new WebSocketServer({ noServer: true });

bridgeServer.on('connection', (ws) => {
  browserSocket = ws;
  ws.on('message', (msg) => {
    // This branch handles messages coming from the browser bridge.
    // The main tool RPC will be another connection from ChatGPT MCP client.
    try {
      const data = JSON.parse(msg.toString());
      if (data?.kind === 'event' && data?.type === 'connected') {
        // ignore
      }
    } catch (_) { /* noop */ }
  });
  ws.on('close', () => {
    if (browserSocket === ws) browserSocket = null;
  });
});

// Second WS endpoint for tool RPC on a different path
const rpcServer = new WebSocketServer({ noServer: true });

rpcServer.on('connection', (ws) => {
  ws.on('message', async (raw) => {
    let req = null;
    try { req = JSON.parse(raw.toString()); } catch (e) { return; }
    const { id, method, params } = req || {};
    const send = (payload) => safeSend(ws, { jsonrpc: '2.0', id, ...payload });
    try {
      if (method === 'describeTools') {
        return send({ result: describeTools() });
      }
      const tool = tools[method];
      if (!tool) throw new Error(`Unknown method: ${method}`);
      const result = await tool(params);
      send({ result });
    } catch (err) {
      send({ error: { code: -32000, message: String(err?.message || err) } });
    }
  });
});

// Upgrade HTTP server to handle two WS protocols
import http from 'http';
const server = http.createServer();
server.on('upgrade', (request, socket, head) => {
  const { url } = request;
  if (url === '/rpc') {
    rpcServer.handleUpgrade(request, socket, head, (ws) => {
      rpcServer.emit('connection', ws, request);
    });
  } else {
    bridgeServer.handleUpgrade(request, socket, head, (ws) => {
      bridgeServer.emit('connection', ws, request);
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[mcp-server] listening on ws://127.0.0.1:${PORT} (bridge) and ws://127.0.0.1:${PORT}/rpc (tool rpc)`);
});


