import * as C from '../core/constants';
import { Match } from './match';
import { Player } from './player';
import { SPECIALS } from '../core/specials';
import {
  chooseGoalTarget, estimateBallIntercept, expectedGoal, passLaneSafety, predictBallPosition,
} from './football';

// AI 大脑:每名球员一份记忆(决策冷却 + 当前跑位目标),避免逐帧抖动与站桩
interface Brain {
  thinkCd: number;      // 重新决策倒计时
  tx: number; tz: number; // 当前跑位目标
  role: 'press' | 'cut' | 'mark' | 'support' | 'chase' | 'home';
  markTarget: Player | null;
  tackleCd: number;
}
const brains = new WeakMap<Player, Brain>();
function brainOf(p: Player): Brain {
  let b = brains.get(p);
  if (!b) {
    b = { thinkCd: 0, tx: p.x, tz: p.z, role: 'home', markTarget: null, tackleCd: 0 };
    brains.set(p, b);
  }
  return b;
}

const DIFFICULTIES = [
  { think: 0.72, speed: 0.93, tackleCd: 2.9, shootErr: 4.1, passErr: 3.0, supportDist: 16, predict: 0.2, reaction: 0.42, risk: 0.35 },
  { think: 0.4, speed: 0.98, tackleCd: 2.1, shootErr: 2.2, passErr: 1.5, supportDist: 13, predict: 0.68, reaction: 0.24, risk: 0.58 },
  { think: 0.2, speed: 1.0, tackleCd: 1.45, shootErr: 0.85, passErr: 0.45, supportDist: 10.5, predict: 1, reaction: 0.12, risk: 0.78 },
] as const;

function diff(m: Match, team: number) {
  return DIFFICULTIES[m.humans.includes(team) ? 1 : m.aiLevel];
}

export function updateAI(m: Match, dt: number) {
  if (m.phase !== 'play' && m.phase !== 'kickoff') return;
  for (const p of m.players) {
    const br = brainOf(p);
    br.thinkCd -= dt;
    br.tackleCd -= dt;
    if (isHumanControlled(m, p) || p.busy) continue;
    if (p.isKeeper) keeperAI(m, p, dt);
    else fieldAI(m, p, dt);
  }
}

function isHumanControlled(m: Match, p: Player) {
  return m.humans.includes(p.team) && p.index === m.controlledIdx[p.team];
}

function moveTo(m: Match, p: Player, tx: number, tz: number, speedScale = 1) {
  const dx = tx - p.x, dz = tz - p.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.6) {
    p.vx *= 0.8; p.vz *= 0.8;
    if (p.state === 'run' && d < 0.3) p.setState('idle');
    return true;
  }
  const sp = p.moveSpeed() * speedScale * diff(m, p.team).speed * m.playerSpeedScale();
  p.vx = dx / d * sp; p.vz = dz / d * sp;
  p.face(dx, dz);
  if (p.state === 'idle') p.setState('run');
  return false;
}

