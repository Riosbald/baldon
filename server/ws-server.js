
import { WebSocketServer } from 'ws';
const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 12005;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

const rooms = new Map(); // roomId -> Set<ws>

function joinRoom(ws, roomId) {
  ws.roomId = roomId;
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
}

function leaveRoom(ws) {
  const roomId = ws.roomId;
  if (!roomId) return;
  const set = rooms.get(roomId);
  if (set) { set.delete(ws); if (set.size === 0) rooms.delete(roomId); }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join') { joinRoom(ws, msg.roomId || 'default'); return; }
      const peers = rooms.get(ws.roomId || 'default') || new Set();
      peers.forEach((p) => { if (p !== ws && p.readyState === p.OPEN) p.send(JSON.stringify({ ...msg })); });
    } catch (e) {
      // ignore
    }
  });
  ws.on('close', () => leaveRoom(ws));
  ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }));
});
console.log(`[ws] signaling on ws://0.0.0.0:${PORT}`);
