import * as C from '../core/constants';
import { TeamDef, MatchPhase, Ruleset, TacticalStyle } from '../core/types';

export type Weather = 'clear' | 'rain' | 'snow';

// 比赛数据统计(每队)
export interface TeamStats {
  possession: number;   // 控球秒数
  shots: number;
  onTarget: number;
  tackleAttempts: number;
  tackles: number;
  specials: number;
  saves: number;
  passAttempts: number;
  passCompleted: number;
  interceptions: number;
  fouls: number;
  offsides: number;
  woodwork: number;
}
export const emptyStats = (): TeamStats =>
  ({ possession: 0, shots: 0, onTarget: 0, tackleAttempts: 0, tackles: 0,
    specials: 0, saves: 0, passAttempts: 0, passCompleted: 0,
    interceptions: 0, fouls: 0, offsides: 0, woodwork: 0 });

// 点球大战状态
export interface ShootoutState {
  scores: [number, number];
  attempts: [number, number];
  shooterTeam: number;
  shooterIdx: number;
  stage: 'setup' | 'aim' | 'live' | 'result';
  stageT: number;
  resultText: string;
  keeperTargetZ: number;
  aiDelay: number;
}
import { SPECIALS, SpecialDef } from '../core/specials';
import { Ball } from './ball';
import { Player } from './player';
import { InputState } from '../core/input';
import {
  clamp, estimateBallIntercept, isOffsidePosition, passLaneSafety,
} from './football';

export interface MatchEvent {
  type: 'kick' | 'pass' | 'shoot' | 'special' | 'goal' | 'whistle' | 'collide' | 'bounce'
      | 'tackle' | 'jump' | 'dribble' | 'dribbleWin' | 'dribbleFail' | 'fakeShot'
      | 'save' | 'post' | 'knockdown' | 'phaseChange' | 'offside' | 'foul'
      | 'controlSwitch' | 'tactic';
  x?: number; z?: number;
  team?: number;
  special?: SpecialDef;
  player?: Player;
}

// 阵型基准位(x 为进攻方向倍率, 0=门将)
const FORMATION: [number, number][] = [
  [-0.46, 0],      // GK
  [-0.28, -0.28],  // DF
  [-0.28, 0.28],   // DF
  [-0.05, 0],      // MF
  [-0.12, -0.42],  // MF 边路
  [-0.12, 0.42],   // FW 边路
];

export class Match {
  ball = new Ball();
  players: Player[] = [];
  private playersByTeam: [Player[], Player[]] = [[], []];
  teams: [TeamDef, TeamDef];
  score = [0, 0];
  time = 0;
  half = 1;
  phase: MatchPhase = 'kickoff';
  phaseT = 0;
  energy = [0, 0];               // 每队共享能量槽
  wind = { x: 0, z: 0 };
  windTimer = 0;
  events: MatchEvent[] = [];
  controlledIdx = [3, 3];        // 每队固定受控球员
  kickoffTeam = 0;
  restartPos = { x: 0, z: 0 };   // 界外/角球/门球位置
  lastSpecial: { def: SpecialDef; t: number } | null = null; // HUD 展示
  humanTeam = 0;                 // 玩家控制的队伍(-1 = 全 AI 演示)
  aiLevel: 0 | 1 | 2 = 1;        // AI 难度
  ruleset: Ruleset = 'arcade';   // 竞技规则会判越位与危险铲球
  halfDuration = C.HALF_TIME;    // 友谊赛可配置比赛时长
  energyGainScale = 1;
  tactics: [TacticalStyle, TacticalStyle] = ['balanced', 'balanced'];
  controlLocked = [false, false]; // 门将模式等固定位置时禁止手动切换
  combo = [0, 0];                // 连续成功配合数
  comboT = [0, 0];
  goldenGoal = false;            // 加时金球模式(平局加时,进球即胜)
  training = false;              // 训练模式:不计时、能量恒满
  trainingDrill: 'free' | 'pass' | 'tackle' | 'special' = 'free';
  drillGoal = 1;
  drillProgress = 0;
  drillStreak = 0;
  drillDone = false;
  drillCelebrated = false;
  weather: Weather = 'clear';    // 天气:影响物理与视觉
  stats: [TeamStats, TeamStats] = [emptyStats(), emptyStats()];
  humans: number[] = [0];        // 受人类输入控制的队伍(联机时=[0,1],纯AI演示=[])
  shootout: ShootoutState | null = null;
  shootoutWinner = -1;
  endsSwapped = false;             // 下半场起交换进攻方向
  private passFlight: { id: number; team: number } | null = null;
  private shotFlight: { id: number; team: number; onTarget: boolean } | null = null;
  private specialHitFlight = -1;
  private specialHitPlayers = new Set<Player>();
  private specialFlightTeam = -1;
  private pickupTieTeam = 0;
  private intendedReceiver: Player | null = null;
  private restartTeam = 0;

  constructor(teamA: TeamDef, teamB: TeamDef) {
    this.teams = [teamA, teamB];
    for (let t = 0; t < 2; t++) {
      for (let i = 0; i < C.TEAM_SIZE; i++) {
        const player = new Player(t, i, this.teams[t].players[i]);
        this.players.push(player);
        this.playersByTeam[t].push(player);
      }
    }
    this.randomWind();
    this.setupKickoff(0);
  }

  emit(e: MatchEvent) {
    this.events.push(e);
    // 统计埋点
    const t = e.player?.team;
    if (t !== undefined) {
      const s = this.stats[t];
      if (e.type === 'shoot') s.shots++;
      if (e.type === 'special') { s.shots++; s.specials++; }
      if (e.type === 'tackle') s.tackleAttempts++;
      if (e.type === 'save') s.saves++;
      if (e.type === 'pass') {
        s.passAttempts++;
        this.passFlight = { id: this.ball.flightId, team: t };
        this.shotFlight = null;
      }
      if (e.type === 'shoot' || e.type === 'special') {
        this.shotFlight = { id: this.ball.flightId, team: t, onTarget: false };
        this.passFlight = null;
        if (e.type === 'special') this.specialFlightTeam = t;
      }
    }
  }

  teamPlayers(t: number) { return this.playersByTeam[t]; }
  energyFull(t: number) { return this.energy[t] >= C.ENERGY_MAX - 3; }
  tacticLabel(t: number) {
    return this.tactics[t] === 'attack' ? '强攻' : this.tactics[t] === 'defend' ? '固守' : '均衡';
  }

  gainEnergy(team: number, base: number) {
    const flowBonus = 1 + Math.min(6, this.combo[team]) * 0.06;
    this.energy[team] = Math.min(C.ENERGY_MAX, this.energy[team] + base * flowBonus * this.energyGainScale);
  }

  cycleTactic(team: number) {
    const order: TacticalStyle[] = ['balanced', 'attack', 'defend'];
    this.tactics[team] = order[(order.indexOf(this.tactics[team]) + 1) % order.length];
    this.refreshHomePositions();
    this.emit({ type: 'tactic', team });
  }

  private refreshHomePositions() {
    for (const p of this.players) {
      const dir = this.attackDir(p.team);
      const [fx, fz] = FORMATION[p.index];
      const tactic = this.tactics[p.team];
      const lineShift = tactic === 'attack' ? (p.index === 0 ? 1 : p.index <= 2 ? 4 : 8)
        : tactic === 'defend' ? (p.index === 0 ? 0 : p.index <= 2 ? -3 : -7) : 0;
      p.homeX = fx * C.FIELD_LENGTH * dir + lineShift * dir;
      p.homeZ = fz * C.FIELD_WIDTH * (tactic === 'attack' ? 1.06 : tactic === 'defend' ? 0.9 : 1);
    }
  }