// ---------------- 门将 ----------------
function keeperAI(m: Match, p: Player, dt: number) {
  const dir = m.attackDir(p.team);
  const goalX = -dir * (C.FIELD_LENGTH / 2 - 1.6);
  const b = m.ball;
  const D = diff(m, p.team);
  const ballClose = Math.abs(b.x - (-dir * C.FIELD_LENGTH / 2)) < C.BOX_DEPTH && Math.abs(b.z) < C.BOX_WIDTH / 2 + 4;
  let tx = goalX;
  if (ballClose && !b.owner) tx = goalX + dir * Math.min(6.5, Math.abs(b.x - goalX) * 0.42);
  let tz = Math.max(-C.GOAL_WIDTH / 2 - 0.6, Math.min(C.GOAL_WIDTH / 2 + 0.6, b.z * 0.68));

  // 根据当前速度、侧旋与反应时间预测球穿过门线的位置。
  let crossingTime = Infinity;
  let crossingY = b.y;
  const ownLineX = -dir * C.FIELD_LENGTH / 2;
  if (!b.owner && Math.abs(b.vx) > 1 && (ownLineX - b.x) / b.vx > 0) {
    crossingTime = (ownLineX - b.x) / b.vx;
    if (crossingTime < 2.4) {
      const predicted = predictBallPosition(b, crossingTime);
      tz = Math.max(-C.GOAL_WIDTH / 2 + 0.2, Math.min(C.GOAL_WIDTH / 2 - 0.2, predicted.z));
      crossingY = b.y + b.vy * crossingTime + C.GRAVITY * crossingTime * crossingTime * 0.5;
      tx = goalX;
    }
  }

  // 假射诱骗:普通/困难门将有概率提前扑向假方向露出空档
  const carrier = b.owner;
  if (carrier && carrier.team !== p.team && carrier.fakeShotT > 0
      && D.predict > 0 && Math.random() < 0.6) {
    const dive = (Math.random() < 0.5 ? 1 : -1) * C.GOAL_WIDTH / 2 * 0.8;
    tz = Math.max(-C.GOAL_WIDTH / 2 - 0.5, Math.min(C.GOAL_WIDTH / 2 + 0.5, dive));
  }
  moveTo(m, p, tx, tz);

  const d = Math.hypot(p.x - b.x, p.z - b.z);
  const imminent = crossingTime < (0.56 + D.reaction * 0.35);
  const lateralGap = Math.abs(tz - p.z);
  if (imminent && lateralGap > 1.35 && p.onGround && p.stamina > 8) {
    p.face(0, tz - p.z);
    p.setState('dive');
    p.vz = Math.sign(tz - p.z) * (12.5 + D.predict * 2);
    p.vx = 0;
    if (crossingY > 1.45) p.vy = Math.min(C.JUMP_VEL * 0.72, 4.5 + crossingY);
    p.consumeStamina(8);
  } else if (!b.owner && d < 4.8 && (b.y > 1.55 || crossingY > 1.7) && p.onGround && b.speed() > 11) {
    p.vy = C.JUMP_VEL * 0.9; p.setState('jump');
  }

  if (b.owner === p && p.kickCd <= 0) {
    // 门将优先把球给开放边路；困难 AI 会检查拦截线路而非盲目开大脚。
    const mates = m.teamPlayers(p.team).filter(q => !q.isKeeper);
    let target = mates[0], bestScore = -Infinity;
    for (const q of mates) {
      const forward = (q.x - p.x) * dir;
      const safety = passLaneSafety(p, q, m.teamPlayers(1 - p.team), 30, D.reaction);
      const score = forward * 0.12 + safety * 7 - Math.abs(q.z) * 0.02;
      if (score > bestScore) { bestScore = score; target = q; }
    }
    if (target) m.executePass(p, target, D.passErr * 0.65, true);
  }
}

