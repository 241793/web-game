// Dreamin 联机适配层:主机权威模型平移到纯中继 SDK
// - 主机:本地全量模拟,20Hz 快照走 sendState(≤30Hz 红线内),离散事件走 send message(≤10Hz)
// - 客机:15Hz 输入走 sendState;渲染主机快照(插值)
// - 房间名规范化 a-z0-9-;断线重连后同实例 rejoin(SDK 自动清理旧监听,一律换新 room 对象)
import { InputState } from '../core/input';
import { SPECIALS } from '../core/specials';
import { Weather, Match, ShootoutState } from '../game/match';

export type NetRole = 'host' | 'guest';

export interface NetStart {
  role: NetRole;
  myTeam: string;
  oppTeam: string;
  myNick: string;
  oppNick: string;
  halfDuration: number;   // 单半场秒数(创建方设置)
  bestOf: 1 | 3;          // 场次:1=单场 3=三局两胜
}

// 快照:球 + 22 名球员位姿 + 比分等(数组化压缩,实测 ~1.5KB < 4KB 上限)
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
const INPUT_RATE = 1 / 15;
const WORK = 'nekketsu-storm-soccer';

// work/room 名红线:仅小写字母/数字/连字符
function normRoom(name: string): string {
  return ('n-' + name).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 63);
}

interface DreaminUser { id: string; nickname: string }
interface DreaminRoom {
  name: string;
  peers(): { id: string; nickname: string }[];
  isHost(): boolean;
  hostId(): string;
  onPeer(fn: (e: { type: 'join' | 'leave'; id: string; nickname?: string }) => void): void;
  onHost(fn: (id: string) => void): void;
  sendState(state: any): void;
  onState(fn: (state: any, fromId: string) => void): void;
  send(data: any): void;
  onMessage(fn: (data: any, fromId: string) => void): void;
  chat(text: string): void;
  onChat(fn: (m: { id: string; nickname: string; text: string }) => void): void;
  onError(fn: (e: { code: string; message: string }) => void): void;
  leave(): void;
}
interface DreaminInstance {
  user: DreaminUser;
  socket: { on(ev: string, fn: (...a: any[]) => void): void };
  room: { join(name: string): Promise<DreaminRoom> };
}
declare global {
  interface Window { Dreamin?: {
    init(opts: { work: string; nickname?: string }): Promise<DreaminInstance>;
  }; }
}

// 输入紧凑编码(~60B):数组下标对应字段
function packInput(i: InputState): any[] {
  return [
    Math.round(i.dirX * 100) / 100, Math.round(i.dirZ * 100) / 100,
    i.pass ? 1 : 0, i.shoot ? 1 : 0, i.dash ? 1 : 0, i.jump ? 1 : 0,
    i.skill ? 1 : 0, i.tactic ? 1 : 0,
    i.passPressed ? 1 : 0, i.shootPressed ? 1 : 0, i.dashPressed ? 1 : 0,
    i.jumpPressed ? 1 : 0, i.skillPressed ? 1 : 0, i.tacticPressed ? 1 : 0,
  ];
}

function unpackInput(a: any): InputState {
  const b = (v: any) => !!v;
  return {
    dirX: a[0], dirZ: a[1],
    pass: b(a[2]), shoot: b(a[3]), dash: b(a[4]), jump: b(a[5]),
    skill: b(a[6]), tactic: b(a[7]),
    passPressed: b(a[8]), shootPressed: b(a[9]), dashPressed: b(a[10]),
    jumpPressed: b(a[11]), skillPressed: b(a[12]), tacticPressed: b(a[13]),
  };
}

export class DreaminNet {
  private d: DreaminInstance | null = null;
  private room: DreaminRoom | null = null;
  private roomName = '';
  role: NetRole = 'host';
  connected = false;

  onStart: (s: NetStart) => void = () => {};
  onCreated: (code: string) => void = () => {};
  onError: (msg: string) => void = () => {};
  onPeerLeft: () => void = () => {};
  onDisconnected: () => void = () => {};

  // 主机侧:最近收到的客机输入
  remoteInput: InputState = emptyInput();
  // 客机侧:最近两帧快照(插值)
  private snapA: Snapshot | null = null;
  private snapB: Snapshot | null = null;
  private snapT = 0;
  private sendT = 0;
  remoteEvents: any[] = [];
  private started = false;
  private myTeam = '';
  private myNick = '';
  private peerTeam = '';
  private peerNick = '';
  halfDuration = 90;
  bestOf: 1 | 3 = 1;
  // 开局握手:双方进房后各发一条 hello(带所选队伍与昵称),凑齐两队即开局

