// 联机服务器冒烟测试:创建房间→加入→双向转发→断线通知
import { WebSocket } from 'ws';
import { spawn, execSync } from 'child_process';

const PORT = 8891;

// 清理可能残留占用测试端口的旧服务端进程(由被强杀的历史 nettest 遗留)
function killOnPort(port) {
  try {
    const out = execSync(`netstat -ano -p tcp`, { encoding: 'utf8', shell: 'cmd.exe' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
    }
    for (const pid of pids) {
      try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', shell: 'cmd.exe' }); } catch { /* noop */ }
    }
    return pids.size;
  } catch { return 0; }
}

// 真实 WebSocket 握手探针:确认端口上是可用 ws 服务端(而非任意 TCP 占用)
function wsReady(port, timeout = 6000) {
  return new Promise((res) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const t = setTimeout(() => { try { ws.terminate(); } catch { /* noop */ } res(false); }, timeout);
    ws.once('open', () => { clearTimeout(t); try { ws.close(); } catch { /* noop */ } res(true); });
    ws.once('error', () => { clearTimeout(t); try { ws.terminate(); } catch { /* noop */ } res(false); });
  });
}

// 启动服务端并等待真实握手就绪
async function startServer() {
  killOnPort(PORT);
  const srv = spawn(process.execPath, ['server/server.mjs'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });
  let output = '';
  srv.stdout.on('data', d => { output += d.toString(); });
  srv.stderr.on('data', d => { output += d.toString(); });
  // 轮询握手就绪,避免"已打印但端口未绑好"竞态
  for (let i = 0; i < 20; i++) {
    if (await wsReady(PORT, 800)) return { srv, PORT };
    if (srv.exitCode !== null) break;
    await new Promise(r => setTimeout(r, 250));
  }
  console.error(output);
  throw new Error(`测试服务端未就绪 (${PORT})`);
}

const { srv } = await startServer();
let killed = false;
const killServer = () => { if (!killed) { killed = true; srv.kill(); } };
process.on('exit', killServer);
srv.on('error', killServer);

// 直连 127.0.0.1:服务端仅绑 IPv4,localhost 可能解析到无监听的 IPv6 导致连接被丢包
const url = `ws://127.0.0.1:${PORT}`;
const wait = (ws, type) => new Promise((res, rej) => {
  const timer = setTimeout(() => { ws.off('message', fn); rej(new Error(`等待 ${type} 超时`)); }, 6000);
  const fn = raw => {
    const m = JSON.parse(raw);
    if (m.t === type) { clearTimeout(timer); ws.off('message', fn); res(m); }
  };
  ws.on('message', fn);
});
const open = ws => new Promise((res, rej) => {
  const timer = setTimeout(() => rej(new Error('连接超时')), 6000);
  ws.once('open', () => { clearTimeout(timer); res(); });
  ws.once('error', e => { clearTimeout(timer); rej(e); });
});

const host = new WebSocket(url);
const guest = new WebSocket(url);
await open(host);
await open(guest);

host.send(JSON.stringify({ t: 'create', team: 'cn' }));
const created = await wait(host, 'created');
console.log('房间码:', created.code);

guest.send(JSON.stringify({ t: 'join', code: created.code, team: 'jp' }));
const [hs, gs] = await Promise.all([wait(host, 'start'), wait(guest, 'start')]);
console.log('主机角色:', hs.role, hs.myTeam, 'vs', hs.oppTeam);
console.log('客机角色:', gs.role, gs.myTeam, 'vs', gs.oppTeam);

// 客机→主机输入转发
guest.send(JSON.stringify({ t: 'input', i: { dirX: 1, skill: true, skillPressed: true } }));
const inp = await wait(host, 'input');
const inputOk = inp.i.dirX === 1 && inp.i.skill === true && inp.i.skillPressed === true;
console.log('输入转发 OK:', inputOk);

// 主机→客机快照转发
host.send(JSON.stringify({ t: 'snap', s: { bx: 5 } }));
const snap = await wait(guest, 'snap');
console.log('快照转发 OK:', snap.s.bx === 5);

// 断线通知
const leftP = wait(guest, 'peer_left');
host.close();
await leftP;
console.log('断线通知 OK');

guest.close();
killServer();
const ok = hs.role === 'host' && gs.role === 'guest' && inputOk && snap.s.bx === 5;
console.log(ok ? 'NET-OK' : 'NET-FAIL');
process.exit(ok ? 0 : 2);
