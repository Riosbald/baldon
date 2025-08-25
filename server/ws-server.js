
import { WebSocketServer } from 'ws';
const PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 12005;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    wss.clients.forEach((c) => { if (c.readyState === ws.OPEN) c.send(msg.toString()); });
  });
  ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }));
});
console.log(`[ws] listening on ws://0.0.0.0:${PORT}`);
