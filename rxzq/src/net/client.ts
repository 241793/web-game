// 联机客户端:主机权威模型
// - 主机:本地全量模拟,20Hz 广播快照;接收客机输入应用到 1 队
// - 客机:发送本地输入,渲染主机快照(插值)
import { InputState } from '../core/input';
import { SPECIALS } from '../core/specials';
import { Weather, Match, ShootoutState } from '../game/match';

export type NetRole = 'host' | 'guest';

export interface NetStart {
  role: NetRole;
  myTeam: string;
  oppTeam: string;
}

// 快照:球 + 22 名球员位姿 + 比分等
export interface Snapshot {
  bx: number; by: number; bz: number; bs: number;
  sp: keyof typeof SPECIALS | null;
  ps: [number, number, number, number, number, string, number, number][];
  sc: [number, number];
  en: [number, number];
  combo: [number, number];
  tactics: [string, string];
  ruleset: string;
  ctrl: [number, number];
  wind: [number, number];
  weather: Weather;
  shootout: ShootoutState | null;
  shootoutWinner: number;
  time: number; half: number; phase: string;
}

const SNAP_RATE = 1 / 20;

export class NetClient {
  ws: WebSocket | null = null;
  role: NetRole = 'host';
  connected = false;
  onStart: (s: NetStart) => void = () => {};
  onCreated: (code: string) => void = () => {};
  onError: (msg: string) => void = () => {};
  onPeerLeft: () => void = () => {};
  // 主机侧:最近收到的客机输入
  remoteInput: InputState = emptyInput();
  // 客机侧:最近两帧快照(插值)
  private snapA: Snapshot | null = null;
  private snapB: Snapshot | null = null;
  private snapT = 0;
  private sendT = 0;
  remoteEvents: any[] = [];

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => { this.connected = true; resolve(); };
      ws.onerror = () => reject(new Error('无法连接服务器'));
      ws.onclose = () => { this.connected = false; };
      ws.onmessage = ev => this.handle(JSON.parse(ev.data));
    });
  }

  private handle(msg: any) {
    switch (msg.t) {
      case 'created': this.onCreated(msg.code); break;
      case 'start': this.role = msg.role; this.onStart(msg); break;
      case 'error': this.onError(msg.msg); break;
      case 'peer_left': this.onPeerLeft(); break;
      case 'input': this.remoteInput = msg.i; break;
      case 'snap':
        this.snapA = this.snapB;
        this.snapB = msg.s;
        this.snapT = 0;
        break;
      case 'event': this.remoteEvents.push(...msg.evs); break;
    }
  }

  create(team: string) { this.send({ t: 'create', team }); }
  join(code: string, team: string) { this.send({ t: 'join', code, team }); }
  private send(obj: any) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj)); }

  // ---- 主机每帧:广播快照 + 转发事件 ----
  hostTick(m: Match, dt: number) {
    this.sendT += dt;
    if (this.sendT >= SNAP_RATE) {
      this.sendT = 0;
      this.send({ t: 'snap', s: takeSnapshot(m) });
    }
    if (m.events.length > 0) {
      // 只转发有音效/横幅意义的事件类型与必要字段
      const evs = m.events.map(e => ({
        type: e.type, team: e.team,
        x: e.x, z: e.z,
        special: e.special ? { name: e.special.name, color: e.special.color } : undefined,
        px: e.player?.x, pz: e.player?.z,
      }));
      this.send({ t: 'event', evs });
    }
  }

  // ---- 客机每帧:上报输入 ----
  guestTick(inp: InputState, dt: number) {
    this.sendT += dt;
    if (this.sendT >= 1 / 30) {
      this.sendT = 0;
      this.send({ t: 'input', i: inp });
    }
  }

  // 客机:把快照(带插值)覆盖到本地 match 用于渲染
  applySnapshot(m: Match, dt: number) {
    if (!this.snapB) return;
    this.snapT += dt;
    const a = this.snapA, b = this.snapB;
    const t = a ? Math.min(1, this.snapT / SNAP_RATE) : 1;
    const lerp = (x: number, y: number) => x + (y - x) * t;

    if (a) {
      m.ball.x = lerp(a.bx, b.bx); m.ball.y = lerp(a.by, b.by); m.ball.z = lerp(a.bz, b.bz);
    } else {
      m.ball.x = b.bx; m.ball.y = b.by; m.ball.z = b.bz;
    }
    m.ball.spin = b.bs;
    m.ball.special = b.sp ? SPECIALS[b.sp] : null;
    for (let i = 0; i < m.players.length && i < b.ps.length; i++) {
      const p = m.players[i];
      const pb = b.ps[i];
      const pa = a?.ps[i];
      if (pa) {
        p.x = lerp(pa[0], pb[0]); p.y = lerp(pa[1], pb[1]); p.z = lerp(pa[2], pb[2]);
      } else {
        p.x = pb[0]; p.y = pb[1]; p.z = pb[2];
      }
      p.faceX = pb[3]; p.faceZ = pb[4];
      p.state = pb[5] as any;
      p.animT = pb[6];
      p.stamina = pb[7];
    }
    m.score[0] = b.sc[0]; m.score[1] = b.sc[1];
    m.energy[0] = b.en[0]; m.energy[1] = b.en[1];
    m.combo[0] = b.combo[0]; m.combo[1] = b.combo[1];
    m.tactics[0] = b.tactics[0] as any; m.tactics[1] = b.tactics[1] as any;
    m.ruleset = b.ruleset as any;
    m.controlledIdx[0] = b.ctrl[0]; m.controlledIdx[1] = b.ctrl[1];
    m.wind.x = b.wind[0]; m.wind.z = b.wind[1];
    m.weather = b.weather;
    m.shootout = b.shootout ? { ...b.shootout, scores: [...b.shootout.scores], attempts: [...b.shootout.attempts] } : null;
    m.shootoutWinner = b.shootoutWinner;
    m.time = b.time; m.half = b.half;
    m.phase = b.phase as any;
  }

  close() { this.ws?.close(); this.ws = null; }
}

export function takeSnapshot(m: Match): Snapshot {
  return {
    bx: m.ball.x, by: m.ball.y, bz: m.ball.z, bs: m.ball.spin,
    sp: m.ball.special?.id ?? null,
    ps: m.players.map(p => [p.x, p.y, p.z, p.faceX, p.faceZ, p.state, p.animT, p.stamina]),
    sc: [m.score[0], m.score[1]],
    en: [m.energy[0], m.energy[1]],
    combo: [m.combo[0], m.combo[1]],
    tactics: [m.tactics[0], m.tactics[1]],
    ruleset: m.ruleset,
    ctrl: [m.controlledIdx[0], m.controlledIdx[1]],
    wind: [m.wind.x, m.wind.z],
    weather: m.weather,
    shootout: m.shootout ? { ...m.shootout, scores: [...m.shootout.scores], attempts: [...m.shootout.attempts] } : null,
    shootoutWinner: m.shootoutWinner,
    time: m.time, half: m.half, phase: m.phase,
  };
}

export function emptyInput(): InputState {
  return {
    dirX: 0, dirZ: 0, pass: false, shoot: false, dash: false, jump: false, skill: false,
    switchPlayer: false, tactic: false,
    passPressed: false, shootPressed: false, dashPressed: false, jumpPressed: false, skillPressed: false,
    switchPressed: false, tacticPressed: false,
  };
}