  switchControlled(team: number, dirX = 0, dirZ = 0) {
    if (this.controlLocked[team]) return this.getControlled(team);
    const current = this.getControlled(team);
    const owner = this.ball.owner;
    if (owner?.team === team && !owner.isKeeper && !owner.busy) {
      this.controlledIdx[team] = owner.index;
      if (owner !== current) this.emit({ type: 'controlSwitch', player: owner, team });
      return owner;
    }

    let best = current;
    let bestScore = Infinity;
    for (const p of this.teamPlayers(team)) {
      if (p.isKeeper || p.state === 'fallen' || p.stunned > 0) continue;
      const prediction = this.ball.owner
        ? { x: this.ball.owner.x, z: this.ball.owner.z, time: 0, error: 0, reachable: true }
        : estimateBallIntercept(this.ball, p, 0.1, 2.4);
      const distance = Math.hypot(prediction.x - p.x, prediction.z - p.z);
      let score = prediction.time * 8 + Math.max(0, prediction.error) + distance * 0.08;
      if (Math.hypot(dirX, dirZ) > 0.2) {
        const dx = p.x - current.x, dz = p.z - current.z;
        const d = Math.hypot(dx, dz) || 1;
        score -= ((dx / d) * dirX + (dz / d) * dirZ) * 3;
      }
      if (p === current) score += 1.3;
      if (score < bestScore) { bestScore = score; best = p; }
    }
    this.controlledIdx[team] = best.index;
    if (best !== current) this.emit({ type: 'controlSwitch', player: best, team });
    return best;
  }

  attackDir(t: number) {
    const initialDir = t === 0 ? 1 : -1;
    return this.endsSwapped ? -initialDir : initialDir;
  }

  isOffsideTarget(team: number, target: Player) {
    return isOffsidePosition(
      team,
      target,
      this.ball.x,
      this.teamPlayers(1 - team),
      this.attackDir(team),
    );
  }

  winner(): number {
    if (this.score[0] !== this.score[1]) return this.score[0] > this.score[1] ? 0 : 1;
    return this.shootoutWinner;
  }

  randomWind() {
    const ang = Math.random() * Math.PI * 2;
    // 雨雪天风更大
    const base = this.weather === 'clear' ? 5.5 : 8;
    const mag = Math.random() * base;
    this.wind.x = Math.cos(ang) * mag;
    this.wind.z = Math.sin(ang) * mag * 0.6;
  }

  rollWeather() {
    const r = Math.random();
    this.weather = r < 0.55 ? 'clear' : r < 0.8 ? 'rain' : 'snow';
    this.randomWind();
  }

  // 天气物理修正
  groundFriction() {
    // 雨天草皮更滑(球滚更远),雪天更涩
    return this.weather === 'rain' ? 0.992 : this.weather === 'snow' ? 0.972 : C.BALL_FRICTION;
  }
  playerSpeedScale() {
    return this.weather === 'snow' ? 0.88 : 1;
  }

  setupKickoff(kickTeam: number) {
    this.phase = 'kickoff'; this.phaseT = 0;
    this.kickoffTeam = kickTeam;
    this.ball.reset(0, 0);
    this.intendedReceiver = null;
    this.combo[0] = this.combo[1] = 0;
    this.comboT[0] = this.comboT[1] = 0;
    this.refreshHomePositions();
    for (const p of this.players) {
      const dir = this.attackDir(p.team);
      p.x = p.homeX; p.z = p.homeZ; p.y = 0;
      p.vx = p.vy = p.vz = 0;
      p.setState('idle');
      p.stunned = 0; p.kickCd = 0; p.dashCd = 0; p.dashT = 0; p.dribbleCd = 0;
      p.shootChargeT = -1; p.fakeShotT = 0;
      p.face(dir, 0);
    }
    // 开球方中锋站中圈
    const kicker = this.teamPlayers(kickTeam)[3];
    kicker.x = -this.attackDir(kickTeam) * 2.2; kicker.z = 0;
    this.emit({ type: 'whistle' });
  }

  // ---------- 主循环 ----------
  update(dt: number, inputs: (InputState | null)[]) {
    this.phaseT += dt;
    this.windTimer += dt;
    for (let t = 0; t < 2; t++) {
      if (this.comboT[t] > 0) this.comboT[t] = Math.max(0, this.comboT[t] - dt);
      else this.combo[t] = 0;
    }
    if (this.windTimer > 18) { this.windTimer = 0; this.randomWind(); }
    if (this.lastSpecial) { this.lastSpecial.t -= dt; if (this.lastSpecial.t <= 0) this.lastSpecial = null; }

    // 点球大战独立流程
    if (this.phase === 'shootout') {
      const so = this.shootout!;
      const shooterInp = inputs[so.shooterTeam];
      const keeperInp = inputs[1 - so.shooterTeam];
      this.updateShootout(
        dt,
        shooterInp?.dirZ ?? 0,
        shooterInp?.shootPressed ?? false,
        keeperInp?.dirZ ?? 0,
      );
      for (const p of this.players) p.animT += dt;
      return;
    }

    if (this.phase === 'play') {
      if (!this.training) this.time += dt;
      if (!this.training && this.time >= this.halfDuration) {
        if (this.half === 1) {
          this.half = 2; this.time = 0;
          this.endsSwapped = true;
          for (const p of this.players) p.stamina = Math.min(C.STAMINA_MAX, p.stamina + 24);
          this.phase = 'halftime'; this.phaseT = 0;
          this.ball.reset(0, 0); // 中场时飞行中的球归中圈,防止非比赛阶段飞出球场
          this.emit({ type: 'whistle' });
          return;
        } else if (this.half === 2 && this.goldenGoal && this.score[0] === this.score[1]) {
          // 平局 → 金球加时
          this.half = 3; this.time = 0;
          this.phase = 'halftime'; this.phaseT = 0;
          this.ball.reset(0, 0);
          this.emit({ type: 'whistle' });
          return;
        } else if (this.half === 3 && this.goldenGoal && this.score[0] === this.score[1]) {
          // 加时仍平局 → 点球大战
          this.startShootout();
          return;
        } else {
          this.phase = 'fulltime';
          this.emit({ type: 'whistle' });
          return;
        }
      }
      if (this.training) {
        this.energy[0] = C.ENERGY_MAX; this.energy[1] = C.ENERGY_MAX;
      } else {
        this.energy[0] = Math.max(0, this.energy[0] - C.ENERGY_DRAIN * dt);
        this.energy[1] = Math.max(0, this.energy[1] - C.ENERGY_DRAIN * dt);
      }
    }

    if (this.phase === 'goal' && this.phaseT > 2.6) this.setupKickoff(1 - (this.ball.lastTeam === 0 ? 0 : 1));
    if (this.phase === 'halftime' && this.phaseT > 2.2) this.setupKickoff(1 - this.kickoffTeam);
    if (this.phase === 'kickoff' && this.phaseT > 0.8) {
      this.phase = 'play';
      const kicker = this.teamPlayers(this.kickoffTeam)[3];
      this.ball.owner = kicker;
      this.ball.lastTeam = this.kickoffTeam;
      this.emit({ type: 'phaseChange' });
    }
    if ((this.phase === 'throwin' || this.phase === 'corner' || this.phase === 'goalkick' || this.phase === 'freekick') && this.phaseT > 1.2) {
      this.doRestart();
    }

    // 控制 & 更新球员
    if (this.phase === 'play') {
      for (const team of this.humans) {
        const inp = inputs[team];
        if (!inp) continue;
        if (inp.switchPressed) this.switchControlled(team, inp.dirX, inp.dirZ);
        if (inp.tacticPressed) this.cycleTactic(team);
      }
    }
    for (const p of this.players) {
      const inp = (this.humans.includes(p.team) && p === this.getControlled(p.team)) ? inputs[p.team] : null;
      if (inp && this.phase === 'play') this.applyInput(p, inp, dt);
      const wasDribbling = p.wasDribbling;
      p.update(dt);
      if (wasDribbling && p.state !== 'dribble' && this.phase === 'play') {
        if (this.ball.owner === p && this.nearestOpponentDist(p) > p.dribbleStartThreat + 1.5) {
          this.emit({ type: 'dribbleWin', player: p, x: p.x, z: p.z, team: p.team });
        }
      }
    }

    this.playerCollisions();

    if (this.phase === 'play' || this.phase === 'kickoff') {
      // 顺序不可交换:先移动,再扫掠沿途命中,再判越界;只有仍在比赛中才允许拾球
      this.ball.update(dt, this.wind.x, this.wind.z, this.groundFriction());
      this.ballSpecialHits();
      this.checkBounds();
      if (this.phase === 'play') this.ballPickup();
    } else {
      this.ball.update(dt, 0, 0, this.groundFriction());
      // 中停阶段的安全钳制:任何原因飞到球场外的球拉回场内
      const hx2 = C.FIELD_LENGTH / 2, hz2 = C.FIELD_WIDTH / 2;
      if (Math.abs(this.ball.x) > hx2 + 6 || Math.abs(this.ball.z) > hz2 + 6) {
        this.ball.special = null;
        this.ball.vx *= 0.5; this.ball.vz *= 0.5;
        this.ball.x = Math.max(-hx2, Math.min(hx2, this.ball.x));
        this.ball.z = Math.max(-hz2, Math.min(hz2, this.ball.z));
      }
    }

    // 控球统计
    if (this.phase === 'play' && this.ball.owner) {
      this.stats[this.ball.owner.team].possession += dt;
    }
  }