  /** 连接 SDK 并进房。create=true 创建(先进房者=房主=主机),code 为 4 位房间码 */
  async connect(nickname: string, create: boolean, code: string, myTeam: string,
    opts?: { halfDuration?: number; bestOf?: 1 | 3 }): Promise<void> {
    if (!window.Dreamin) throw new Error('联机 SDK 未加载,请检查网络后刷新页面');
    this.d = await window.Dreamin.init({ work: WORK, nickname });
    this.myTeam = myTeam;
    this.myNick = nickname;
    // 比赛设置由创建方(主机)定,经 hello 同步给客机
    if (create) {
      this.halfDuration = opts?.halfDuration ?? 90;
      this.bestOf = opts?.bestOf ?? 1;
    }
    await this.joinRoom(create, code);
    this.d.socket.on('disconnect', () => {
      this.connected = false;
      if (this.started) {
        this.started = false;
        this.onDisconnected();
      }
    });
    this.d.socket.on('connect', () => {
      // 断线重连:同实例重新 join(SDK 清理旧监听),换新 room 对象重挂回调
      void this.joinRoom(this.role === 'host', code);
    });
  }

  private async joinRoom(create: boolean, code: string) {
    const name = normRoom(code);
    try {
      this.room = await this.d!.room.join(name);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes('room-full')) this.onError('房间已满');
      else if (msg.includes('server-full')) this.onError('服务器繁忙,稍后再试');
      else this.onError('进入房间失败:' + msg);
      return;
    }
    this.connected = true;
    this.snapA = null; this.snapB = null; this.remoteEvents.length = 0;

    this.room.onPeer(({ type }) => {
      if (type === 'join') {
        // 对手进房(含重连):重新握手
        this.peerTeam = '';
        this.peerNick = '';
        this.room!.send({ t: 'hello', team: this.myTeam, nick: this.myNick });
      } else if (this.started) {
        this.started = false;
        this.peerTeam = '';
        this.peerNick = '';
        this.onPeerLeft();
      }
    });
    this.room.onState((state) => {
      if (this.role === 'guest') {
        this.snapA = this.snapB;
        this.snapB = state as Snapshot;
        this.snapT = 0;
      } else {
        this.remoteInput = unpackInput(state);
      }
    });
    this.room.onMessage((data) => {
      if (data?.t === 'hello' && data.team !== this.myTeam) {
        this.peerTeam = data.team;
        this.peerNick = typeof data.nick === 'string' ? String(data.nick).slice(0, 24) : '';
        // 主机接收客机 hello 时同步比赛设置(host→guest 单向)
        if (this.role === 'guest') {
          if (typeof data.halfDuration === 'number') this.halfDuration = data.halfDuration;
          if (data.bestOf === 1 || data.bestOf === 3) this.bestOf = data.bestOf;
        }
        if (!this.started) {
          this.room!.send({
            t: 'hello', team: this.myTeam, nick: this.myNick,
            halfDuration: this.halfDuration, bestOf: this.bestOf,
          });
        }
        this.tryStart();
      } else if (this.role === 'guest' && data?.t === 'event') {
        this.remoteEvents.push(...data.evs);
      }
    });
    this.room.onError(e => {
      if (e.code === 'rate-limited') return;   // 超频静默丢弃即可,不弹窗打断比赛
      this.onError(`联机错误:${e.code}`);
    });

    this.role = create ? 'host' : 'guest';
    // 进房即广播自己的队伍;若对手已在房里,对方会回 hello 凑齐开局
    this.room.send({
      t: 'hello', team: this.myTeam, nick: this.myNick,
      halfDuration: this.halfDuration, bestOf: this.bestOf,
    });
    if (create) this.onCreated(code);
  }

  /** 双方队伍已知 → 开局。主机=0 队(左),客机=1 队(右),队伍 id 各自保留 */
  private tryStart() {
    if (this.started || !this.peerTeam) return;
    this.started = true;
    const oppTeam = this.peerTeam;
    const oppNick = this.peerNick || '对手';
    this.onStart({
      role: this.role, myTeam: this.myTeam, oppTeam,
      myNick: this.myNick, oppNick,
      halfDuration: this.halfDuration, bestOf: this.bestOf,
    });
  }

  close() {
    this.room?.leave();
    this.room = null;
    this.d = null;
    this.connected = false;
  }

  // ---- 主机每帧:广播快照(message 只发事件,严守 ≤10Hz) ----
  hostTick(m: Match, dt: number) {
    if (!this.room) return;
    this.sendT += dt;
    if (this.sendT >= SNAP_RATE) {
      this.sendT = 0;
      this.room.sendState(takeSnapshot(m));
    }
    if (m.events.length > 0) {
      const evs = m.events.map(e => ({
        type: e.type, team: e.team,
        x: e.x, z: e.z,
        special: e.special ? { name: e.special.name, color: e.special.color } : undefined,
        px: e.player?.x, pz: e.player?.z,
      }));
      this.room.send({ t: 'event', evs });
    }
  }

  // ---- 客机每帧:sendState 上报输入(15Hz,≤30Hz 红线内) ----
  guestTick(inp: InputState, dt: number) {
    if (!this.room) return;
    this.sendT += dt;
    if (this.sendT >= INPUT_RATE) {
      this.sendT = 0;
      this.room.sendState(packInput(inp));
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
    tactic: false,
    passPressed: false, shootPressed: false, dashPressed: false, jumpPressed: false, skillPressed: false,
    tacticPressed: false,
  };
}
