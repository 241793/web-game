// 无头模拟:多场 AI vs AI 全流程 + 多帧率,验证核心逻辑稳定(终场/无NaN/球不出界/有效对抗)
import { Match } from '../src/game/match';
import { updateAI } from '../src/game/ai';
import { TEAMS } from '../src/core/teams';

(globalThis as any).requestAnimationFrame = (cb: () => void) => setTimeout(cb, 16);

interface RunStats {
  goals: number; specials: number; tackles: number; saves: number;
  passes: number; shoots: number; onTarget: number; jumps: number; fouls: number;
}
const zero = (): RunStats => ({ goals: 0, specials: 0, tackles: 0, saves: 0, passes: 0, shoots: 0, onTarget: 0, jumps: 0, fouls: 0 });

function playOne(dt: number): { stats: RunStats; score: [number, number]; finished: boolean; maxAbsBallX: number } {
  const m = new Match(TEAMS[0], TEAMS[1]);
  m.humanTeam = -1; // 全 AI
  const stats = zero();
  let maxAbsBallX = 0;
  const maxFrames = Math.ceil((6 * 60) / dt); // 6 分钟真实时间按帧率换算
  let frames = 0;

  while (frames < maxFrames && m.phase !== 'fulltime') {
    frames++;
    updateAI(m, dt);
    m.update(dt, [null, null]);
    for (const e of m.events) {
      if (e.type === 'goal') stats.goals++;
      if (e.type === 'special') stats.specials++;
      if (e.type === 'tackle') stats.tackles++;
      if (e.type === 'save') stats.saves++;
      if (e.type === 'pass') stats.passes++;
      if (e.type === 'shoot' || e.type === 'special') stats.shoots++;
      if (e.type === 'jump') stats.jumps++;
    }
    stats.onTarget = m.stats[0].onTarget + m.stats[1].onTarget;
    maxAbsBallX = Math.max(maxAbsBallX, Math.abs(m.ball.x), Math.abs(m.ball.z));
    m.events.length = 0;

    if (Number.isNaN(m.ball.x + m.ball.y + m.ball.z)) throw new Error(`BALL NaN at frame ${frames}`);
    for (const p of m.players) {
      if (Number.isNaN(p.x + p.z + p.y)) throw new Error(`PLAYER NaN ${p.team}:${p.index} at frame ${frames}`);
    }
  }
  return { stats, score: [m.score[0], m.score[1]], finished: m.phase === 'fulltime', maxAbsBallX };
}

const runs: [string, number, number][] = [
  ['60fps x3', 1 / 60, 3],
  ['120fps x1', 1 / 120, 1],
];

const all: RunStats[] = [];
let totalGoals = 0;
for (const [label, dt, n] of runs) {
  let shots = 0, passes = 0;
  for (let i = 0; i < n; i++) {
    const r = playOne(dt);
    if (!r.finished) throw new Error(`${label} 未能在时限内完赛`);
    if (r.maxAbsBallX > 130) throw new Error(`${label} 球飞出球场范围: ${r.maxAbsBallX.toFixed(1)}`);
    all.push(r.stats);
    totalGoals += r.stats.goals;
    shots += r.stats.shoots; passes += r.stats.passes;
  }
  console.log(`${label}: 完成 ${n} 场, 场均射门 ${(shots / n).toFixed(1)}, 场均传球 ${(passes / n).toFixed(1)}`);
}

const sum = all.reduce((a, b) => ({
  goals: a.goals + b.goals, specials: a.specials + b.specials, tackles: a.tackles + b.tackles,
  saves: a.saves + b.saves, passes: a.passes + b.passes, shoots: a.shoots + b.shoots,
  onTarget: a.onTarget + b.onTarget, jumps: a.jumps + b.jumps, fouls: a.fouls + b.fouls,
}), zero());

console.log('=== 汇总 ===');
console.log(`场次: ${all.length}  进球: ${totalGoals}  必杀: ${sum.specials}  射门: ${sum.shoots} (射正 ${sum.onTarget})`);
console.log(`传球: ${sum.passes}  铲球: ${sum.tackles}  扑救: ${sum.saves}  跳跃: ${sum.jumps}`);

const ok = all.length >= 4
  && sum.shoots >= 10
  && sum.passes >= 20
  && sum.tackles >= 3;
console.log(ok ? 'SIM-OK' : 'SIM-INCOMPLETE');
process.exit(ok ? 0 : 2);