  getControlled(t: number): Player {
    const ps = this.teamPlayers(t);
    return ps[this.controlledIdx[t]] ?? ps[0];
  }

  // ---------- 玩家输入 ----------
  applyInput(p: Player, inp: InputState, dt: number) {
    if (p.busy || p.state === 'fallen') return;
    const hasBall = this.ball.owner === p;
    if (!hasBall && p.shootChargeT >= 0) p.shootChargeT = -1;

    if (hasBall && inp.skillPressed && this.doDribble(p, inp.dirX, inp.dirZ)) return;

    // 移动
    if (p.state !== 'kick') {
      const sp = p.moveSpeed() * this.playerSpeedScale();
      if (inp.dirX !== 0 || inp.dirZ !== 0) {
        p.vx = inp.dirX * sp; p.vz = inp.dirZ * sp;
        p.face(inp.dirX, inp.dirZ);
        if (p.state === 'idle') p.setState('run');
      } else if (p.onGround && p.state !== 'dash') {
        p.vx = 0; p.vz = 0;
        if (p.state === 'run') p.setState('idle');
      }
    }

    // 冲刺
    if (inp.dashPressed && p.dashCd <= 0 && p.onGround && p.consumeStamina(C.STAMINA_DASH_COST)) {
      p.setState('dash'); p.dashT = C.DASH_TIME; p.dashCd = C.DASH_TIME + C.DASH_COOLDOWN;
      p.vx = p.faceX * C.DASH_SPEED * p.def.speed;
      p.vz = p.faceZ * C.DASH_SPEED * p.def.speed;
    }

    // 跳跃
    if (inp.jumpPressed && p.onGround) {
      p.consumeStamina(2);
      p.vy = C.JUMP_VEL; p.setState('jump');
      this.emit({ type: 'jump', player: p });
    }

    if (hasBall) {
      // 地面持球射门改为蓄力:按住急停蓄力,松开判定真射/假射;空中射门仍立即触发
      const inAir = !p.onGround;
      if (inAir) {
        if (inp.shootPressed) this.doShoot(p, inp);
        if (inp.passPressed) this.doPass(p);
      } else if (inp.shoot) {
        if (p.shootChargeT < 0 && p.state !== 'kick') {
          p.shootChargeT = 0;
          p.vx *= 0.3; p.vz *= 0.3;
          const dir = this.attackDir(p.team);
          p.face(dir, 0);
        }
        if (p.shootChargeT >= 0) p.shootChargeT = Math.min(C.SHOOT_CHARGE_MAX, p.shootChargeT + dt);
      } else if (p.shootChargeT >= 0) {
        const charge = p.shootChargeT;
        p.shootChargeT = -1;
        if (charge < C.FAKE_SHOT_TAP) this.doFakeShot(p);
        else this.doShoot(p, inp, charge / C.SHOOT_CHARGE_MAX);
      }
      if (inp.passPressed && !inp.shoot) this.doPass(p);
    } else {
      // 防守键位
      if (inp.passPressed && p.onGround) this.doSlideTackle(p);
      else if (inp.shootPressed) this.tryKickLooseBall(p);
    }
  }

  doFakeShot(p: Player) {
    if (this.ball.owner !== p || p.busy) return;
    p.fakeShotT = C.FAKE_SHOT_LOCK;
    p.setState('kick'); p.kickCd = C.FAKE_SHOT_LOCK;
    this.emit({ type: 'fakeShot', player: p, x: p.x, z: p.z, team: p.team });
  }

  nearestOpponentDist(p: Player) {
    let d = Infinity;
    for (const q of this.teamPlayers(1 - p.team)) {
      if (q.busy) continue;
      const dd = Math.hypot(q.x - p.x, q.z - p.z);
      if (dd < d) d = dd;
    }
    return d;
  }

  doDribble(p: Player, dirX: number, dirZ: number) {
    if (this.ball.owner !== p || !p.onGround || p.dribbleCd > 0
        || (p.state !== 'idle' && p.state !== 'run')) return false;

    let dx = dirX, dz = dirZ;
    if (Math.hypot(dx, dz) < 0.2) {
      let nearest: Player | null = null;
      let nearestD = Infinity;
      for (const q of this.teamPlayers(1 - p.team)) {
        const d = Math.hypot(q.x - p.x, q.z - p.z);
        if (!q.busy && d < nearestD) { nearestD = d; nearest = q; }
      }
      if (nearest) {
        const side = Math.sign((nearest.x - p.x) * -p.faceZ + (nearest.z - p.z) * p.faceX) || 1;
        dx = p.faceX * 0.55 + p.faceZ * side;
        dz = p.faceZ * 0.55 - p.faceX * side;
      } else {
        dx = p.faceX * 0.55 + p.faceZ;
        dz = p.faceZ * 0.55 - p.faceX;
      }
    }
    const len = Math.hypot(dx, dz) || 1;
    p.dribbleDirX = dx / len; p.dribbleDirZ = dz / len;
    if (!p.consumeStamina(C.STAMINA_DRIBBLE_COST)) return false;
    p.face(p.dribbleDirX, p.dribbleDirZ);
    p.dribbleCd = C.DRIBBLE_TIME + C.DRIBBLE_COOLDOWN;
    p.dribbleStartThreat = this.nearestOpponentDist(p);
    p.setState('dribble');
    this.emit({ type: 'dribble', player: p, x: p.x, z: p.z });
    return true;
  }