// ---------------- 场上球员总调度 ----------------
function fieldAI(m: Match, p: Player, dt: number) {
  const b = m.ball;
  if (b.owner === p) { carrierAI(m, p); return; }

  const br = brainOf(p);
  const teamHasBall = b.owner ? b.owner.team === p.team : false;
  const looseBall = !b.owner;

  // 决策周期到 → 重新分配角色与跑位目标
  if (br.thinkCd <= 0) {
    br.thinkCd = diff(m, p.team).think * (0.8 + Math.random() * 0.4);
    if (teamHasBall) assignSupport(m, p, br);
    else if (looseBall) assignLoose(m, p, br);
    else assignDefense(m, p, br);
  }

  // 执行:追球类角色目标每帧刷新(球会动),跑位类沿用缓存目标
  switch (br.role) {
    case 'chase': {
      const intercept = estimateBallIntercept(b, p, diff(m, p.team).reaction, 2.8);
      moveTo(m, p, intercept.x, intercept.z, intercept.reachable ? 1 : 0.94);
      tryTackle(m, p, br);
      break;
    }
    case 'press': {
      const o = b.owner;
      if (o) {
        moveTo(m, p, o.x + o.vx * 0.15, o.z + o.vz * 0.15);
        tryTackle(m, p, br);
      } else br.thinkCd = 0;
      break;
    }
    case 'cut': {
      // 封堵持球者与我方球门之间的线路;若对方正在过人则预判落点抢先卡位
      const o = b.owner;
      if (o) {
        const gx = -m.attackDir(p.team) * C.FIELD_LENGTH / 2;
        if (o.state === 'dribble' && diff(m, p.team).predict > 0) {
          moveTo(m, p, o.x + o.dribbleDirX * 3, o.z + o.dribbleDirZ * 3);
        } else {
          moveTo(m, p, (o.x + gx) / 2, o.z * 0.6);
        }
      } else br.thinkCd = 0;
      break;
    }
    case 'mark': {
      const t = br.markTarget;
      if (t && t.state !== 'fallen') {
        if (diff(m, p.team).predict > 0) {
          // 封堵传球通道:站位在持球者→盯防对象连线中点
          const o = b.owner;
          if (o) { moveTo(m, p, (o.x + t.x) / 2, (o.z + t.z) / 2); break; }
        }
        const gx = -m.attackDir(p.team) * C.FIELD_LENGTH / 2;
        moveTo(m, p, t.x + Math.sign(gx - t.x) * 2, t.z);
      } else br.thinkCd = 0;
      break;
    }
    default:
      moveTo(m, p, br.tx, br.tz, br.role === 'home' ? 0.85 : 1);
      break;
  }
}

function tryTackle(m: Match, p: Player, br: Brain) {
  const b = m.ball;
  const o = b.owner;
  if (!o || o.team === p.team) return;
  const risingJump = (o.state === 'jump' || o.state === 'headbutt') && o.vy > 0;
  if (risingJump || o.y > C.SLIDE_EVADE_Y) return;
  const d = Math.hypot(p.x - o.x, p.z - o.z);
  // 预判过人起手:爆发前摇期内提高铲断概率并提前量
  const D = diff(m, p.team);
  const predict = D.predict;
  let chance = 0.48 + D.risk * 0.28;
  let triggerD = 3.0;
  if (predict > 0 && o.state === 'dribble' && o.stateT < C.DRIBBLE_BURST_END) {
    chance = 0.58 + predict * 0.28;
    triggerD = 3.6;
  }
  if (m.ruleset === 'classic') {
    const vx = p.x - o.x, vz = p.z - o.z;
    const len = Math.hypot(vx, vz) || 1;
    const fromBehind = vx / len * o.faceX + vz / len * o.faceZ < -0.25;
    if (fromBehind) chance *= 0.28 + (1 - D.predict) * 0.2;
  }
  if (d < triggerD && p.onGround && p.kickCd <= 0 && br.tackleCd <= 0 && Math.random() < chance) {
    br.tackleCd = D.tackleCd;
    p.face(o.x - p.x, o.z - p.z);
    m.doSlideTackle(p);
  }
}

// 按离球距离给本队 AI 排名(0=最近)
function chaseRank(m: Match, p: Player): number {
  const b = m.ball;
  const reaction = diff(m, p.team).reaction;
  const mine = estimateBallIntercept(b, p, reaction, 2.8);
  const myScore = mine.time + Math.max(0, mine.error) / Math.max(3, p.moveSpeed());
  let rank = 0;
  for (const q of m.teamPlayers(p.team)) {
    if (q === p || q.isKeeper || q.busy || isHumanControlled(m, q)) continue;
    const other = estimateBallIntercept(b, q, reaction, 2.8);
    const score = other.time + Math.max(0, other.error) / Math.max(3, q.moveSpeed());
    if (score < myScore - 0.01) rank++;
  }
  return rank;
}

