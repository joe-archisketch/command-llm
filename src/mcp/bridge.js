/*
 High-level WebSocket bridge to receive commands from a local server and
 dispatch Redux actions to manipulate furniture state. Also supports state
 queries and simple persistence via localStorage.
*/

import {
  addFurniture,
  addGLBFurniture,
  selectFurniture,
  moveFurniture,
  rotateFurniture,
  deleteFurniture,
  loadScene,
  clearFurnitures
} from "../store/furnitureSlice";

let webSocket = null;
let reconnectTimeoutId = null;
let isManualClose = false;
let requestResolversById = new Map();

function generateMessageId() {
  return `m${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sendJson(socket, data) {
  try {
    socket.send(JSON.stringify(data));
  } catch (_) {
    // ignore
  }
}

function respond(request, payload) {
  if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
  sendJson(webSocket, {
    kind: "response",
    id: request.id,
    success: true,
    data: payload ?? null
  });
}

function respondError(request, message) {
  if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
  sendJson(webSocket, {
    kind: "response",
    id: request.id,
    success: false,
    error: message || "Unknown error"
  });
}

function extractFurnitureByIdOrIndex(state, identifier) {
  const furnitures = state.furniture.furnitures;
  if (identifier == null) return null;
  if (typeof identifier === "number") {
    if (identifier >= 0 && identifier < furnitures.length) return furnitures[identifier];
  }
  if (typeof identifier === "string" || typeof identifier === "number") {
    const idNum = Number(identifier);
    if (!Number.isNaN(idNum)) {
      return furnitures.find(f => f.id === idNum) || null;
    }
  }
  return null;
}

function handleCommand(store, message) {
  const { action, payload } = message;
  const state = store.getState();

  try {
    switch (action) {
      case "addFurniture": {
        const type = payload?.type || "chair";
        store.dispatch(addFurniture({ type }));
        respond(message, { ok: true });
        break;
      }
      case "addGLBFurniture": {
        const type = payload?.type;
        const modelPath = payload?.modelPath;
        if (!type || !modelPath) return respondError(message, "type and modelPath are required");
        store.dispatch(addGLBFurniture({ type, modelPath }));
        respond(message, { ok: true });
        break;
      }
      case "selectFurniture": {
        const { index, id } = payload || {};
        if (typeof index === "number") {
          store.dispatch(selectFurniture(index));
          respond(message, { ok: true });
          break;
        }
        const target = extractFurnitureByIdOrIndex(state, id);
        if (!target) return respondError(message, "Target furniture not found");
        const idx = state.furniture.furnitures.findIndex(f => f.id === target.id);
        store.dispatch(selectFurniture(idx));
        respond(message, { ok: true });
        break;
      }
      case "moveFurniture": {
        const { id, position } = payload || {};
        if (!Array.isArray(position) || position.length !== 3) return respondError(message, "position [x,y,z] is required");
        const target = extractFurnitureByIdOrIndex(state, id);
        if (!target) return respondError(message, "Target furniture not found");
        store.dispatch(moveFurniture({ x: Number(position[0]) || 0, y: Number(position[1]) || 0.5, z: Number(position[2]) || 0 }));
        respond(message, { ok: true });
        break;
      }
      case "rotateFurniture": {
        const { id, rotation } = payload || {};
        if (!Array.isArray(rotation) || rotation.length !== 3) return respondError(message, "rotation [x,y,z] is required");
        const target = extractFurnitureByIdOrIndex(state, id);
        if (!target) return respondError(message, "Target furniture not found");
        store.dispatch(rotateFurniture({ x: Number(rotation[0]) || 0, y: Number(rotation[1]) || 0, z: Number(rotation[2]) || 0 }));
        respond(message, { ok: true });
        break;
      }
      case "deleteFurniture": {
        store.dispatch(deleteFurniture());
        respond(message, { ok: true });
        break;
      }
      case "clearFurnitures": {
        store.dispatch(clearFurnitures());
        respond(message, { ok: true });
        break;
      }
      case "loadScene": {
        const furnitures = Array.isArray(payload?.furnitures) ? payload.furnitures : [];
        store.dispatch(loadScene({ furnitures }));
        respond(message, { ok: true });
        break;
      }
      case "saveScene": {
        const snapshot = {
          furnitures: state.furniture.furnitures,
          timestamp: new Date().toISOString()
        };
        try {
          localStorage.setItem("furnitureScene", JSON.stringify(snapshot));
          respond(message, { ok: true });
        } catch (err) {
          respondError(message, `Failed to save: ${String(err?.message || err)}`);
        }
        break;
      }
      case "loadSavedScene": {
        try {
          const raw = localStorage.getItem("furnitureScene");
          if (!raw) return respondError(message, "No saved scene");
          const parsed = JSON.parse(raw);
          store.dispatch(loadScene(parsed));
          respond(message, { ok: true });
        } catch (err) {
          respondError(message, `Failed to load: ${String(err?.message || err)}`);
        }
        break;
      }
      default: {
        respondError(message, `Unknown action: ${action}`);
      }
    }
  } catch (error) {
    respondError(message, String(error?.message || error));
  }
}

function handleQuery(store, message) {
  const { action } = message;
  if (action === "getState") {
    respond(message, store.getState());
    return;
  }
  respondError(message, `Unknown query: ${action}`);
}

export function initMcpBridge(store, options) {
  const wsUrl = (options && options.url) || "ws://127.0.0.1:7801";
  const reconnectDelayMs = (options && options.reconnectDelayMs) || 1500;

  function connect() {
    if (webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isManualClose = false;
    webSocket = new WebSocket(wsUrl);

    webSocket.onopen = () => {
      sendJson(webSocket, { kind: "event", type: "connected", ts: Date.now() });
    };

    webSocket.onmessage = (event) => {
      let message = null;
      try {
        message = JSON.parse(event.data);
      } catch (_) {
        return;
      }

      if (!message || typeof message !== "object") return;

      if (message.kind === "command") {
        handleCommand(store, message);
        return;
      }
      if (message.kind === "query") {
        handleQuery(store, message);
        return;
      }

      if (message.kind === "response" && message.id && requestResolversById.has(message.id)) {
        const { resolve, reject } = requestResolversById.get(message.id);
        requestResolversById.delete(message.id);
        if (message.success) resolve(message.data);
        else reject(new Error(message.error || "Unknown error"));
      }
    };

    webSocket.onclose = () => {
      if (!isManualClose) {
        if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
        reconnectTimeoutId = setTimeout(connect, reconnectDelayMs);
      }
    };

    webSocket.onerror = () => {
      try { webSocket.close(); } catch (_) { /* noop */ }
    };
  }

  connect();

  return {
    close() {
      isManualClose = true;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)) {
        webSocket.close();
      }
    },
    request(data, timeoutMs = 5000) {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Bridge not connected"));
      const id = generateMessageId();
      const payload = { ...data, id };
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          requestResolversById.delete(id);
          reject(new Error("Request timed out"));
        }, timeoutMs);
        requestResolversById.set(id, {
          resolve: (res) => { clearTimeout(timer); resolve(res); },
          reject: (err) => { clearTimeout(timer); reject(err); }
        });
        sendJson(webSocket, payload);
      });
    }
  };
}