  passTargetScore(p: Player, target: Player, facingWeight = 2.4) {
    if (target === p || target.state === 'fallen' || target.stunned > 0) return -Infinity;
    const dx = target.x - p.x, dz = target.z - p.z;
    const distance = Math.hypot(dx, dz) || 1;
    if (distance < 3 || distance > 52) return -Infinity;
    const dot = dx / distance * p.faceX + dz / distance * p.faceZ;
    const forward = dx * this.attackDir(p.team);
    const speed = C.PASS_SPEED * Math.min(1.25, 0.65 + distance / 30);
    const safety = passLaneSafety(p, target, this.teamPlayers(1 - p.team), speed, 0.18);
    let pressure = 0;
    for (const defender of this.teamPlayers(1 - p.team)) {
      const d = Math.hypot(defender.x - target.x, defender.z - target.z);
      if (d < 7) pressure += (7 - d) / 7;
    }
    const offsidePenalty = this.ruleset === 'classic' && this.isOffsideTarget(p.team, target) ? 20 : 0;
    const keeperPenalty = target.isKeeper ? (forward > -4 ? 4 : 0) : 0;
    return dot * facingWeight + forward * 0.055 + safety * 5.2 - pressure * 2.4
      - distance * 0.018 - offsidePenalty - keeperPenalty;
  }

  findBestPassTarget(p: Player, facingWeight = 2.4) {
    let best: Player | null = null, bestScore = -Infinity;
    for (const mate of this.teamPlayers(p.team)) {
      const score = this.passTargetScore(p, mate, facingWeight);
      if (score > bestScore) { bestScore = score; best = mate; }
    }
    return best;
  }

  executePass(p: Player, target: Player, error = 0, throughBall = false) {
    if (p.kickCd > 0 || this.ball.owner !== p || target.team !== p.team) return false;
    if (this.ruleset === 'classic' && this.isOffsideTarget(p.team, target)) {
      this.stats[p.team].offsides++;
      this.beginRestart('freekick', 1 - p.team, target.x, target.z);
      this.emit({ type: 'offside', player: target, team: p.team, x: target.x, z: target.z });
      this.emit({ type: 'whistle' });
      return false;
    }

    const dx0 = target.x - p.x, dz0 = target.z - p.z;
    const distance = Math.hypot(dx0, dz0) || 1;
    const speed = C.PASS_SPEED * Math.min(1.28, 0.66 + distance / 29);
    const travel = distance / speed;
    const lead = clamp(travel * (throughBall ? 0.95 : 0.62), 0.16, 0.72);
    const dir = this.attackDir(p.team);
    const tx = target.x + target.vx * lead + (throughBall ? dir * 3.5 : 0) + (Math.random() - 0.5) * error;
    const tz = target.z + target.vz * lead + (Math.random() - 0.5) * error;
    const dd = Math.hypot(tx - p.x, tz - p.z) || 1;
    const lift = distance > 25 ? 7.6 : distance > 16 ? 3.6 : 1.45;
    this.ball.kick((tx - p.x) / dd * speed, lift, (tz - p.z) / dd * speed, p);
    this.intendedReceiver = target;
    p.setState('kick'); p.kickCd = 0.3;
    this.gainEnergy(p.team, C.ENERGY_PER_PASS);
    this.emit({ type: 'pass', player: p });
    if (this.humans.includes(p.team) && !this.controlLocked[p.team] && !target.isKeeper) {
      this.controlledIdx[p.team] = target.index;
      this.emit({ type: 'controlSwitch', player: target, team: p.team });
    }
    return true;
  }

  doPass(p: Player) {
    const target = this.findBestPassTarget(p);
    if (target) this.executePass(p, target);
  }

