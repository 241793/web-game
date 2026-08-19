// 无头点球大战测试:强制平局进入点球,AI 互射直到分出胜负
import { Match } from '../src/game/match';
import { TEAMS } from '../src/core/teams';

const m = new Match(TEAMS[0], TEAMS[1]);
m.humanTeam = -1;
m.humans = [];
m.aiLevel = 1;
m.goldenGoal = true;
m.startShootout();

const dt = 1 / 60;
let frames = 0;
const max = 60 * 180;
while (m.phase !== 'fulltime' && frames < max) {
  frames++;
  m.update(dt, [null, null]);
  m.events.length = 0;
  if (Number.isNaN(m.ball.x + m.ball.z)) { console.error('NaN at', frames); process.exit(1); }
}
const so = m.shootout!;
console.log('点球比分:', so.scores.join('-'), ' 轮次:', so.attempts.join('/'),
  ' 胜者:', m.shootoutWinner, ' 帧:', frames);
const regulationStayedTied = m.score[0] === 0 && m.score[1] === 0;
const winnerMatches = m.winner() === m.shootoutWinner;
const ok = m.phase === 'fulltime' && m.shootoutWinner >= 0 && so.attempts[0] >= 3
  && regulationStayedTied && winnerMatches;
console.log('正式比分:', m.score.join('-'), ' 胜者判定:', m.winner());
console.log(ok ? 'SHOOTOUT-OK' : 'SHOOTOUT-FAIL');
process.exit(ok ? 0 : 2);
