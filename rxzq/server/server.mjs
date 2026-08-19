// 联机服务器:房间码匹配 + 消息转发(主机权威模型)
// 运行: node server/server.mjs  (默认端口 8890)
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8890;
const wss = new WebSocketServer({ port: PORT });

// code -> { host, guest, hostTeam }
const rooms = new Map();

function genCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function send(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

wss.on('connection', ws => {
  ws.roomCode = null;
  ws.isHost = false;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.t) {
      case 'create': {
        const code = genCode();
        rooms.set(code, { host: ws, guest: null, hostTeam: msg.team ?? 'cn' });
        ws.roomCode = code; ws.isHost = true;
        send(ws, { t: 'created', code });
        break;
      }
      case 'join': {
        const room = rooms.get(msg.code);
        if (!room) { send(ws, { t: 'error', msg: '房间不存在' }); return; }
        if (room.guest) { send(ws, { t: 'error', msg: '房间已满' }); return; }
        room.guest = ws;
        ws.roomCode = msg.code; ws.isHost = false;
        // 通知双方开赛:主机执 0 队,客机执 1 队
        send(room.host, { t: 'start', role: 'host', myTeam: room.hostTeam, oppTeam: msg.team ?? 'jp' });
        send(ws, { t: 'start', role: 'guest', myTeam: msg.team ?? 'jp', oppTeam: room.hostTeam });
        break;
      }
      // 输入(客机→主机)与快照(主机→客机)直接转发
      case 'input': {
        const room = rooms.get(ws.roomCode);
        if (room?.host && !ws.isHost) send(room.host, msg);
        break;
      }
      case 'snap': case 'event': {
        const room = rooms.get(ws.roomCode);
        if (room?.guest && ws.isHost) send(room.guest, msg);
        break;
      }
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    const other = ws.isHost ? room.guest : room.host;
    send(other, { t: 'peer_left' });
    rooms.delete(ws.roomCode);
  });
});

console.log(`[nekketsu] WebSocket 服务器已启动 ws://localhost:${PORT}`);