  doShoot(p: Player, inp: InputState, chargeFrac = 0) {
    if (p.kickCd > 0 || this.ball.owner !== p) return;
    const dir = this.attackDir(p.team);
    const goalX = dir * C.FIELD_LENGTH / 2;
    const goalHalf = C.GOAL_WIDTH / 2 - C.BALL_RADIUS - 0.25;
    const aimedZ = clamp(inp.dirZ * goalHalf - p.z * 0.08, -goalHalf, goalHalf);
    const dx = goalX - p.x, dz = aimedZ - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const nx = dx / d, nz = dz / d;

    // 必杀条件:能量满 + 空中(跳跃射门)——街机式“跳跃+射门=必杀”
    const inAir = !p.onGround && p.y > 0.6;
    if (this.energyFull(p.team) && inAir) {
      const def = SPECIALS[p.def.special];
      this.energy[p.team] = 0;
      this.ball.kick(nx * C.SPECIAL_SPEED * def.speed, C.SHOOT_LIFT * def.lift, nz * C.SPECIAL_SPEED * def.speed, p, def);
      this.lastSpecial = { def, t: 2.2 };
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'special', special: def, player: p, x: p.x, z: p.z });
      return;
    }

    const chargeMul = 1 + chargeFrac * 0.28;
    const power = C.SHOOT_SPEED * p.def.power * (p.state === 'dash' ? 1.18 : 1) * chargeMul;
    const distance = Math.hypot(dx, dz);
    const lift = inAir ? 4.2 : clamp(3.2 + distance * 0.105 - chargeFrac * 1.2, 3.4, 8.2);
    const swerve = clamp(inp.dirZ * 5.5 + p.vz * 0.18, -8, 8);
    this.ball.kick(nx * power, lift, nz * power, p, null, swerve);
    this.intendedReceiver = null;
    p.setState('kick'); p.kickCd = 0.3;
    this.emit({ type: 'shoot', player: p });
  }

  doSlideTackle(p: Player) {
    if (p.kickCd > 0 || !p.onGround || p.busy || !p.consumeStamina(C.STAMINA_SLIDE_COST)) return;
    p.setState('slide'); p.kickCd = C.SLIDE_TIME + 0.2;
    p.vx = p.faceX * C.SLIDE_SPEED; p.vz = p.faceZ * C.SLIDE_SPEED;
    this.emit({ type: 'tackle', player: p });
  }

  tryKickLooseBall(p: Player) {
    if (p.kickCd > 0) return;
    // 无球时按射门:若球在可触及范围则直接凌空踢向球门
    const d = Math.hypot(p.x - this.ball.x, p.z - this.ball.z);
    const canReachHeight = this.ball.y <= 2.4 || p.y >= this.ball.y - 2.2;
    if (d < 2.6 && canReachHeight && !this.ball.owner) {
      const dir = this.attackDir(p.team);
      const goalX = dir * C.FIELD_LENGTH / 2;
      const dx = goalX - p.x, dz = -p.z * 0.5;
      const dd = Math.hypot(dx, dz) || 1;
      this.ball.kick(dx / dd * C.SHOOT_SPEED * p.def.power, 6, dz / dd * C.SHOOT_SPEED * p.def.power, p);
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'shoot', player: p });
    }
  }

  private clearFlights() {
    // 界外/进球中断飞行:若是训练队传球出界,连传中断
    if (this.training && this.trainingDrill === 'pass' && this.passFlight?.team === this.humanTeam) {
      this.drillStreak = 0;
    }
    this.passFlight = null;
    this.shotFlight = null;
    this.specialFlightTeam = -1;
    this.intendedReceiver = null;
  }

  // ---------- 球权 ----------
  private markShotOnTarget() {
    const shot = this.shotFlight;
    if (!shot || shot.id !== this.ball.flightId || shot.onTarget) return;
    shot.onTarget = true;
    this.stats[shot.team].onTarget++;
    if (this.training && this.trainingDrill === 'special'
        && shot.team === this.humanTeam && this.specialFlightTeam === shot.team && !this.drillDone) {
      this.drillProgress = Math.min(this.drillGoal, this.drillProgress + 1);
      if (this.drillProgress >= this.drillGoal) this.drillDone = true;
    }
  }

  private recordPossession(p: Player) {
    const pass = this.passFlight;
    if (pass?.id === this.ball.flightId) {
      if (pass.team === p.team) {
        this.stats[p.team].passCompleted++;
        this.combo[p.team] = Math.min(9, this.combo[p.team] + 1);
        this.comboT[p.team] = C.COMBO_TIMEOUT;
        if (this.training && this.trainingDrill === 'pass' && pass.team === this.humanTeam && !this.drillDone) {
          this.drillStreak++;
          if (this.drillStreak >= this.drillGoal) { this.drillDone = true; this.drillProgress = this.drillGoal; }
        }
      } else if (this.training && this.trainingDrill === 'pass' && pass.team === this.humanTeam) {
        this.drillStreak = 0; // 被对手截走:连传中断
      }
      if (pass.team !== p.team) {
        this.stats[p.team].interceptions++;
        this.combo[pass.team] = 0;
        this.comboT[pass.team] = 0;
      }
      this.passFlight = null;
    }
    this.intendedReceiver = null;
    this.shotFlight = null;
    this.specialFlightTeam = -1;
    if (this.training && !this.drillDone) {
      if (this.trainingDrill === 'tackle' && p.team === this.humanTeam) this.drillTackleRefeed();
      else if (this.trainingDrill === 'special' && p.team === this.humanTeam) this.drillSpecialReposition();
    }
  }

  ballPickup() {
    const b = this.ball;
    if (b.owner || b.special) return;
    let nearest = Infinity;
    let first: Player | null = null;
    let preferred: Player | null = null;
    let hasOtherTeam = false;
    for (const p of this.players) {
      const activeKeeperDive = p.isKeeper && p.state === 'dive';
      if ((p.busy && !activeKeeperDive) || (b.untouchable > 0 && p === b.lastKicker)) continue;
      const d = Math.hypot(p.x - b.x, p.z - b.z);
      const reach = p.isKeeper ? 2.6 : 1.7;
      if (d > reach || (b.y > 2.4 && p.y < b.y - 2.2)) continue;
      if (d < nearest - 0.02) {
        nearest = d;
        first = p;
        preferred = p.team === this.pickupTieTeam ? p : null;
        hasOtherTeam = false;
      } else if (Math.abs(d - nearest) < 0.02 && first) {
        if (p.team !== first.team) hasOtherTeam = true;
        if (p.team === this.pickupTieTeam) preferred = p;
      }
    }
    const p = preferred ?? first;
    if (!p) return;
    if (hasOtherTeam) this.pickupTieTeam = 1 - p.team;

    // 门将扑救模型:综合球速、高度、体力、韧性与是否必杀；成功后再区分抱稳/扑出。
    if (p.isKeeper && b.speed() > 21) {
      this.markShotOnTarget();
      const speed = b.speed();
      const stamina = p.stamina / C.STAMINA_MAX;
      // 特殊球在 ballSpecialHits 中单独处理；能进入这里的都是普通射门。
      const specialPenalty = 0;
      const heightPenalty = clamp((b.y - 1.2) / 5, 0, 0.2);
      const saveChance = clamp(0.5 + (p.def.toughness - 1) * 0.34 + stamina * 0.14
        - clamp((speed - 24) / 55, 0, 0.26) - specialPenalty - heightPenalty, 0.14, 0.88);
      if (Math.random() < saveChance) {
        const catchChance = clamp(0.78 - (speed - 21) * 0.025 - specialPenalty * 1.5, 0.18, 0.78);
        if (Math.random() < catchChance) {
          b.owner = p; b.lastTeam = p.team; b.special = null;
          this.recordPossession(p);
        } else {
          const shot = this.shotFlight;
          const side = Math.sign(p.z - b.z) || (Math.random() < 0.5 ? -1 : 1);
          b.kick(-Math.sign(b.vx || 1) * (8 + Math.random() * 7), 5.5, side * (10 + Math.random() * 8), p);
          if (shot) shot.id = b.flightId;
          b.lastTeam = p.team;
        }
        this.emit({ type: 'save', player: p });
      } // 未扑到则保持原弹道,让球继续飞向球门
      return;
    }
    if (b.speed() > 20 && !p.isKeeper) {
      b.vx *= 0.25; b.vz *= 0.25; b.vy = Math.min(b.vy, 2);
      b.untouchable = 0.1; b.lastKicker = null;
      this.emit({ type: 'bounce' });
    } else {
      // 中速来球的一停质量与韧性、体力有关，失败会形成可争抢的二点球。
      const controlChance = clamp(0.94 + (p.def.toughness - 1) * 0.18
        + p.stamina / C.STAMINA_MAX * 0.06 - Math.max(0, b.speed() - 11) * 0.025, 0.5, 0.99);
      if (!p.isKeeper && b.speed() > 11 && Math.random() > controlChance) {
        b.vx *= 0.34; b.vz *= 0.34; b.vy = Math.min(2.2, Math.abs(b.vy) * 0.3 + 0.8);
        b.lastTeam = p.team; b.untouchable = 0.08;
        this.emit({ type: 'bounce' });
        return;
      }
      b.owner = p; b.lastTeam = p.team;
      b.special = null;
      this.recordPossession(p);
    }
  }

  ballSpecialHits() {
    const b = this.ball;
    const sp = b.special;
    if (!sp) return;
    if (this.specialHitFlight !== b.flightId) {
      this.specialHitFlight = b.flightId;
      this.specialHitPlayers.clear();
    }

    const sx = b.prevX, sy = b.prevY, sz = b.prevZ;
    const dx = b.x - sx, dy = b.y - sy, dz = b.z - sz;
    const len2 = dx * dx + dy * dy + dz * dz;
    for (const p of this.players) {
      if (p.team === b.lastKicker?.team || p === b.lastKicker || this.specialHitPlayers.has(p)) continue;
      const py = p.y + 1.15;
      const t = len2 > 0
        ? Math.max(0, Math.min(1, ((p.x - sx) * dx + (py - sy) * dy + (p.z - sz) * dz) / len2))
        : 0;
      const qx = sx + dx * t, qy = sy + dy * t, qz = sz + dz * t;
      const reach = p.isKeeper ? 2.8 : 1.8;
      if (Math.hypot(p.x - qx, py - qy, p.z - qz) > reach) continue;

      this.specialHitPlayers.add(p); // 同一次飞行对每名球员只命中一次
      if (p.isKeeper) {
        this.markShotOnTarget();
        if (Math.random() < 0.28 * p.def.toughness) {
          const shot = this.shotFlight;
          b.special = null;
          b.kick(-b.vx * 0.4, 8, (Math.random() - 0.5) * 14, p);
          if (shot) { shot.id = b.flightId; this.shotFlight = null; }
          this.emit({ type: 'save', player: p });
          return;
        }
      }
      if (sp.knockdown) {
        p.knockdown(Math.sign(b.vx) || 1, (Math.random() - 0.5), p.isKeeper ? 14 : 12);
        if (sp.id === 'freeze') p.stunned = 1.6;
        this.emit({ type: 'knockdown', player: p });
      }
    }
  }

  // ---------- 碰撞 ----------
  playerCollisions() {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], b = this.players[j];
        const dx = b.x - a.x, dz = b.z - a.z;
        const d = Math.hypot(dx, dz);
        const minD = C.PLAYER_RADIUS * 2;
        if (d >= minD || d === 0) continue;
        if (Math.abs(a.y - b.y) > 2.2) continue;
        const nx = dx / d, nz = dz / d;
        const aSlidesUnderB = this.slideMissesAirborne(a, b);
        const bSlidesUnderA = this.slideMissesAirborne(b, a);
        if (!aSlidesUnderB && !bSlidesUnderA) {
          const push = (minD - d) / 2;
          a.x -= nx * push; a.z -= nz * push;
          b.x += nx * push; b.z += nz * push;
        }
        if (a.team === b.team) continue;

        if (!aSlidesUnderB) this.resolveContact(a, b, nx, nz);
        if (!bSlidesUnderA) this.resolveContact(b, a, -nx, -nz);
      }
    }
  }

  private slideMissesAirborne(att: Player, vic: Player) {
    const sliding = att.state === 'slide' || att.state === 'tackle';
    const risingJump = (vic.state === 'jump' || vic.state === 'headbutt') && vic.vy > 0;
    const airborne = risingJump || vic.y > C.SLIDE_EVADE_Y;
    return sliding && airborne;
  }

  resolveContact(att: Player, vic: Player, nx: number, nz: number) {
    if (vic.state === 'fallen') return;
    const attSliding = att.state === 'slide' || att.state === 'tackle';
    const attDashing = att.state === 'dash';
    if (!attSliding && !attDashing) return;
    if (attSliding && this.slideMissesAirborne(att, vic)) return;
    if (attDashing && Math.abs(att.y - vic.y) > C.DASH_HIT_MAX_DY) return;
    const chance = attSliding ? 0.9 : 0.65;
    if (Math.random() < chance / vic.def.toughness) {
      if (attSliding && this.ruleset === 'classic' && this.isDangerousFoul(att, vic)) {
        this.callFoul(att, vic, nx, nz);
        return;
      }
      const wasDribbling = vic.state === 'dribble';
      vic.knockdown(nx, nz, attSliding ? 11 : 13);
      this.emit({ type: 'collide', player: vic });
      // 掉球
      if (this.ball.owner === vic) {
        this.ball.owner = null;
        this.ball.kick(nx * 8 + (Math.random() - 0.5) * 6, 5, nz * 8 + (Math.random() - 0.5) * 6, null);
        this.ball.lastTeam = att.team;
        this.clearFlights();
        if (wasDribbling) this.emit({ type: 'dribbleFail', player: vic, x: vic.x, z: vic.z, team: vic.team });
        if (attSliding) {
          this.stats[att.team].tackles++;
          if (this.training && this.trainingDrill === 'tackle' && att.team === this.humanTeam && !this.drillDone) {
            this.drillProgress = Math.min(this.drillGoal, this.drillProgress + 1);
            if (this.drillProgress >= this.drillGoal) this.drillDone = true;
          }
        }
        this.gainEnergy(att.team, C.ENERGY_PER_TACKLE);
      }
    }
  }

  private isDangerousFoul(att: Player, vic: Player) {
    const vx = att.x - vic.x, vz = att.z - vic.z;
    const d = Math.hypot(vx, vz) || 1;
    const fromBehind = vx / d * vic.faceX + vz / d * vic.faceZ < -0.3;
    const ballDistance = Math.hypot(att.x - this.ball.x, att.z - this.ball.z);
    const cleanBallChallenge = this.ball.owner === vic && ballDistance < 1.45;
    let foulChance = fromBehind ? 0.68 : cleanBallChallenge ? 0.06 : 0.24;
    if (att.stateT < 0.1) foulChance += 0.08; // 高速起铲更危险
    return Math.random() < foulChance;
  }

  private callFoul(att: Player, vic: Player, nx: number, nz: number) {
    this.stats[att.team].fouls++;
    this.combo[att.team] = 0; this.comboT[att.team] = 0;
    vic.knockdown(nx, nz, 7);
    this.beginRestart('freekick', vic.team, vic.x, vic.z);
    this.emit({ type: 'foul', player: att, team: att.team, x: vic.x, z: vic.z });
    this.emit({ type: 'whistle' });
  }

  private beginRestart(phase: 'throwin' | 'corner' | 'goalkick' | 'freekick', team: number, x: number, z: number) {
    const hx = C.FIELD_LENGTH / 2, hz = C.FIELD_WIDTH / 2;
    this.phase = phase;
    this.phaseT = 0;
    this.restartTeam = team;
    this.restartPos = {
      x: clamp(x, -hx + 0.8, hx - 0.8),
      z: clamp(z, -hz + 0.8, hz - 0.8),
    };
    this.ball.special = null;
    this.clearFlights();
    this.ball.reset(this.restartPos.x, this.restartPos.z);
    for (const p of this.players) {
      p.vx *= 0.15; p.vz *= 0.15;
      p.shootChargeT = -1;
    }
  }

  private resolveGoalFrameCollision(hx: number) {
    const b = this.ball;
    const frameReach = C.GOAL_FRAME_RADIUS + C.BALL_RADIUS * 0.82;
    for (const side of [-1, 1]) {
      const planeX = side * hx;
      const crossed = side > 0
        ? b.prevX < planeX && b.x >= planeX
        : b.prevX > planeX && b.x <= planeX;
      if (!crossed) continue;
      const t = (planeX - b.prevX) / ((b.x - b.prevX) || 1);
      const z = b.prevZ + (b.z - b.prevZ) * t;
      const y = b.prevY + (b.y - b.prevY) * t;
      const nearPost = Math.abs(Math.abs(z) - C.GOAL_WIDTH / 2) <= frameReach
        && y <= C.GOAL_HEIGHT + frameReach;
      const nearBar = Math.abs(y - C.GOAL_HEIGHT) <= frameReach
        && Math.abs(z) <= C.GOAL_WIDTH / 2 + frameReach;
      if (!nearPost && !nearBar) continue;

      b.x = side * (hx - C.BALL_RADIUS * 0.5);
      b.vx = -side * Math.max(5, Math.abs(b.vx) * 0.62);
      if (nearPost) {
        b.z = Math.sign(z || 1) * (C.GOAL_WIDTH / 2 - frameReach - 0.03);
        b.vz = -Math.sign(z || 1) * Math.max(3, Math.abs(b.vz) * 0.55 + 2);
      }
      if (nearBar) {
        const below = y <= C.GOAL_HEIGHT;
        b.y = C.GOAL_HEIGHT + (below ? -frameReach : frameReach);
        b.vy = (below ? -1 : 1) * Math.max(3, Math.abs(b.vy) * 0.58);
      }
      b.special = null;
      const shotTeam = this.shotFlight?.team;
      if (shotTeam !== undefined) this.stats[shotTeam].woodwork++;
      this.emit({ type: 'post' });
      return true;
    }
    return false;
  }

  // ---------- 出界与进球 ----------
  checkBounds() {
    const b = this.ball;
    const hx = C.FIELD_LENGTH / 2, hz = C.FIELD_WIDTH / 2;
    // 持球者带球越界同样有效;先释放球权,再按脚下球坐标判定
    if (b.owner && (Math.abs(b.x) > hx || Math.abs(b.z) > hz)) {
      b.lastTeam = b.owner.team;
      b.owner = null;
      b.vx = b.vy = b.vz = 0;
      this.clearFlights();
    }

    if (this.resolveGoalFrameCollision(hx)) return;

    // 整球越过门线且完全处于门框内才算进球。
    if (Math.abs(b.x) > hx) {
      const inGoalZ = Math.abs(b.z) < C.GOAL_WIDTH / 2 - C.BALL_RADIUS * 0.35;
      const inGoalY = b.y < C.GOAL_HEIGHT - C.BALL_RADIUS * 0.35;
      if (inGoalZ && inGoalY) {
        const scoringTeam = this.attackDir(0) === Math.sign(b.x) ? 0 : 1;
        this.score[scoringTeam]++;
        this.markShotOnTarget();
        this.clearFlights();
        b.lastTeam = scoringTeam;
        b.vx *= 0.1; b.vz *= 0.1; b.special = null;
        this.emit({ type: 'goal', team: scoringTeam });
        // 金球加时:进球立即终场
        if (this.goldenGoal && this.half >= 3) {
          this.phase = 'fulltime';
          this.emit({ type: 'whistle' });
          return;
        }
        this.phase = 'goal'; this.phaseT = 0;
        return;
      }
      // 底线出界:角球或门球
      const defTeam = this.attackDir(0) === Math.sign(b.x) ? 1 : 0; // 当前该端防守方
      if (b.lastTeam === defTeam) {
        this.beginRestart('corner', 1 - defTeam, Math.sign(b.x) * (hx - 1), Math.sign(b.z || 1) * (hz - 1));
      } else {
        this.beginRestart('goalkick', defTeam, Math.sign(b.x) * (hx - 8), 0);
      }
      this.emit({ type: 'whistle' });
      return;
    }

    // 边线掷界外球
    if (Math.abs(b.z) > hz) {
      this.beginRestart('throwin', b.lastTeam === 0 ? 1 : 0,
        clamp(b.x, -hx + 2, hx - 2), Math.sign(b.z) * (hz - 0.8));
      this.emit({ type: 'whistle' });
    }
  }

  // ---------- 点球大战 ----------
  startShootout() {
    this.phase = 'shootout';
    this.phaseT = 0;
    this.shootout = {
      scores: [0, 0], attempts: [0, 0],
      shooterTeam: 0, shooterIdx: 1,
      stage: 'setup', stageT: 0,
      resultText: '', keeperTargetZ: 0, aiDelay: 0,
    };
    this.emit({ type: 'whistle' });
  }

  // 点球:主罚方向 +x 侧球门,球员/门将就位
  private shootoutSetup() {
    const so = this.shootout!;
    const gx = C.FIELD_LENGTH / 2;
    const spot = gx - 11;
    this.ball.reset(spot, 0);
    const shooter = this.teamPlayers(so.shooterTeam)[so.shooterIdx];
    const keeper = this.teamPlayers(1 - so.shooterTeam)[0];
    // 全员退场边,只留主罚与门将
    for (const p of this.players) {
      p.setState('idle'); p.vx = p.vz = 0; p.y = 0; p.stunned = 0;
      if (p === shooter) { p.x = spot - 3; p.z = 0; p.face(1, 0); }
      else if (p === keeper) { p.x = gx - 0.8; p.z = 0; p.face(-1, 0); }
      else { p.x = spot - 22; p.z = (p.team === 0 ? -1 : 1) * (8 + p.index * 3); }
    }
    so.stage = 'aim'; so.stageT = 0;
    so.keeperTargetZ = 0;
    so.aiDelay = 0.8 + Math.random() * 1.2;
  }

  // dirZ: -1..1 玩家瞄准/门将移动输入;shootPressed: 出脚
  updateShootout(dt: number, aimZ: number, shootPressed: boolean, keeperZ: number) {
    const so = this.shootout;
    if (!so) return;
    so.stageT += dt;
    const gx = C.FIELD_LENGTH / 2;
    const shooter = this.teamPlayers(so.shooterTeam)[so.shooterIdx];
    const keeper = this.teamPlayers(1 - so.shooterTeam)[0];
    const humanShoots = this.humans.includes(so.shooterTeam);
    const humanKeeps = this.humans.includes(1 - so.shooterTeam);

    switch (so.stage) {
      case 'setup':
        if (so.stageT > 0.8) this.shootoutSetup();
        break;
      case 'aim': {
        // 门将左右移动(玩家或 AI 摆动)
        const kz = humanKeeps ? keeperZ * (C.GOAL_WIDTH / 2 - 0.6)
          : Math.sin(so.stageT * 2.2) * (C.GOAL_WIDTH / 2 - 1.5);
        keeper.z += (kz - keeper.z) * Math.min(1, dt * 8);
        keeper.face(-1, 0);
        // 主罚瞄准
        const shootNow = humanShoots ? shootPressed : so.stageT >= so.aiDelay;
        if (shootNow) {
          const tz = humanShoots
            ? aimZ * (C.GOAL_WIDTH / 2 - 0.4)
            : (Math.random() * 2 - 1) * (C.GOAL_WIDTH / 2 - 0.5) * (0.55 + 0.45 * this.aiLevel / 2);
          const dx = gx - this.ball.x, dz = tz - this.ball.z;
          const d = Math.hypot(dx, dz) || 1;
          const sp = C.SHOOT_SPEED * 1.05 * shooter.def.power;
          this.ball.kick(dx / d * sp, 2.5 + Math.random() * 2.5, dz / d * sp, shooter);
          shooter.setState('kick');
          so.stage = 'live'; so.stageT = 0;
          this.emit({ type: 'shoot', player: shooter });
        }
        break;
      }
      case 'live': {
        this.ball.update(dt, 0, 0, this.groundFriction());
        // 门将扑救判定(球到达门线附近)
        const b = this.ball;
        if (b.x > gx - 2.2 && b.x < gx + 1) {
          const reach = 2.0 + keeper.def.toughness * 0.6;
          if (Math.abs(b.z - keeper.z) < reach && b.y < C.GOAL_HEIGHT * 0.9) {
            // 扑出!
            b.kick(-14 - Math.random() * 8, 5, (Math.random() - 0.5) * 12, keeper);
            keeper.setState('slide');
            so.stage = 'result'; so.stageT = 0;
            so.resultText = 'SAVE';
            so.attempts[so.shooterTeam]++;
            this.emit({ type: 'save', player: keeper });
            break;
          }
        }
        // 进球
        if (b.x > gx && Math.abs(b.z) < C.GOAL_WIDTH / 2 && b.y < C.GOAL_HEIGHT) {
          so.scores[so.shooterTeam]++;
          so.attempts[so.shooterTeam]++;
          so.stage = 'result'; so.stageT = 0;
          so.resultText = 'GOAL';
          this.stats[so.shooterTeam].onTarget++;
          this.emit({ type: 'goal', team: so.shooterTeam });
          break;
        }
        // 打飞
        if (b.x > gx + 3 || Math.abs(b.z) > C.GOAL_WIDTH / 2 + 4 || so.stageT > 3) {
          so.attempts[so.shooterTeam]++;
          so.stage = 'result'; so.stageT = 0;
          so.resultText = 'MISS';
          this.emit({ type: 'whistle' });
        }
        break;
      }
      case 'result': {
        if (so.stageT < 1.6) break;
        // 胜负判定(5 轮制 + 骤死)
        const [a, b2] = so.scores;
        const [ta, tb] = so.attempts;
        const remA = Math.max(0, 5 - ta), remB = Math.max(0, 5 - tb);
        const decided = (ta >= 5 && tb >= 5 && ta === tb && a !== b2)
          || a > b2 + remB || b2 > a + remA;
        if (decided) {
          this.shootoutWinner = a > b2 ? 0 : 1;
          this.phase = 'fulltime';
          this.emit({ type: 'whistle' });
          return;
        }
        // 换人:交替主罚,轮换 1~5 号
        so.shooterTeam = 1 - so.shooterTeam;
        if (so.shooterTeam === 0) {
          so.shooterIdx = (so.shooterIdx % 5) + 1;
        }
        so.stage = 'setup'; so.stageT = 0;
        break;
      }
    }
  }

  // ---------- 训练目标 ----------
  drillLabel(): string {
    switch (this.trainingDrill) {
      case 'pass': return `连续传球 ${this.drillStreak}/${this.drillGoal}`;
      case 'tackle': return `铲断抢球 ${this.drillProgress}/${this.drillGoal}`;
      case 'special': return `必杀射正 ${this.drillProgress}/${this.drillGoal}`;
      default: return '自由练习 · R 重置';
    }
  }

  drillFrac(): number {
    const cur = this.trainingDrill === 'pass' ? this.drillStreak : this.drillProgress;
    return Math.min(1, cur / this.drillGoal);
  }

  // 训练模式:重置球并复位训练目标
  trainingReset() {
    this.drillProgress = 0; this.drillStreak = 0;
    this.drillDone = false; this.drillCelebrated = false;
    this.setupTrainingDrill();
  }

  setupTrainingDrill() {
    this.drillGoal = this.trainingDrill === 'pass' ? 6 : this.trainingDrill === 'tackle' ? 3 : this.trainingDrill === 'special' ? 2 : 1;
    const human = this.getControlled(this.humanTeam);
    if (this.trainingDrill === 'tackle') {
      // 给最近对手球权,玩家练习铲断
      const opps = this.teamPlayers(1 - this.humanTeam).filter(q => !q.isKeeper);
      if (opps.length) {
        const near = opps.reduce((a, q) =>
          Math.hypot(q.x - human.x, q.z - human.z) < Math.hypot(a.x - human.x, a.z - human.z) ? q : a, opps[0]);
        near.x = human.x + 6; near.z = human.z + 2;
        this.ball.reset(near.x + near.faceX * 1.2, near.z + near.faceZ * 1.2);
        this.ball.owner = near; this.ball.lastTeam = near.team;
        if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
      }
      return;
    }
    if (this.trainingDrill === 'special') {
      // 把玩家放到禁区前,便于反复练习跳跃必杀
      human.x = this.attackDir(this.humanTeam) * (C.FIELD_LENGTH / 2 - 22);
      human.z = 0;
      human.vx = human.vz = 0;
      human.face(this.attackDir(this.humanTeam), 0);
      human.setState('idle');
      this.ball.reset(human.x + human.faceX * 1.4, human.z);
      this.ball.owner = human; this.ball.lastTeam = human.team;
      if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
      return;
    }
    // 自由/传球:球到玩家脚下
    this.ball.reset(human.x + human.faceX * 1.5, human.z + human.faceZ * 1.5);
    this.ball.owner = human;
    this.ball.lastTeam = human.team;
    if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
  }

  // 抢断训练:成功后把球直接交还对手,开始下一轮
  private drillTackleRefeed() {
    const p = this.ball.owner;
    const opps = this.teamPlayers(1 - this.humanTeam).filter(q => !q.isKeeper);
    if (!p || !opps.length) return;
    const near = opps.reduce((a, q) =>
      Math.hypot(q.x - p.x, q.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? q : a, opps[0]);
    near.x = p.x + 6; near.z = p.z + 2;
    this.ball.reset(near.x + near.faceX * 1.2, near.z + near.faceZ * 1.2);
    this.ball.owner = near; this.ball.lastTeam = near.team;
  }

  // 必杀训练:玩家夺回球后回到禁区前重新开始
  private drillSpecialReposition() {
    const human = this.getControlled(this.humanTeam);
    human.x = this.attackDir(this.humanTeam) * (C.FIELD_LENGTH / 2 - 22);
    human.z = 0;
    human.vx = human.vz = 0;
    human.face(this.attackDir(this.humanTeam), 0);
    human.setState('idle');
    this.ball.reset(human.x + human.faceX * 1.4, human.z);
    this.ball.owner = human; this.ball.lastTeam = human.team;
    if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
  }

  doRestart() {
    const phase = this.phase;
    const team = this.restartTeam;
    const eligible = this.teamPlayers(team).filter(p => phase === 'goalkick' ? p.isKeeper : !p.isKeeper);
    let taker = eligible[0] ?? this.teamPlayers(team)[0], nearest = Infinity;
    for (const p of eligible) {
      const d = Math.hypot(p.x - this.restartPos.x, p.z - this.restartPos.z);
      if (d < nearest) { nearest = d; taker = p; }
    }
    taker.x = this.restartPos.x; taker.z = this.restartPos.z; taker.y = 0;
    taker.vx = taker.vz = 0; taker.kickCd = 0; taker.setState('idle');
    const inward = Math.hypot(taker.x, taker.z) || 1;
    taker.face(-taker.x / inward, -taker.z / inward);

    const mates = this.teamPlayers(team).filter(p => p !== taker && p.state !== 'fallen');
    let target: Player | null = null;
    if (phase === 'corner') {
      const goalX = this.attackDir(team) * C.FIELD_LENGTH / 2;
      target = mates.filter(p => !p.isKeeper).reduce<Player | null>((best, p) => {
        if (!best) return p;
        const score = -Math.hypot(p.x - (goalX - this.attackDir(team) * 9), p.z) + p.def.toughness * 3;
        const bestScore = -Math.hypot(best.x - (goalX - this.attackDir(team) * 9), best.z) + best.def.toughness * 3;
        return score > bestScore ? p : best;
      }, null);
    } else if (phase === 'goalkick') {
      target = mates.filter(p => !p.isKeeper).reduce<Player | null>((best, p) =>
        !best || (p.x - taker.x) * this.attackDir(team) > (best.x - taker.x) * this.attackDir(team) ? p : best, null);
    } else {
      target = mates.reduce<Player | null>((best, p) => {
        const score = this.passTargetScore(taker, p, phase === 'throwin' ? 0.8 : 1.5);
        return !best || score > this.passTargetScore(taker, best, phase === 'throwin' ? 0.8 : 1.5) ? p : best;
      }, null);
    }

    this.phase = 'play'; this.phaseT = 0;
    this.ball.reset(this.restartPos.x, this.restartPos.z);
    this.ball.owner = taker; this.ball.lastTeam = team;
    if (!target) return;

    const dx = target.x - taker.x, dz = target.z - taker.z;
    const distance = Math.hypot(dx, dz) || 1;
    const lead = phase === 'corner' ? 0.45 : 0.3;
    const tx = target.x + target.vx * lead, tz = target.z + target.vz * lead;
    const dd = Math.hypot(tx - taker.x, tz - taker.z) || 1;
    const speed = phase === 'goalkick' ? 31 : phase === 'corner' ? 27 : C.PASS_SPEED;
    const lift = phase === 'goalkick' ? 10.5 : phase === 'corner' ? 11.5 : phase === 'throwin' ? 7.2 : distance > 22 ? 7 : 2.8;
    this.ball.kick((tx - taker.x) / dd * speed, lift, (tz - taker.z) / dd * speed, taker);
    this.intendedReceiver = target;
    taker.setState('kick'); taker.kickCd = 0.3;
    this.emit({ type: phase === 'goalkick' ? 'kick' : 'pass', player: taker });
    if (this.humans.includes(team) && !this.controlLocked[team] && !target.isKeeper) {
      this.controlledIdx[team] = target.index;
      this.emit({ type: 'controlSwitch', player: target, team });
    }
  }
}
