import * as C from '../core/constants';
import { Ball } from './ball';
import { Player } from './player';

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export interface InterceptPrediction {
  x: number;
  z: number;
  time: number;
  reachable: boolean;
  error: number;
}

/**
 * 预测普通球在未来的平面位置。这里刻意使用与 Ball 相同的指数衰减，
 * 让 AI 的判断与真实模拟一致，而不是简单追逐球的当前位置。
 */
export function predictBallPosition(ball: Ball, seconds: number, friction = C.BALL_AIR_DRAG) {
  const decayPerSecond = Math.pow(friction, 60);
  let factor: number;
  if (Math.abs(decayPerSecond - 1) < 1e-6) factor = seconds;
  else factor = (Math.pow(decayPerSecond, seconds) - 1) / Math.log(decayPerSecond);

  const speed = Math.hypot(ball.vx, ball.vz) || 1;
  const sideX = -ball.vz / speed;
  const sideZ = ball.vx / speed;
  const curveDistance = ball.swerve * seconds * seconds * 0.32;
  return {
    x: ball.x + ball.vx * factor + sideX * curveDistance,
    z: ball.z + ball.vz * factor + sideZ * curveDistance,
  };
}

/** 按球员速度与反应延迟寻找最早可达拦截点。 */
export function estimateBallIntercept(
  ball: Ball,
  player: Player,
  reaction = 0.2,
  maxTime = 2.8,
): InterceptPrediction {
  if (ball.owner) {
    return {
      x: ball.owner.x,
      z: ball.owner.z,
      time: 0,
      reachable: ball.owner === player,
      error: Math.hypot(player.x - ball.owner.x, player.z - ball.owner.z),
    };
  }

  const step = 0.08;
  const playerSpeed = Math.max(2, player.moveSpeed());
  let best = { x: ball.x, z: ball.z, time: maxTime, reachable: false, error: Infinity };
  for (let t = step; t <= maxTime + 1e-6; t += step) {
    const point = predictBallPosition(ball, t, ball.y <= C.BALL_RADIUS + 0.05 ? C.BALL_FRICTION : C.BALL_AIR_DRAG);
    const distance = Math.hypot(point.x - player.x, point.z - player.z);
    const available = Math.max(0, t - reaction) * playerSpeed + C.PLAYER_RADIUS;
    const error = distance - available;
    if (error < best.error) best = { ...point, time: t, reachable: error <= 0, error };
    if (error <= 0) return { ...point, time: t, reachable: true, error };
  }
  return best;
}

function pointSegmentProjection(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number,
) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  const u = clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1);
  const qx = ax + dx * u, qz = az + dz * u;
  return { u, distance: Math.hypot(px - qx, pz - qz) };
}

/**
 * 传球线路安全度（0=极易被截，1=完全开放）。
 * 防守者会按球到达线路投影点所需的时间移动，因此比静态“离线距离”更准确。
 */
export function passLaneSafety(
  from: { x: number; z: number },
  to: { x: number; z: number },
  defenders: readonly Player[],
  ballSpeed: number,
  reaction = 0.2,
) {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  if (length < 0.1) return 0;
  let safety = 1;
  for (const defender of defenders) {
    if (defender.state === 'fallen' || defender.stunned > 0) continue;
    const initial = pointSegmentProjection(defender.x, defender.z, from.x, from.z, to.x, to.z);
    if (initial.u < 0.06 || initial.u > 1.03) continue;
    const ballTime = length * initial.u / Math.max(8, ballSpeed);
    const lead = Math.min(0.55, ballTime);
    const px = defender.x + defender.vx * lead;
    const pz = defender.z + defender.vz * lead;
    const projected = pointSegmentProjection(px, pz, from.x, from.z, to.x, to.z);
    const moveReach = Math.max(0, ballTime - reaction) * defender.moveSpeed();
    const controlReach = C.PLAYER_RADIUS + 0.9;
    const margin = projected.distance - (moveReach + controlReach);
    const danger = clamp((2.4 - margin) / 4.8, 0, 1);
    safety *= 1 - danger * 0.82;
  }
  return clamp(safety, 0, 1);
}

/** 基于距离、射门角度、逼抢和门将站位估算射门质量。 */
export function expectedGoal(
  shooter: { x: number; z: number },
  goalX: number,
  pressureDistance: number,
  keeperZ: number,
) {
  const distance = Math.hypot(goalX - shooter.x, shooter.z);
  const angleWidth = Math.atan2(C.GOAL_WIDTH / 2 - shooter.z, Math.abs(goalX - shooter.x))
    - Math.atan2(-C.GOAL_WIDTH / 2 - shooter.z, Math.abs(goalX - shooter.x));
  const angleQuality = clamp(Math.abs(angleWidth) / 0.55, 0.15, 1);
  const distanceQuality = 1 / (1 + Math.exp((distance - 23) / 5.5));
  const pressure = clamp((pressureDistance - 1.5) / 6, 0.42, 1);
  const keeperExposure = clamp(Math.abs(keeperZ - shooter.z * 0.12) / (C.GOAL_WIDTH / 2), 0.65, 1.08);
  return clamp(distanceQuality * angleQuality * pressure * keeperExposure, 0.02, 0.88);
}

/** 选择远离门将的一侧，同时保留少量与难度相关的落点误差。 */
export function chooseGoalTarget(
  shooterZ: number,
  keeperZ: number,
  error: number,
  random = Math.random,
) {
  const half = C.GOAL_WIDTH / 2 - C.BALL_RADIUS - 0.28;
  const farSide = keeperZ >= 0 ? -1 : 1;
  const nearPostBias = shooterZ > C.GOAL_WIDTH / 2 ? -1 : shooterZ < -C.GOAL_WIDTH / 2 ? 1 : farSide;
  const ideal = nearPostBias * half * (0.68 + random() * 0.22);
  return clamp(ideal + (random() - 0.5) * error, -half, half);
}

/** 传球出脚瞬间的简化越位位置判断。 */
export function isOffsidePosition(
  team: number,
  target: { x: number },
  ballX: number,
  defenders: readonly Player[],
  attackDir: number,
) {
  void team;
  const targetProgress = target.x * attackDir;
  if (targetProgress <= 0) return false; // 未进入对方半场
  const projections = defenders
    .filter(p => p.state !== 'fallen')
    .map(p => p.x * attackDir)
    .sort((a, b) => b - a);
  if (projections.length < 2) return false;
  const secondLast = projections[1];
  return targetProgress > Math.max(ballX * attackDir, secondLast) + 0.35;
}