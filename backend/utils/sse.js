// Tiny SSE hub for per-user event streams
import { setInterval as nodeSetInterval, clearInterval as nodeClearInterval } from 'timers';

// Map<userId:number, Set<res: ServerResponse>>
const clients = new Map();

function addClient(userId, res) {
  let set = clients.get(userId);
  if (!set) { set = new Set(); clients.set(userId, set); }
  set.add(res);
}

function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

function writeEvent(res, event, dataObj) {
  try {
    if (event) res.write(`event: ${event}\n`);
    const data = JSON.stringify(dataObj ?? {});
    res.write(`data: ${data}\n\n`);
  } catch {
    // Ignore write errors (connection likely closed)
  }
}

export function subscribeToCart(userId, res) {
  // Standard SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    // Allow CORS credentials; origin headers are already set by global CORS middleware
  });

  addClient(userId, res);

  // Initial hello
  writeEvent(res, 'hello', { ok: true, ts: Date.now() });

  // Heartbeat to keep proxies from closing the connection
  const hb = nodeSetInterval(() => {
    writeEvent(res, 'ping', { ts: Date.now() });
  }, 15000);

  // Cleanup on close
  const onClose = () => {
    nodeClearInterval(hb);
    removeClient(userId, res);
  };
  res.on('close', onClose);
  res.on('finish', onClose);
}

// Notify all of a user's listeners that their cart changed.
// Optionally include origin sessionId so clients can ignore self-originated changes.
export function emitCartChanged(userId, originSessionId) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  for (const res of set) {
    writeEvent(res, 'cart', { type: 'cart:changed', sessionId: originSessionId, ts: Date.now() });
  }
}

export default { subscribeToCart, emitCartChanged };