// ---------- 进攻无球:接应跑位 ----------
function assignSupport(m: Match, p: Player, br: Brain) {
  const b = m.ball;
  const o = b.owner!;
  const dir = m.attackDir(p.team);
  const D = diff(m, p.team);
  const tactic = m.tactics[p.team];
  const rank = chaseRank(m, p);

  if (rank === 0 && Math.hypot(p.x - b.x, p.z - b.z) > 26) {
    // 离持球者太远的最近者也去靠拢
    br.role = 'support';
    br.tx = o.x - dir * 6; br.tz = o.z + (p.z > o.z ? 8 : -8);
    return;
  }

  br.role = 'support';
  // 基于阵型位向前推进,并在持球者周围形成三角接应
  const pushX = dir * (tactic === 'attack' ? 25 : tactic === 'defend' ? 10 : 18);
  let tx = p.homeX + pushX;
  let tz = p.homeZ;

  // 前插:比持球者更靠前的空间
  const aheadOfCarrier = (p.homeX - o.x) * dir > 0;
  if (aheadOfCarrier) {
    tx = o.x + dir * D.supportDist * (tactic === 'attack' ? 1.65 : tactic === 'defend' ? 1.05 : 1.4);
    tz = p.homeZ * 0.5 + o.z * 0.3 + (Math.random() - 0.5) * 8;
  } else {
    // 后场接应:斜后方
    tx = o.x - dir * D.supportDist * 0.7;
    tz = o.z + (p.homeZ > o.z ? D.supportDist : -D.supportDist) * 0.8;
  }

  // 与队友保持间距
  for (const q of m.teamPlayers(p.team)) {
    if (q === p || q.isKeeper) continue;
    const d = Math.hypot(q.x - tx, q.z - tz);
    if (d < 7) { tz += (tz > q.z ? 1 : -1) * (7 - d); }
  }

  const hx = C.FIELD_LENGTH / 2 - 3, hz = C.FIELD_WIDTH / 2 - 2;
  br.tx = Math.max(-hx, Math.min(hx, tx));
  br.tz = Math.max(-hz, Math.min(hz, tz));
}

// ---------- 自由球:就近争抢 ----------
function assignLoose(m: Match, p: Player, br: Brain) {
  const rank = chaseRank(m, p);
  if (rank <= 1) { br.role = 'chase'; return; }
  // 其余人预判落点方向站位
  const b = m.ball;
  br.role = 'support';
  br.tx = p.homeX * 0.5 + (b.x + b.vx * 0.5) * 0.5;
  br.tz = p.homeZ * 0.5 + (b.z + b.vz * 0.5) * 0.5;
}

// ---------- 防守:逼抢/封线/盯人 ----------
function assignDefense(m: Match, p: Player, br: Brain) {
  const b = m.ball;
  const o = b.owner!;
  const dir = m.attackDir(p.team);
  const rank = chaseRank(m, p);
  const tactic = m.tactics[p.team];

  if (rank === 0) { br.role = 'press'; return; }
  if (rank === 1 && tactic !== 'defend') { br.role = 'cut'; return; }

  // 其余:封堵最具威胁的传球通道,站在持球者→接应候选连线中点附近
  const opps = m.teamPlayers(1 - p.team).filter(q => !q.isKeeper && q !== o);
  let best: Player | null = null, bd = Infinity;
  for (const q of opps) {
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    const threatSide = (q.x - 0) * dir < 0 ? 0 : 12;
    const forward = (q.x - o.x) * dir;
    const channelBonus = forward > 0 ? -Math.min(8, forward * 0.3) : 0;
    if (d + threatSide + channelBonus < bd) { bd = d + threatSide + channelBonus; best = q; }
  }
  if (best && bd < 30) {
    br.role = 'mark';
    br.markTarget = best;
  } else {
    br.role = 'home';
    const gx = -dir * C.FIELD_LENGTH / 2;
    br.tx = (p.homeX + gx) / 2 * 0.8 + b.x * 0.2;
    br.tz = p.homeZ * 0.7 + b.z * 0.3;
  }
}

