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
  clamp, isOffsidePosition, passLaneSafety,
} from './football';

export interface MatchEvent {
  type: 'kick' | 'pass' | 'shoot' | 'special' | 'goal' | 'whistle' | 'collide' | 'bounce'
      | 'tackle' | 'jump' | 'dribble' | 'dribbleWin' | 'dribbleFail' | 'fakeShot'
      | 'save' | 'post' | 'knockdown' | 'phaseChange' | 'offside' | 'foul'
      | 'callForPass' | 'tactic';
  x?: number; z?: number;
  team?: number;
  special?: SpecialDef;
  player?: Player;
  trick?: string;
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
  combo = [0, 0];                // 连续成功配合数
  comboT = [0, 0];
  goldenGoal = false;            // 加时金球模式(平局加时,进球即胜)
  training = false;              // 训练模式:不计时、能量恒满
  trainingDrill: 'free' | 'pass' | 'tackle' | 'special' | 'keeper' | 'solo' = 'free';
  drillGoal = 1;
  drillProgress = 0;
  drillStreak = 0;
  drillDone = false;
  drillCelebrated = false;
  keeperDrillShots = 0;          // 扑救特训:已射门次数
  keeperDrillTimer = 0;          // 扑救特训:下一脚射门倒计时
  keeperDrillShooter: Player | null = null;
  soloNpcFrozen = false;         // 单人训练场:NPC 冻结开关
  lastLossT = [-99, -99];        // 本方丢球时间(快速回追判定)
  sprintBackCd = [0, 0];         // 快速回追冷却
  private dashTapT = [0, 0];     // 冲刺键双击检测窗口
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
      p.shootChargeT = -1; p.shootAimZ = 0; p.fakeShotT = 0;
      p.passCallT = 0; p.passCallDirX = 0; p.passCallDirZ = 0;
      p.keeperDiveChargeT = -1; p.divePower = 0;
      p.chipRequestT = 0; p.trickType = 'none'; p.trickT = 0;
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