// ---------- 持球 AI ----------
function carrierAI(m: Match, p: Player) {
  const b = m.ball;
  const dir = m.attackDir(p.team);
  const goalX = dir * C.FIELD_LENGTH / 2;
  const dGoal = Math.abs(goalX - p.x);
  const D = diff(m, p.team);
  const br = brainOf(p);

  // 空中 + 能量满 → 必杀
  if (p.kickCd <= 0 && !p.onGround && p.y > 1.1 && m.energyFull(p.team)) {
    const def = SPECIALS[p.def.special];
    const dx = goalX - p.x, dz = -p.z * 0.5;
    const d = Math.hypot(dx, dz) || 1;
    m.energy[p.team] = 0;
    b.kick(dx / d * C.SPECIAL_SPEED * def.speed, C.SHOOT_LIFT * def.lift, dz / d * C.SPECIAL_SPEED * def.speed, p, def);
    m.lastSpecial = { def, t: 2.2 };
    p.setState('kick'); p.kickCd = 0.3;
    m.emit({ type: 'special', special: def, player: p, x: p.x, z: p.z });
    return;
  }

  let threat = Infinity;
  let threatP: Player | null = null;
  for (const q of m.teamPlayers(1 - p.team)) {
    if (q.busy) continue;
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < threat) { threat = d; threatP = q; }
  }

  const keeper = m.teamPlayers(1 - p.team)[0];
  const xg = expectedGoal(p, goalX, threat, keeper?.z ?? 0);
  const passTarget = m.findBestPassTarget(p, 0.9);
  let passSafety = 0;
  if (passTarget) {
    const distance = Math.hypot(passTarget.x - p.x, passTarget.z - p.z);
    const speed = C.PASS_SPEED * Math.min(1.25, 0.65 + distance / 30);
    passSafety = passLaneSafety(p, passTarget, m.teamPlayers(1 - p.team), speed, D.reaction);
  }

  // 效用决策:射门质量、线路安全、逼抢压力和战术风险偏好共同决定动作。
  if (br.thinkCd <= 0 && p.kickCd <= 0) {
    br.thinkCd = D.think * (0.72 + Math.random() * 0.45);
    if (dGoal < 32 && m.energyFull(p.team) && p.onGround && xg > 0.12) {
      p.vy = C.JUMP_VEL; p.setState('jump');
      m.emit({ type: 'jump', player: p });
      return;
    }

    const shootThreshold = 0.43 - D.risk * 0.2;
    if (xg >= shootThreshold || (xg > 0.16 && Math.random() < xg * (0.3 + D.risk * 0.52))) {
      aiShoot(m, p);
      return;
    }
    // 门将明显出击时才选择吊射，避免无意义远射。
    const keeperOffLine = keeper ? Math.abs(keeper.x - goalX) > 5.2 : false;
    if (dGoal < 38 && keeperOffLine && threat > 7 && Math.random() < 0.2 + D.predict * 0.18) {
      aiShoot(m, p, true);
      return;
    }

    if (passTarget && (threat < 6.2 || passSafety > 0.72)
        && passSafety > 0.26 + (1 - D.risk) * 0.18) {
      aiPass(m, p, passTarget);
      return;
    }

    const dribbleLevel = m.humans.includes(p.team) ? 1 : m.aiLevel;
    const dribbleChance = [0, 0.22, 0.42][dribbleLevel];
    if (threatP && threat >= 2.5 && threat < 5.5 && p.dribbleCd <= 0 && Math.random() < dribbleChance) {
      const awayX = p.x - threatP.x, awayZ = p.z - threatP.z;
      if (m.doDribble(p, dir * 0.55 + awayX, awayZ)) return;
    }
    // 被逼抢且首选线路一般时仍优先出球，而不是带球撞向防线。
    if (passTarget && threat < 5.5 && Math.random() < 0.58 + D.predict * 0.25) {
      aiPass(m, p, passTarget);
      return;
    }
    if (threat > 9 && p.onGround && p.dashCd <= 0 && p.stamina > C.STAMINA_DASH_COST
        && dGoal > 25 && Math.random() < 0.24 + D.risk * 0.2) {
      p.face(dir, 0);
      p.consumeStamina(C.STAMINA_DASH_COST);
      p.setState('dash'); p.dashT = C.DASH_TIME; p.dashCd = C.DASH_TIME + C.DASH_COOLDOWN;
      p.vx = p.faceX * C.DASH_SPEED * p.def.speed;
      p.vz = p.faceZ * C.DASH_SPEED * p.def.speed;
      return;
    }
  }

  // 带球推进:目标点=球门方向,侧向绕开逼抢者
  let tz = p.z * 0.82;
  if (threatP && threat < 7) {
    const away = p.z - threatP.z;
    tz = p.z + (away === 0 ? (Math.random() < 0.5 ? 1 : -1) : Math.sign(away)) * 7;
  }
  const hz = C.FIELD_WIDTH / 2 - 3;
  const advanceX = goalX * (m.tactics[p.team] === 'attack' ? 0.965 : m.tactics[p.team] === 'defend' ? 0.88 : 0.94);
  moveTo(m, p, advanceX, Math.max(-hz, Math.min(hz, tz)));
}

function aiShoot(m: Match, p: Player, lob = false) {
  if (p.kickCd > 0 || m.ball.owner !== p) return;
  const D = diff(m, p.team);
  const gx = m.attackDir(p.team) * C.FIELD_LENGTH / 2;
  const keeper = m.teamPlayers(1 - p.team)[0];
  const tz = chooseGoalTarget(p.z, keeper?.z ?? 0, D.shootErr);
  const dx = gx - p.x, dz = tz - p.z;
  const d = Math.hypot(dx, dz) || 1;
  const sp = C.SHOOT_SPEED * p.def.power;
  // 近距离压低球路；远距离/吊射根据飞行距离给出可达门框的抛物线。
  const lift = lob
    ? 10.5 + Math.random() * 1.5
    : Math.max(3.2, Math.min(7.8, 3.1 + d * 0.105 + (Math.random() - 0.5) * D.shootErr * 0.18));
  const swerve = Math.max(-7, Math.min(7, (tz - (keeper?.z ?? 0)) * 0.7));
  m.ball.kick(dx / d * sp, lift, dz / d * sp, p, null, swerve);
  p.setState('kick'); p.kickCd = 0.3;
  m.emit({ type: 'shoot', player: p });
}

function aiPass(m: Match, p: Player, preferred: Player | null = null) {
  if (p.kickCd > 0 || m.ball.owner !== p) return;
  const D = diff(m, p.team);
  const dir = m.attackDir(p.team);
  const mates = m.teamPlayers(p.team).filter(q => q !== p && q.state !== 'fallen'
    && !(m.ruleset === 'classic' && m.isOffsideTarget(p.team, q)));
  let best: Player | null = null, bs = -Infinity;
  for (const q of mates) {
    const forward = (q.x - p.x) * dir;
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d < 5 || d > 48) continue;
    const speed = C.PASS_SPEED * Math.min(1.25, 0.65 + d / 30);
    const safety = passLaneSafety(p, q, m.teamPlayers(1 - p.team), speed, D.reaction);
    let score = m.passTargetScore(p, q, 0.75) + safety * 4 + forward * 0.025;
    if (q === preferred) score += 1.6;
    if (isHumanControlled(m, q)) score += 12;
    if (score > bs) { bs = score; best = q; }
  }
  if (!best) { aiShoot(m, p); return; }
  const forward = (best.x - p.x) * dir;
  const through = forward > 11 && m.tactics[p.team] !== 'defend' && D.predict > 0.45;
  m.executePass(p, best, D.passErr, through);
}