    if (this.phase === 'goal' && this.phaseT > C.GOAL_CELEBRATE_T) this.setupKickoff(1 - (this.ball.lastTeam === 0 ? 0 : 1));
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
    for (const team of this.humans) {
      const inp = inputs[team];
      if (!inp) continue;
      if (inp.tacticPressed && this.phase === 'play') this.cycleTactic(team);
      // 进球庆祝阶段:动作键实时切换自己的庆祝样式(滑跪/飞翔/摇篮舞/挥拳)
      if (this.phase === 'goal' && inp) {
        const ctrl = this.getControlled(team);
        if (inp.passPressed) ctrl.celebrateStyle = 0;
        else if (inp.shootPressed) ctrl.celebrateStyle = 1;
        else if (inp.skillPressed) ctrl.celebrateStyle = 2;
        else if (inp.jumpPressed) ctrl.celebrateStyle = 3;
        if (inp.passPressed || inp.shootPressed || inp.skillPressed || inp.jumpPressed) {
          this.setCelebration(ctrl);
        }
      }
    }
    // 快速回追计时器
    for (let t = 0; t < 2; t++) {
      if (this.sprintBackCd[t] > 0) this.sprintBackCd[t] -= dt;
      if (this.dashTapT[t] > 0) this.dashTapT[t] -= dt;
    }
    for (const p of this.players) {
      const isHuman = this.humans.includes(p.team) && p === this.getControlled(p.team);
      const inp = isHuman ? inputs[p.team] : null;
      // 单人训练场冻结 NPC:跳过 AI 与物理更新,球员原地静止(方便练球/摆人墙)
      if (this.training && this.trainingDrill === 'solo' && this.soloNpcFrozen && !isHuman) {
        p.vx = 0; p.vz = 0;
        continue;
      }
      if (inp && this.phase === 'play') this.applyInput(p, inp, dt);
      // 落地缓冲:能量满的球员从空中落地后仍可短暂触发必杀(解决“明明跳射却变普通射门”)
      const wasAir = p.y > 0.05;
      const wasDribbling = p.wasDribbling;
      p.update(dt);
      if (wasAir && p.onGround && this.energyFull(p.team)) p.landingGraceT = C.LANDING_GRACE_T;
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

    // 扑救特训:对手定时射门,统计玩家门将扑救数
    if (this.training && this.trainingDrill === 'keeper' && this.phase === 'play') {
      const shooter = this.keeperDrillShooter;
      const keeper = this.teamPlayers(this.humanTeam)[0];
      const dirToGoal = -this.attackDir(1 - this.humanTeam); // 射向我方球门
      if (shooter && !this.drillDone) {
        // 射手站定禁区前,倒计时到点就朝球门随机角度射门
        shooter.vx = shooter.vz = 0;
        shooter.face(dirToGoal, 0);
        this.keeperDrillTimer -= dt;
        if (this.keeperDrillTimer <= 0 && !this.ball.owner && this.keeperDrillShots < this.drillGoal) {
          const tz = (Math.random() * 2 - 1) * (C.GOAL_WIDTH / 2 + 1);
          const dx = dirToGoal * C.FIELD_LENGTH / 2 - this.ball.x, dz = tz - this.ball.z;
          const d = Math.hypot(dx, dz) || 1;
          const sp = C.SHOOT_SPEED * (0.85 + Math.random() * 0.3);
          this.ball.kick(dx / d * sp, 2 + Math.random() * 4, dz / d * sp, shooter);
          this.ball.lastTeam = shooter.team;
          this.keeperDrillShots++;
          this.keeperDrillTimer = 2.6 + Math.random() * 1.4;
          this.emit({ type: 'shoot', player: shooter });
        }
      }
      void keeper;
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
    // 假射真扣:kick 硬直中按过人键=连招豁免(其余输入仍被硬直挡住)
    const comboWindow = p.fakeShotT > C.FAKE_SHOT_LOCK - C.FAKE_COMBO_WINDOW;
    if (p.state === 'kick' && comboWindow && this.ball.owner === p && inp.skillPressed) {
      const savedState = p.state;
      const savedCd = p.dribbleCd;
      p.setState('idle');
      p.dribbleCd = 0;
      const staminaBefore = p.stamina;
      if (this.doDribble(p, inp.dirX, inp.dirZ, inp.dash)) {
        p.stamina = staminaBefore + C.STAMINA_DRIBBLE_COST * 0.5;
        p.fakeShotT = 0;
      } else {
        p.setState(savedState);
        p.dribbleCd = savedCd;
      }
      return;
    }
    if (p.busy || p.state === 'fallen') return;
    const hasBall = this.ball.owner === p;
    if (!hasBall && p.shootChargeT >= 0) { p.shootChargeT = -1; p.shootAimZ = 0; }

    // 护球:按住战术键且持球——减速但抗抢断,缓慢积攒能量
    p.shieldActive = hasBall && inp.tactic && p.onGround;
    if (p.shieldActive) this.gainEnergy(p.team, C.SHIELD_ENERGY_RATE * dt);

    // 快速回追:本方丢球 2 秒内双击冲刺键 → 向己方球门免费冲刺
    if (!hasBall && inp.dashPressed) {
      const team = p.team;
      const sinceLoss = this.time - this.lastLossT[team];
      if (sinceLoss < C.SPRINT_BACK_WINDOW && this.dashTapT[team] > 0 && this.sprintBackCd[team] <= 0) {
        // 双击成立:向己方半场方向冲刺,不耗体力
        this.sprintBackCd[team] = C.SPRINT_BACK_CD;
        this.dashTapT[team] = 0;
        const dir = -this.attackDir(team);
        p.setState('dash'); p.dashT = C.DASH_TIME; p.dashCd = C.DASH_TIME + C.DASH_COOLDOWN;
        p.vx = dir * C.DASH_SPEED * p.def.speed; p.vz = 0;
        p.face(dir, 0);
        return;
      }
      this.dashTapT[team] = C.DOUBLE_TAP_WINDOW;
    }

    // 门将专属:无球且非持球时,跳跃键=扑救蓄力(松开发动),过人键无效
    const keeperMode = p.isKeeper && !hasBall;
    if (keeperMode) {
      this.applyKeeperInput(p, inp, dt);
      return;
    }

    // 过人键花式分流:双击=彩虹;按住跳跃=牛尾巴;静止=油炸丸子;
    // 拉后方向=马赛回旋,按住冲刺=踩单车,移动中=基础变向
    if (hasBall && inp.skillPressed && (p.state === 'idle' || p.state === 'run')) {
      const comboWindow = p.fakeShotT > C.FAKE_SHOT_LOCK - C.FAKE_COMBO_WINDOW;
      // 花式变体判定(优先级:双击彩虹 > 跳跃牛尾巴 > 静止油炸丸子 > auto)
      let variant: 'auto' | 'rainbow' | 'elastico' | 'croqueta' = 'auto';
      const hasDirInput = Math.hypot(inp.dirX, inp.dirZ) >= 0.2;
      if (p.trickDoubleT <= 0) {
        // 首次按下:记录双击窗口,本次仍执行普通判定
        p.trickDoubleT = C.DOUBLE_TAP_WINDOW;
      } else {
        // 窗口内再次按下 → 彩虹过人
        p.trickDoubleT = 0;
        variant = 'rainbow';
      }
      if (variant === 'auto' && inp.jump) variant = 'elastico';
      if (variant === 'auto' && !hasDirInput && p.state === 'idle') variant = 'croqueta';

      if (comboWindow) {
        // 假射真扣:豁免过人冷却一次,体力半价(临时借用冷却清零)
        const savedCd = p.dribbleCd;
        p.dribbleCd = 0;
        const staminaBefore = p.stamina;
        if (this.doDribble(p, inp.dirX, inp.dirZ, inp.dash, variant)) {
          p.stamina = staminaBefore + C.STAMINA_DRIBBLE_COST * 0.5;
          p.chipRequestT = 0;
        } else {
          p.dribbleCd = savedCd;
          if (p.dribbleCd <= 0 && this.ball.owner === p) p.chipRequestT = C.CHIP_WINDOW;
        }
      } else if (p.dribbleCd <= 0) {
        if (variant !== 'rainbow') p.chipRequestT = C.CHIP_WINDOW;
        if (this.doDribble(p, inp.dirX, inp.dirZ, inp.dash, variant)) p.chipRequestT = 0;
      }
    }

    // 蓄力期间:允许慢速移动调整站位与瞄准方向(不再站桩)
    const charging = hasBall && p.onGround && p.shootChargeT >= 0;

    // 移动
    if (p.state !== 'kick') {
      const baseSp = p.moveSpeed() * this.playerSpeedScale();
      const shieldSp = p.shieldActive ? C.SHIELD_MOVE_SCALE : 1;
      const sp = charging ? baseSp * C.CHARGE_MOVE_SCALE * shieldSp : baseSp * shieldSp;
      if (inp.dirX !== 0 || inp.dirZ !== 0) {
        p.vx = inp.dirX * sp; p.vz = inp.dirZ * sp;
        if (!charging) p.face(inp.dirX, inp.dirZ);
        else {
          // 蓄力中面朝跟随输入缓慢转向(便于全向瞄准),但不瞬移朝向
          p.face(inp.dirX, inp.dirZ);
        }
        if (p.state === 'idle') p.setState('run');
      } else if (p.onGround && p.state !== 'dash') {
        p.vx = 0; p.vz = 0;
        if (p.state === 'run' && !charging) p.setState('idle');
      }
    }

    // 冲刺
    if (!charging && inp.dashPressed && p.dashCd <= 0 && p.onGround && p.consumeStamina(C.STAMINA_DASH_COST)) {
      p.setState('dash'); p.dashT = C.DASH_TIME; p.dashCd = C.DASH_TIME + C.DASH_COOLDOWN;
      p.vx = p.faceX * C.DASH_SPEED * p.def.speed;
      p.vz = p.faceZ * C.DASH_SPEED * p.def.speed;
    }

    // 跳跃(dash 状态中跳跃=鱼跃冲顶)
    if (!charging && inp.jumpPressed && p.onGround) {
      p.consumeStamina(2);
      p.vy = C.JUMP_VEL;
      if (p.state === 'dash') {
        // 鱼跃冲顶:保持前向速度腾空,空中碰球可头球攻门
        p.setState('headbutt');
        p.vy = C.JUMP_VEL * 0.9;
      } else {
        p.setState('jump');
      }
      this.emit({ type: 'jump', player: p });
    }

    if (hasBall) {
      // 门将手抛球:持球轻点传球=低平快速抛给队友(区别于长传蓄力)
      if (p.isKeeper && inp.passPressed && !inp.shoot) {
        this.doKeeperThrow(p);
      } else {
        // 地面持球射门改为蓄力:起手减速,期间可慢移瞄准,松开判定真射/假射;空中射门仍立即触发
        const inAir = !p.onGround;
        if (inAir) {
          if (inp.shootPressed) this.doShoot(p, inp);
          if (inp.passPressed) this.doPass(p);
        } else if (inp.shoot) {
          if (p.shootChargeT < 0 && p.state !== 'kick') {
            p.shootChargeT = 0;
            p.vx *= 0.35; p.vz *= 0.35;               // 起手减速(不锁死)
            const dirLen = Math.hypot(inp.dirX, inp.dirZ);
            if (dirLen > 0.25) {
              p.shootAimX = inp.dirX / dirLen; p.shootAimZ = inp.dirZ / dirLen;
            } else {
              p.shootAimX = 0; p.shootAimZ = 0;
            }
          }
          if (p.shootChargeT >= 0) {
            p.shootChargeT = Math.min(C.SHOOT_CHARGE_MAX, p.shootChargeT + dt);
            const dirLen = Math.hypot(inp.dirX, inp.dirZ);
            if (dirLen > 0.25) {
              p.shootAimX = inp.dirX / dirLen; p.shootAimZ = inp.dirZ / dirLen;
            }
          }
        } else if (p.shootChargeT >= 0) {
          const charge = p.shootChargeT;
          const aimX = p.shootAimX;
          const aimZ = p.shootAimZ;
          const chip = p.chipRequestT > 0;            // 吊射:过人键窗口内
          const daisy = inp.dash;                     // 贴地斩:蓄力期间按住冲刺
          p.shootChargeT = -1;
          p.shootAimX = 0;
          p.shootAimZ = 0;
          p.chipRequestT = 0;
          if (charge < C.FAKE_SHOT_TAP && !chip) this.doFakeShot(p);
          else this.doShoot(p, inp, charge / C.SHOOT_CHARGE_MAX, aimZ, chip, daisy, aimX);
        }
        if (!(p.isKeeper && inp.passPressed) && inp.passPressed && !inp.shoot) this.doPass(p);
      }
    } else {
      // 无球:队友持球→要球;对手持球/自由球→滑铲;射门键尝试凌空踢
      const teammateHasBall = !!this.ball.owner && this.ball.owner.team === p.team;
      if (inp.passPressed) {
        if (teammateHasBall) this.requestPass(p, inp.dirX, inp.dirZ);
        else if (p.onGround) this.doSlideTackle(p);
      }
      if (inp.shootPressed && !teammateHasBall) this.tryKickLooseBall(p);
    }
  }

  // 庆祝样式 → 对应 PlayerState
  private setCelebration(p: Player) {
    const s = p.celebrateStyle;
    p.setState(s === 0 ? 'celebrateSlide' : s === 1 ? 'celebrateFly' : s === 2 ? 'celebrateCradle' : 'celebrate');
  }

  // 无球要球:方向>阈值表示要前方空间,否则要脚下。
  requestPass(p: Player, dirX: number, dirZ: number) {
    p.passCallT = C.PASS_CALL_WINDOW;
    const mag = Math.hypot(dirX, dirZ);
    if (mag > 0.25) {
      p.passCallDirX = dirX / mag;
      p.passCallDirZ = dirZ / mag;
    } else {
      p.passCallDirX = 0;
      p.passCallDirZ = 0;
    }
    this.emit({ type: 'callForPass', player: p, x: p.x, z: p.z });
  }

  // 门将专属输入:跳跃=扑救蓄力(短按斜向/长按拳击解围),传球=滑铲逼抢,冲刺可用
  private applyKeeperInput(p: Player, inp: InputState, dt: number) {
    const charging = p.keeperDiveChargeT >= 0;

    if (!charging) {
      // 移动
      if (p.state !== 'kick' && p.state !== 'dive') {
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
      // 冲刺(出击抢点)
      if (inp.dashPressed && p.dashCd <= 0 && p.onGround && p.consumeStamina(C.STAMINA_DASH_COST)) {
        p.setState('dash'); p.dashT = C.DASH_TIME; p.dashCd = C.DASH_TIME + C.DASH_COOLDOWN;
        p.vx = p.faceX * C.DASH_SPEED * p.def.speed;
        p.vz = p.faceZ * C.DASH_SPEED * p.def.speed;
      }
      // 滑铲逼抢(对手持球冲近时)
      if (inp.passPressed && p.kickCd <= 0 && p.onGround) {
        this.doSlideTackle(p);
        return;
      }
      // 凌空解围(自由球在脚下附近)
      if (inp.shootPressed && p.kickCd <= 0) {
        this.tryKickLooseBall(p);
      }
    }

    // 跳跃键:按住计时;松开判定——短按=朝任意方向扑出,长按=拳击解围
    if (inp.jump && !charging && p.onGround) {
      p.keeperDiveChargeT = 0;
      p.vx *= 0.2; p.vz *= 0.2;
    } else if (inp.jump && charging) {
      p.keeperDiveChargeT = Math.min(C.KEEPER_DIVE_CHARGE_MAX, p.keeperDiveChargeT + dt);
    } else if (!inp.jump && charging) {
      const heldT = p.keeperDiveChargeT;
      p.keeperDiveChargeT = -1;
      if (heldT >= C.KEEPER_PUNCH_HOLD_T) {
        this.doKeeperPunch(p, inp.dirX, inp.dirZ);
      } else {
        // 斜向扑救:dirX/dirZ 全方向,力度由按住时长决定
        const power = clamp(heldT / C.KEEPER_DIVE_CHARGE_MAX, 0.15, 1);
        this.doKeeperDive(p, inp.dirX, inp.dirZ, power);
      }
    }
  }

  // 门将扑救:全方向(dirX+dirZ),力度决定横向速度与起跳高度;dive 状态扩大拾球半径并必抱稳
  doKeeperDive(p: Player, dirX: number, dirZ: number, power: number) {
    if (p.kickCd > 0 || !p.isKeeper) return;
    p.setState('dive');
    p.kickCd = C.KEEPER_DIVE_TIME + 0.15;
    p.divePower = clamp(power, 0, 1);
    const mag = Math.hypot(dirX, dirZ);
    if (mag > 0.15) {
      p.vx = (dirX / mag) * (9 + p.divePower * 7);   // 前后/斜向分量
      p.vz = (dirZ / mag) * (10 + p.divePower * 8);
      p.face(dirX / mag, dirZ / mag);
    } else {
      // 无方向:随机侧扑(AI 兜底)
      const side = Math.random() < 0.5 ? -1 : 1;
      p.vx = 0;
      p.vz = side * (10 + p.divePower * 8);
    }
    p.vy = 2.6 + p.divePower * 3.2;
    this.emit({ type: 'jump', player: p });
  }

  // 拳击解围:长按跳跃松开,双拳把来球狠狠打向前场边路
  private doKeeperPunch(p: Player, dirX: number, dirZ: number) {
    if (p.kickCd > 0) return;
    p.setState('kick'); p.kickCd = 0.35;
    p.divePower = 0;
    const b = this.ball;
    const mag = Math.hypot(dirX, dirZ) > 0.2 ? Math.hypot(dirX, dirZ) : 1;
    const nx = (Math.abs(dirX) > 0.2 ? dirX : this.attackDir(p.team)) / mag;
    const nz = (Math.abs(dirZ) > 0.2 ? dirZ : -p.z * 0.05) / mag;
    const d = Math.hypot(nx, nz) || 1;
    // 球在附近才打得到
    const dist = Math.hypot(b.x - p.x, b.z - p.z);
    if (!b.owner && dist < 3.2 && b.y < 3.4) {
      b.kick((nx / d) * C.SHOOT_SPEED * 1.25, 6.5, (nz / d) * C.SHOOT_SPEED * 1.25, p);
      b.lastTeam = p.team;
      this.emit({ type: 'kick', player: p });
    }
  }

  // 门将手抛球:低平快速抛给最近队友,快发反击用
  doKeeperThrow(p: Player) {
    if (p.kickCd > 0 || this.ball.owner !== p) return;
    const target = this.findBestPassTarget(p);
    p.setState('kick'); p.kickCd = 0.25;
    if (!target) {
      // 无目标:向进攻方向手抛
      const dir = this.attackDir(p.team);
      this.ball.kick(dir * C.PASS_SPEED * 1.1, 0.8, (Math.random() - 0.5) * 6, p);
      this.ball.lastTeam = p.team;
      this.emit({ type: 'kick', player: p });
      return;
    }
    const dx = target.x - p.x, dz = target.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    const speed = C.PASS_SPEED * 1.1;
    this.ball.kick(dx / d * speed, 0.8, dz / d * speed, p);
    this.intendedReceiver = target;
    this.gainEnergy(p.team, C.ENERGY_PER_PASS);
    this.emit({ type: 'pass', player: p });
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

  doDribble(p: Player, dirX: number, dirZ: number, dashHeld = false,
            variant: 'auto' | 'rainbow' | 'elastico' | 'croqueta' = 'auto') {
    if (this.ball.owner !== p || !p.onGround || p.dribbleCd > 0
        || (p.state !== 'idle' && p.state !== 'run')) return false;

    let dx = dirX, dz = dirZ;
    const hasDir = Math.hypot(dx, dz) >= 0.2;
    if (!hasDir && variant === 'auto') {
      let nearest: Player | null = null;
      let nearestD = Infinity;
      for (const q of this.teamPlayers(1 - p.team)) {
        const d = Math.hypot(q.x - p.x, q.z - p.z);
        if (!q.busy && d < nearestD) { nearestD = d; nearest = q; }
      }
      if (nearest) {
        const side = Math.sign((nearest.x - p.x) * -p.faceZ + (nearest.z - p.z) * p.faceX) || 1;
        dx = p.faceX * 0.55 + p.faceZ * side;
        dz = p.faceZ * 0.55 - p.faceX;
      } else {
        dx = p.faceX * 0.55 + p.faceZ;
        dz = p.faceZ * 0.55 - p.faceX;
      }
    }
    const len = Math.hypot(dx, dz) || 1;
    p.dribbleDirX = dx / len; p.dribbleDirZ = dz / len;
    if (!p.consumeStamina(C.STAMINA_DRIBBLE_COST)) return false;

    // 技巧变体分流
    p.trickType = 'none';
    p.trickFired = false;
    let trickTime = C.DRIBBLE_TIME;
    let cooldown = C.DRIBBLE_TIME + C.DRIBBLE_COOLDOWN;

    if (variant === 'rainbow') {
      // 彩虹过人:把球高高挑起越过防守者头顶,自身加速追球
      p.trickType = 'rainbow';
      trickTime = 0.5;
      cooldown = 0.5 + C.TRICK_COOLDOWN;
      const b = this.ball;
      b.owner = null;
      b.kick(p.dribbleDirX * C.RUN_SPEED * 0.62, C.RAINBOW_BALL_LIFT,
        p.dribbleDirZ * C.RUN_SPEED * 0.62, p);
      b.untouchable = C.RAINBOW_UNTOUCH;   // 球在空中越过人头期间无人可拾
      p.trickT = trickTime;
      p.dribbleCd = cooldown;
      p.dribbleStartThreat = this.nearestOpponentDist(p);
      p.setState('dribble');
      this.emit({ type: 'dribble', player: p, x: p.x, z: p.z, trick: 'rainbow' });
      return true;
    }
    if (variant === 'elastico' && hasDir) {
      // 牛尾巴:外侧假动作+反向弹出,近距防守者僵直更久
      p.trickType = 'elastico';
      trickTime = 0.45;
      cooldown = 0.45 + C.TRICK_COOLDOWN;
      for (const q of this.teamPlayers(1 - p.team)) {
        if (q.busy) continue;
        if (this.humans.includes(q.team) && q === this.getControlled(q.team)) continue;
        const d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < 2.8 && q.stunned <= 0) { q.stunned = C.ELASTICO_STUN; }
      }
    } else if (variant === 'croqueta') {
      // 油炸丸子:快速横拨,冷却短可连续串联
      p.trickType = 'croqueta';
      trickTime = 0.3;
      cooldown = C.CROQUETA_CD;
    } else if (variant === 'auto' && hasDir) {
      const dot = (dx / len) * p.faceX + (dz / len) * p.faceZ;
      if (dot < -0.6) {
        // 输入方向与面朝方向夹角>~127° → 回旋(转身摆脱)
        p.trickType = 'roulette';
        trickTime = C.TRICK_TIME;
        cooldown = C.TRICK_TIME + C.TRICK_COOLDOWN;
      } else if (dashHeld) {
        p.trickType = 'stepover';
        trickTime = C.TRICK_TIME;
        cooldown = C.TRICK_TIME + C.TRICK_COOLDOWN;
        // 踩单车假动作:2.5m 内防守者短暂失位(不冻结玩家受控角色)
        for (const q of this.teamPlayers(1 - p.team)) {
          if (q.busy) continue;
          if (this.humans.includes(q.team) && q === this.getControlled(q.team)) continue;
          const d = Math.hypot(q.x - p.x, q.z - p.z);
          if (d < 2.5 && q.stunned <= 0) { q.stunned = 0.5; }
        }
      }
    }

    p.face(p.dribbleDirX, p.dribbleDirZ);
    p.dribbleCd = cooldown;
    p.dribbleStartThreat = this.nearestOpponentDist(p);
    p.setState('dribble');
    p.trickT = trickTime;
    this.emit({ type: 'dribble', player: p, x: p.x, z: p.z, trick: p.trickType !== 'none' ? p.trickType : undefined });
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

  executePass(p: Player, target: Player, error = 0, throughBall = false, spaceX = 0, spaceZ = 0) {
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
    const hasSpace = Math.hypot(spaceX, spaceZ) > 0.01;
    const hx = C.FIELD_LENGTH / 2 - 1, hz = C.FIELD_WIDTH / 2 - 1;
    let tx: number, tz: number;
    if (hasSpace) {
      // 空间要球:落到请求方向的前方,钳制在球场内
      tx = Math.max(-hx, Math.min(hx, target.x + spaceX));
      tz = Math.max(-hz, Math.min(hz, target.z + spaceZ));
    } else {
      tx = target.x + target.vx * lead + (throughBall ? dir * 3.5 : 0);
      tz = target.z + target.vz * lead;
    }
    tx += (Math.random() - 0.5) * error;
    tz += (Math.random() - 0.5) * error;
    const dd = Math.hypot(tx - p.x, tz - p.z) || 1;
    const lift = distance > 25 ? 7.6 : distance > 16 ? 3.6 : 1.45;
    this.ball.kick((tx - p.x) / dd * speed, lift, (tz - p.z) / dd * speed, p);
    this.intendedReceiver = target;
    p.setState('kick'); p.kickCd = 0.3;
    this.gainEnergy(p.team, C.ENERGY_PER_PASS);
    this.emit({ type: 'pass', player: p });
    return true;
  }

  doPass(p: Player) {
    const target = this.findBestPassTarget(p);
    if (!target) return;
    // 冲刺中传球=低平快传:速度提升、贴地,更难被拦截
    const dashPass = p.state === 'dash';
    if (target && this.executePass(p, target) && dashPass) {
      // 出脚后修正为低平快球(保持方向,压低抬升并加速)
      const speed = Math.hypot(this.ball.vx, this.ball.vz);
      if (speed > 1) {
        const k = (speed * 1.3) / speed;
        this.ball.vx *= k; this.ball.vz *= k;
        this.ball.vy = Math.min(this.ball.vy, 1.0);
      }
    }
  }

  doShoot(p: Player, inp: InputState, chargeFrac = 0, aimZ?: number, chip = false, daisy = false, aimX?: number) {
    if (p.kickCd > 0 || this.ball.owner !== p) return;
    const dir = this.attackDir(p.team);

    // 全向瞄准:有明确输入方向时朝该方向出脚;
    // 方向大致指向对方球门(点积>0.35)则自动校准进门框,否则纯自由方向(转移/传中/回敲)
    const ax = aimX ?? 0, az = aimZ ?? inp.dirZ;
    const hasAim = Math.hypot(ax, az) > 0.25;
    let nx: number, nz: number;
    const goalX = dir * C.FIELD_LENGTH / 2;
    const goalHalf = C.GOAL_WIDTH / 2 - C.BALL_RADIUS - 0.25;
    const toGoalX = goalX - p.x, toGoalZ = -p.z * 0.08;
    const toGoalLen = Math.hypot(toGoalX, toGoalZ) || 1;

    // 深蓄精准修正:aimedZ 向门心收束(打角度更稳),侧旋减半
    const precise = chargeFrac >= C.SHOOT_CHARGE_PRECISE;
    const aimShrink = precise ? 0.65 : hasAim ? 1 : 0.6; // 默认射门也向门心收敛
    if (hasAim) {
      const dot = (ax * toGoalX + az * toGoalZ) / toGoalLen;
      if (dot > 0.35) {
        const aimedZc = clamp(az * goalHalf * aimShrink - p.z * 0.08, -goalHalf, goalHalf);
        const dx = goalX - p.x, dz = aimedZc - p.z;
        const d = Math.hypot(dx, dz) || 1;
        nx = dx / d; nz = dz / d;
      } else {
        nx = ax; nz = az;
      }
    } else {
      const aim = az;
      const aimedZ = clamp(aim * goalHalf * aimShrink - p.z * 0.08, -goalHalf, goalHalf);
      const dx = goalX - p.x, dz = aimedZ - p.z;
      const d = Math.hypot(dx, dz) || 1;
      nx = dx / d; nz = dz / d;
    }

    // 必杀双通道:A=能量满+空中按射门;B=能量满+满蓄力松开(地面可控触发)
    const inAir = !p.onGround && p.y > 0.6;
    const fullCharge = chargeFrac >= 0.999;
    const specialA = this.energyFull(p.team) && (inAir || p.landingGraceT > 0);
    const specialB = this.energyFull(p.team) && fullCharge;
    if (specialA || specialB) {
      const def = SPECIALS[p.def.special];
      this.energy[p.team] = 0;
      p.landingGraceT = 0;
      // 门内校准:朝门方向时落点再向门内收束 25%,减少打飞
      let snx = nx, snz = nz;
      const sdot = (nx * toGoalX + nz * toGoalZ) / toGoalLen;
      if (sdot > 0.3) {
        const szAim = clamp(nz * 30 * 0.75, -goalHalf + p.z, goalHalf + p.z);
        const sd = Math.hypot(toGoalX, szAim - p.z) || 1;
        snx = toGoalX / sd; snz = (szAim - p.z) / sd;
      }
      this.ball.kick(snx * C.SPECIAL_SPEED * def.speed, C.SHOOT_LIFT * def.lift, snz * C.SPECIAL_SPEED * def.speed, p, def);
      this.lastSpecial = { def, t: 2.2 };
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'special', special: def, player: p, x: p.x, z: p.z });
      return;
    }

    // 吊射:高抛越门将;贴地斩:低平快球穿防线
    if (chip) {
      const power = C.SHOOT_SPEED * 0.72 * p.def.power;
      this.ball.kick(nx * power, 9.5 + Math.random() * 1.5, nz * power, p);
      this.intendedReceiver = null;
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'shoot', player: p });
      return;
    }
    if (daisy) {
      const power = C.SHOOT_SPEED * 1.22 * p.def.power * (1 + chargeFrac * 0.18);
      this.ball.kick(nx * power, 0.8, nz * power, p, null, clamp(az * 4.5, -6, 6));
      this.intendedReceiver = null;
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'shoot', player: p });
      return;
    }

    // 满蓄重炮:不需要能量的顶级普通射门——大力贴地强袭
    if (fullCharge) {
      const power = C.SHOOT_SPEED * p.def.power * C.CANNON_POWER_MUL;
      this.ball.kick(nx * power, Math.min(2.2, C.CANNON_MAX_LIFT), nz * power, p, null,
        clamp(az * 2.2, -5, 5));
      this.intendedReceiver = null;
      p.setState('kick'); p.kickCd = 0.3;
      this.emit({ type: 'shoot', player: p });
      return;
    }

    const dashShot = p.state === 'dash';
    const chargeMul = 1 + chargeFrac * 0.28;
    const power = C.SHOOT_SPEED * p.def.power * (dashShot ? 1.18 : 1) * chargeMul;
    // 真实水平距离(此前误用方向向量计算,导致抬升失真)
    const distance = Math.hypot(goalX - p.x, p.z);
    // 平射为主:20 米外 lift≈2.5(球腰高度),不再高飘
    const keeperMinLift = p.isKeeper ? 7.4 : 1.2;
    const maxLift = dashShot ? 5.5 : 8.2;
    const lift = inAir ? 4.2 : clamp(1.6 + distance * 0.045 - chargeFrac * 0.8, keeperMinLift, maxLift);
    // 侧旋减半并收紧上限,避免大幅偏出门框
    const swerveMul = precise ? 0.5 : 1;
    const swerve = clamp((az * 3.2 + p.vz * 0.12 + (dashShot ? Math.sign(nz || 1) * 1.2 : 0)) * swerveMul, -6, 6);
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
      // 扑救中的门将有更大接触半径(力度越大覆盖越广)
      const reach = p.isKeeper
        ? (activeKeeperDive ? 2.6 + p.divePower * 1.2 : 2.6)
        : 1.7;
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
      // 主动扑救(dive 状态)的玩家门将:时机正确的操作必扑到且必抱稳
      const activeDive = p.state === 'dive';
      // 基础扑救率下调、球速惩罚加重:大力射门更难被扑
      const saveChance = activeDive ? 1 : clamp(0.42 + (p.def.toughness - 1) * 0.34 + stamina * 0.14
        - clamp((speed - 24) / 55, 0, 0.34) - specialPenalty - heightPenalty, 0.1, 0.84);
      if (Math.random() < saveChance) {
        const catchChance = activeDive ? 1
          : clamp(0.78 - (speed - 21) * 0.025 - specialPenalty * 1.5, 0.18, 0.78);
        if (Math.random() < catchChance) {
          b.owner = p; b.lastTeam = p.team; b.special = null;
          this.recordPossession(p);
          // 扑救反击奖励:抱稳来球给全队充能,鼓励由守转攻
          this.gainEnergy(p.team, C.ENERGY_PER_TACKLE * 1.5);
        } else {
          const shot = this.shotFlight;
          const side = Math.sign(p.z - b.z) || (Math.random() < 0.5 ? -1 : 1);
          b.kick(-Math.sign(b.vx || 1) * (8 + Math.random() * 7), 5.5, side * (10 + Math.random() * 8), p);
          if (shot) shot.id = b.flightId;
          b.lastTeam = p.team;
        }
        this.emit({ type: 'save', player: p });
        // 扑救特训:玩家门将扑到即计数
        if (this.training && this.trainingDrill === 'keeper' && p.team === this.humanTeam && !this.drillDone) {
          this.drillProgress = Math.min(this.drillGoal, this.drillProgress + 1);
          if (this.drillProgress >= this.drillGoal) this.drillDone = true;
          this.keeperDrillTimer = 1.6;
        }
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
        // 必杀被门将直接没收的概率较低,保证必杀的威慑价值
        if (Math.random() < 0.16 * p.def.toughness) {
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

  // 干扰门将判定:vic 门将处于本方禁区内(含持球时)
  private isKeeperInterference(keeper: Player) {
    const dir = this.attackDir(keeper.team);
    const ownGoalX = -dir * C.FIELD_LENGTH / 2;
    const inBox = Math.abs(keeper.x - ownGoalX) < C.BOX_DEPTH + 2
      && Math.abs(keeper.z) < C.BOX_WIDTH / 2 + 2;
    return inBox || this.ball.owner === keeper;
  }

  private callKeeperInterference(att: Player, vic: Player, nx: number, nz: number) {
    this.stats[att.team].fouls++;
    this.combo[att.team] = 0; this.comboT[att.team] = 0;
    vic.knockdown(nx, nz, 7);
    this.beginRestart('freekick', vic.team, vic.x, vic.z);
    this.emit({ type: 'foul', player: att, team: att.team, x: vic.x, z: vic.z });
    this.emit({ type: 'whistle' });
  }

  resolveContact(att: Player, vic: Player, nx: number, nz: number) {
    if (vic.state === 'fallen') return;
    const attSliding = att.state === 'slide' || att.state === 'tackle';
    const attDashing = att.state === 'dash';
    if (!attSliding && !attDashing) return;
    if (attSliding && this.slideMissesAirborne(att, vic)) return;
    if (attDashing && Math.abs(att.y - vic.y) > C.DASH_HIT_MAX_DY) return;
    // 干扰门将保护规则(唯一例外):禁区内冲撞对方门将必吹任意球,其余对抗保持街机无犯规
    if (vic.isKeeper && vic.team !== att.team && this.isKeeperInterference(vic)) {
      this.callKeeperInterference(att, vic, nx, nz);
      return;
    }
    const chance = attSliding ? 0.9 : 0.65;
    // 护球减半被抢断概率
    const shieldFactor = vic.shieldActive && this.ball.owner === vic ? 0.5 : 1;
    if (Math.random() < chance * shieldFactor / vic.def.toughness) {
      const wasDribbling = vic.state === 'dribble';
      vic.knockdown(nx, nz, attSliding ? 11 : 13);
      this.emit({ type: 'collide', player: vic });
      // 掉球
      if (this.ball.owner === vic) {
        this.ball.owner = null;
        this.lastLossT[vic.team] = this.time;   // 记录丢球时间(快速回追窗口)
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
      p.shootAimZ = 0;
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
        const scorer = b.lastKicker?.team === scoringTeam ? b.lastKicker
          : this.teamPlayers(scoringTeam).find(p => !p.isKeeper && p.state !== 'fallen') ?? null;
        // 进球队庆祝:每人错开分配四种样式(滑跪/飞翔/摇篮舞/挥拳),进球者拿滑跪
        let mate = 0;
        for (const p of this.teamPlayers(scoringTeam)) {
          if (p.state === 'fallen' || p.stunned > 0) continue;
          p.celebrateStyle = p === scorer ? 0 : 1 + (mate++ % 3);
          p.vx = p.vz = 0;
          this.setCelebration(p);
        }
        // 滑跪庆祝:沿进球方向滑动
        if (scorer) {
          scorer.vx = this.attackDir(scoringTeam) * 6;
        }
        this.emit({ type: 'goal', team: scoringTeam, player: scorer ?? undefined });
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
            keeper.setState('dive');
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
      case 'keeper': return `扑救特训 ${this.drillProgress}/${this.drillGoal}`;
      case 'solo': return '单人练习场';
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
    this.keeperDrillShots = 0; this.keeperDrillTimer = 0;
    this.setupTrainingDrill();
  }

  setupTrainingDrill() {
    this.drillGoal = this.trainingDrill === 'pass' ? 6
      : this.trainingDrill === 'tackle' ? 3
      : this.trainingDrill === 'keeper' ? 5
      : this.trainingDrill === 'special' ? 2 : 1;
    const human = this.getControlled(this.humanTeam);
    if (this.trainingDrill === 'keeper') {
      // 扑救特训:玩家操控本队门将,对手前锋在禁区前循环射门
      const keeper = this.teamPlayers(this.humanTeam)[0];
      this.controlledIdx[this.humanTeam] = keeper.index;
      keeper.x = -this.attackDir(this.humanTeam) * (C.FIELD_LENGTH / 2 - 1.8);
      keeper.z = 0; keeper.vx = keeper.vz = 0;
      keeper.face(this.attackDir(this.humanTeam), 0);
      const opps = this.teamPlayers(1 - this.humanTeam).filter(q => !q.isKeeper);
      if (opps.length) {
        this.keeperDrillShooter = opps[1] ?? opps[0];
        this.keeperDrillShooter.x = -this.attackDir(this.humanTeam) * (C.FIELD_LENGTH / 2 - 13);
        this.keeperDrillShooter.z = (Math.random() - 0.5) * 10;
        this.keeperDrillShooter.vx = this.keeperDrillShooter.vz = 0;
        this.keeperDrillTimer = 1.2;
      }
      for (const p of this.players) { if (p !== keeper && p !== this.keeperDrillShooter) { p.x = 40 + p.index * 2; p.z = p.team === 0 ? -30 : 30; } }
      this.ball.reset(this.keeperDrillShooter!.x + this.attackDir(1 - this.humanTeam) * 2, this.keeperDrillShooter!.z);
      this.ball.owner = null; this.ball.lastTeam = 1 - this.humanTeam;
      if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
      return;
    }
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
    if (this.trainingDrill === 'solo') {
      // 单人训练场:全场只留玩家(含门将位可切换),其余球员移出场外冻结
      this.soloReset();
      return;
    }
    // 自由/传球:球到玩家脚下
    this.ball.reset(human.x + human.faceX * 1.5, human.z + human.faceZ * 1.5);
    this.ball.owner = human;
    this.ball.lastTeam = human.team;
    if (this.phase !== 'play') { this.phase = 'play'; this.phaseT = 0; }
  }

  // 单人训练:把除玩家外的所有球员移出场外;ballToPlayer=球回到脚下
  soloReset(ballToPlayer = true) {
    const human = this.getControlled(this.humanTeam);
    for (const p of this.players) {
      if (p === human) continue;
      p.x = 60 + p.index * 4 + p.team * 30;
      p.z = -40 - p.index * 3;
      p.vx = p.vz = 0;
      p.setState('idle');
    }
    human.x = 0; human.z = 0; human.y = 0;
    human.vx = human.vz = 0;
    human.face(this.attackDir(this.humanTeam), 0);
    human.setState('idle');
    this.ball.reset(0, 2.5);
    if (ballToPlayer) { this.ball.owner = human; }
    this.energy[0] = C.ENERGY_MAX;
    this.energy[1] = C.ENERGY_MAX;
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
  }
}
