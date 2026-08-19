import * as C from '../src/core/constants';
import { SPECIALS } from '../src/core/specials';
import { TEAMS, teamById } from '../src/core/teams';
import { Ball } from '../src/game/ball';
import { Match } from '../src/game/match';
import { Player } from '../src/game/player';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function near(a: number, b: number, tolerance: number, message: string) {
  assert(Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`);
}

function makeMatch() {
  const m = new Match(TEAMS[0], TEAMS[1]);
  m.phase = 'play';
  m.phaseT = 0;
  m.training = true;
  m.wind.x = 0; m.wind.z = 0;
  return m;
}

function testOwnedBallGoalAndBoundaryOrder() {
  const m = makeMatch();
  const owner = m.teamPlayers(0)[3];
  owner.x = C.FIELD_LENGTH / 2 + 0.2;
  owner.z = 0;
  owner.face(1, 0);
  m.ball.owner = owner;
  m.ball.lastTeam = owner.team;

  m.update(1 / 60, [null, null]);

  assert(m.score[0] === 1, '持球越过对方门线应判 0 队进球');
  assert(m.phase === 'goal', '持球进球后阶段应为 goal');
  assert(m.ball.owner === null, '越界判定前应先释放持球者');
}

function testEndsSwap() {
  const m = makeMatch();
  m.training = false; // 需要真实计时触发中场
  assert(m.attackDir(0) === 1 && m.attackDir(1) === -1, '上半场初始进攻方向错误');
  m.time = C.HALF_TIME - 0.01;
  m.update(0.02, [null, null]);
  assert(m.half === 2 && m.endsSwapped, '上半场结束后应标记换边');
  assert(m.attackDir(0) === -1 && m.attackDir(1) === 1, '下半场进攻方向未反转');
  m.update(2.21, [null, null]);
  assert(m.phase === 'kickoff', '中场结束后应重新开球');
  assert(m.teamPlayers(0)[0].homeX > 0, '换边后的阵型基准位应反转');
}

function decayBall(dt: number, seconds: number, airborne: boolean) {
  const b = new Ball();
  b.x = 0; b.z = 0; b.y = airborne ? 20 : C.BALL_RADIUS;
  b.vx = 30; b.vy = airborne ? 0 : -1; b.vz = 0; // 地面用例:微向下速,每帧反弹归零,保持贴地滚动区
  for (let t = 0; t < seconds - 1e-9; t += dt) b.update(dt, 0, 0);
  return b.vx;
}

function decayPlayer(dt: number, state: 'slide' | 'fallen') {
  const p = new Player(0, 1, TEAMS[0].players[1]);
  p.setState(state);
  p.vx = 15;
  if (state === 'fallen') { p.y = 5; p.vy = 0; }
  for (let t = 0; t < 0.5 - 1e-9; t += dt) p.update(dt);
  return p.vx;
}

function testFrameRateDecay() {
  near(decayBall(1 / 30, 0.5, false), decayBall(1 / 120, 0.5, false), 1e-8,
    '地面球衰减应与帧率无关');
  near(decayBall(1 / 30, 0.5, true), decayBall(1 / 120, 0.5, true), 1e-8,
    '空中球衰减应与帧率无关');
  near(decayPlayer(1 / 30, 'slide'), decayPlayer(1 / 120, 'slide'), 1e-8,
    '铲球滑行衰减应与帧率无关');
  near(decayPlayer(1 / 30, 'fallen'), decayPlayer(1 / 120, 'fallen'), 1e-8,
    '倒地滑行衰减应与帧率无关');
}

function testActionCooldowns() {
  const m = makeMatch();
  const p = m.teamPlayers(0)[3];
  p.x = 0; p.z = 0; p.face(1, 0);
  m.ball.owner = p;
  m.doShoot(p, { dirX: 0, dirZ: 0 } as any);
  const firstFlight = m.ball.flightId;
  m.ball.owner = p; // 模拟冷却期间球又回到脚下
  m.doShoot(p, { dirX: 0, dirZ: 0 } as any);
  assert(m.ball.flightId === firstFlight, '出脚冷却期间不应再次射门');
  p.update(0.31);
  m.doShoot(p, { dirX: 0, dirZ: 0 } as any);
  assert(m.ball.flightId === firstFlight + 1, '出脚冷却结束后应允许射门');

  const tackler = m.teamPlayers(1)[2];
  tackler.setState('idle'); tackler.kickCd = 0; tackler.y = 0;
  m.doSlideTackle(tackler);
  const attempts = m.stats[1].tackleAttempts;
  m.doSlideTackle(tackler);
  assert(m.stats[1].tackleAttempts === attempts, '铲球冷却期间不应重复记录尝试');
}

function testSpecialSweepAndSingleHit() {
  const m = makeMatch();
  const shooter = m.teamPlayers(0)[3];
  const victim = m.teamPlayers(1)[2];
  for (const p of m.players) { p.x = -40; p.z = 20 + p.index * 3; }
  shooter.x = 0; shooter.z = 0;
  victim.x = 5; victim.z = 0; victim.y = 0; victim.setState('idle');
  m.ball.reset(0, 0);
  m.ball.kick(600, 0, 0, shooter, SPECIALS.blast); // flightId 锚定本次必杀
  m.emit({ type: 'special', player: shooter, special: SPECIALS.blast });
  m.events.length = 0;

  // 高速必杀球单帧跨过受害者,验证线段扫掠而非逐点拾球
  m.ball.prevX = 0; m.ball.prevY = C.BALL_RADIUS; m.ball.prevZ = 0;
  m.ball.x = 15; m.ball.y = C.BALL_RADIUS; m.ball.z = 0;
  m.ballSpecialHits();
  const hits1 = m.events.filter(e => e.type === 'knockdown' && e.player === victim).length;
  assert(hits1 === 1 && victim.state === 'fallen', '必杀应扫掠命中单帧跨过的球员');

  // 同一次飞行再次延伸弹道,不应重复命中同一球员
  m.ball.prevX = 15; m.ball.x = 30;
  m.ballSpecialHits();
  const hits2 = m.events.filter(e => e.type === 'knockdown' && e.player === victim).length;
  assert(hits2 === 1, '同一次必杀飞行对同一球员只能命中一次');
}

function testHalftimeResetsBall() {
  const m = makeMatch();
  m.training = false;
  // 半场结束瞬间球正在场外高速飞行
  m.ball.x = -100; m.ball.z = 0; m.ball.vx = -50;
  m.time = C.HALF_TIME - 0.01;
  m.update(0.02, [null, null]);
  assert(m.phase === 'halftime', '应进入中场');
  assert(Math.abs(m.ball.x) <= 1 && Math.abs(m.ball.z) <= 1, '中场时应把飞行中的球归中圈');
}

function testGoalCountsOneOnTarget() {
  const m = makeMatch();
  m.stats[0].onTarget = 0;
  m.ball.reset(C.FIELD_LENGTH / 2 + 0.2, 0);
  m.ball.y = 1;
  (m as any).shotFlight = { id: m.ball.flightId, team: 0, onTarget: false };
  m.checkBounds();
  assert(m.score[0] === 1, '直接入网应判 0 队进球');
  assert(m.stats[0].onTarget === 1, '直接入网只计一次射正');
}

function testNonPlayClamp() {
  const m = makeMatch();
  m.phase = 'goal'; m.phaseT = 0;
  m.ball.x = -120; m.ball.z = 0; m.ball.vx = -50;
  m.ball.special = SPECIALS.blast;
  m.update(1 / 60, [null, null]);
  assert(Math.abs(m.ball.x) <= C.FIELD_LENGTH / 2, '中停阶段球应被钳制回场内');
  assert(m.ball.special === null, '钳制时应解除必杀状态');
}

function testControlledPlayerStaysFixed() {
  const m = makeMatch();
  const controlled = m.getControlled(0);
  assert(controlled.index === 3, '默认应固定控制 3 号中场核心');

  m.ball.owner = m.teamPlayers(0)[5];
  m.update(1 / 60, [null, null]);
  assert(m.getControlled(0) === controlled, '队友持球时不应切换受控球员');

  m.ball.owner = null;
  m.ball.x = C.FIELD_LENGTH / 2; m.ball.z = C.FIELD_WIDTH / 2;
  controlled.setState('fallen');
  m.update(1 / 60, [null, null]);
  assert(m.getControlled(0) === controlled, '球远离或固定球员倒地时也不应切换');

  m.controlledIdx[0] = 0;
  m.update(1 / 60, [null, null]);
  assert(m.getControlled(0).isKeeper, '门将模式设置后应持续固定控制门将');
}

function testTrainingStartsWithControlledPlayer() {
  const m = makeMatch();
  m.trainingDrill = 'special';
  m.setupTrainingDrill();
  const controlled = m.getControlled(0);
  assert(controlled.index === 3, '训练开局默认应控制中场核心');
  assert(m.ball.owner === controlled, '训练开局球权应交给当前受控球员');
  m.trainingReset();
  assert(m.getControlled(0) === controlled && m.ball.owner === controlled,
    '训练重置后仍应保持同一固定球员和球权');
}

function testBusyPlayerCannotPickup() {
  const m = makeMatch();
  for (const p of m.players) { p.x = 20; p.z = 20; }
  const busy = m.teamPlayers(0)[2];
  const ready = m.teamPlayers(1)[2];
  busy.x = ready.x = 0; busy.z = ready.z = 0;
  busy.setState('slide'); ready.setState('idle');
  m.ball.reset(0, 0);
  m.ballPickup();
  assert(m.ball.owner === ready, '铲球等忙碌状态中的球员不应吸球');
}

function testPickupTieAlternatesTeams() {
  const m = makeMatch();
  for (const p of m.players) { p.x = 20; p.z = 20; p.setState('idle'); }
  const a = m.teamPlayers(0)[2], b = m.teamPlayers(1)[2];
  a.x = -1; a.z = 0; b.x = 1; b.z = 0;
  m.ball.reset(0, 0);
  m.ballPickup();
  const firstTeam = m.ball.owner?.team;
  m.ball.reset(0, 0);
  m.ballPickup();
  assert(firstTeam === 0 && m.ball.owner?.team === 1, '同距争球应轮换优先队伍而非永久偏向 0 队');
}

function testHighLooseBallCannotBeKicked() {
  const m = makeMatch();
  const p = m.teamPlayers(0)[3];
  p.x = 0; p.z = 0; p.y = 0; p.kickCd = 0;
  m.ball.reset(0, 0);
  m.ball.y = 6;
  const flight = m.ball.flightId;
  m.tryKickLooseBall(p);
  assert(m.ball.flightId === flight, '地面球员不应隔空踢到数米高的球');
}

function testOwnGoalCreditsShooterOnTarget() {
  const m = makeMatch();
  m.stats[0].onTarget = 0; m.stats[1].onTarget = 0;
  m.ball.reset(-C.FIELD_LENGTH / 2 - 0.2, 0);
  m.ball.y = 1;
  (m as any).shotFlight = { id: m.ball.flightId, team: 0, onTarget: false };
  m.checkBounds();
  assert(m.score[1] === 1, '进入 1 队进攻方向的球门应判 1 队得分');
  assert(m.stats[0].onTarget === 1 && m.stats[1].onTarget === 0,
    '乌龙或折射入网的射正应归原射门球队');
}

function testShootoutWinnerKeepsRegulationScore() {
  const m = makeMatch();
  m.score[0] = m.score[1] = 0;
  m.shootoutWinner = 1;
  assert(m.winner() === 1, '正式比分平局时应使用点球胜者');
  assert(m.score[0] === 0 && m.score[1] === 0, '点球胜者不应污染正式比分');
}

function setContact(attacker: Player, victim: Player) {
  for (const p of [attacker, victim]) { p.x = 0; p.z = 0; p.vx = p.vz = 0; }
  victim.x = C.PLAYER_RADIUS;
}

function testJumpEvadesSlide() {
  const m = makeMatch();
  const slider = m.teamPlayers(1)[2];
  const jumper = m.teamPlayers(0)[3];
  setContact(slider, jumper);
  slider.setState('slide');
  jumper.setState('jump'); jumper.y = 0; jumper.vy = C.JUMP_VEL;
  m.ball.owner = jumper;
  const x = jumper.x, z = jumper.z;
  const random = Math.random;
  Math.random = () => 0;
  try { m.playerCollisions(); } finally { Math.random = random; }
  assert(jumper.state === 'jump' && m.ball.owner === jumper, '上升跳跃应完全躲过滑铲并保持球权');
  near(jumper.x, x, 1e-9, '滑铲穿过跳跃者时不应横向推开 X');
  near(jumper.z, z, 1e-9, '滑铲穿过跳跃者时不应横向推开 Z');

  jumper.y = C.SLIDE_EVADE_Y * 0.5; jumper.vy = -1; jumper.setState('jump');
  slider.setState('slide'); setContact(slider, jumper); m.ball.owner = jumper;
  Math.random = () => 0;
  try { m.playerCollisions(); } finally { Math.random = random; }
  assert(jumper.state === 'fallen' && m.ball.owner === null, '下降至近地面后应恢复可被滑铲');
}

function testDashAirHeightLimit() {
  const m = makeMatch();
  const dasher = m.teamPlayers(1)[2];
  const jumper = m.teamPlayers(0)[3];
  const random = Math.random;
  Math.random = () => 0;
  try {
    setContact(dasher, jumper); dasher.setState('dash'); jumper.setState('jump'); jumper.y = 1; dasher.y = 0;
    m.resolveContact(dasher, jumper, 1, 0);
    assert(jumper.state === 'fallen', '合理身体高差内肩撞仍应命中跳跃者');

    setContact(dasher, jumper); dasher.setState('dash'); jumper.setState('jump'); jumper.y = C.DASH_HIT_MAX_DY + 0.2;
    m.resolveContact(dasher, jumper, 1, 0);
    assert(jumper.state === 'jump', '身体高差过大时肩撞不应击倒跳跃者');
  } finally { Math.random = random; }
}

function dribbleDistance(dt: number) {
  const p = new Player(0, 3, TEAMS[0].players[3]);
  p.dribbleDirX = 1; p.dribbleDirZ = 0; p.setState('dribble');
  for (let t = 0; t < C.DRIBBLE_TIME; t += dt) p.update(Math.min(dt, C.DRIBBLE_TIME - t));
  return p.x;
}

function testDribbleAction() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = p.z = 0; p.y = 0; p.setState('idle'); p.dribbleCd = 0;
  m.ball.owner = p;
  m.energy[0] = 57;
  assert(m.doDribble(p, 1, 0), '持球落地时应能触发过人');
  assert(p.state === 'dribble' && p.dribbleCd > C.DRIBBLE_COOLDOWN, '过人应进入动作状态并设置冷却');
  assert(m.energy[0] === 57 && m.getControlled(0) === p, '过人不应消耗必杀能量或切换球员');
  const firstCd = p.dribbleCd;
  assert(!m.doDribble(p, 0, 1) && p.dribbleCd === firstCd, '动作或冷却期间不可重复过人');
  near(dribbleDistance(1 / 30), dribbleDistance(1 / 120), 0.12, '过人位移应基本与帧率无关');
  const distance = dribbleDistance(1 / 60);
  assert(distance > 2.5 && distance < 4, `过人位移应约为 3 米，实际 ${distance.toFixed(2)}`);

  const slider = m.teamPlayers(1)[2];
  p.setState('dribble'); p.y = 0; p.dribbleDirX = 1; p.dribbleDirZ = 0;
  m.ball.owner = p; setContact(slider, p); slider.setState('slide');
  const random = Math.random; Math.random = () => 0;
  try { m.playerCollisions(); } finally { Math.random = random; }
  assert(p.state === 'fallen' && m.ball.owner === null, '过人没有无敌帧，被滑铲命中应正常掉球');
}

function testDribbleFeedbackEvents() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.dribbleCd = 0;
  m.ball.owner = p;
  // 起手时无近敌(threat=Infinity),过人后仍持球 → 不判成功(距离未拉大)
  m.doDribble(p, 1, 0);
  const slider = m.teamPlayers(1)[2];
  slider.x = 10; slider.z = 0; slider.setState('idle');
  for (let i = 0; i < Math.ceil(C.DRIBBLE_TIME / (1 / 60)) + 2; i++) m.update(1 / 60, [null, null]);
  assert(!m.events.some(e => e.type === 'dribbleWin'), '无防守者拉近距离时不应判过人成功');

  // 成功:起手近敌贴近,过人后拉开(其余对手移远避免干扰)
  m.events.length = 0;
  p.x = 0; p.z = 0; p.setState('idle'); p.dribbleCd = 0; m.ball.owner = p;
  for (const q of m.teamPlayers(1)) { if (q !== slider) { q.x = 80; q.z = 80; } }
  slider.x = -2; slider.z = 0; slider.setState('idle');
  m.doDribble(p, 1, 0);
  for (let i = 0; i < Math.ceil(C.DRIBBLE_TIME / (1 / 60)) + 2; i++) m.update(1 / 60, [null, null]);
  assert(m.events.some(e => e.type === 'dribbleWin'), '过人拉开与防守者距离应触发 dribbleWin');

  // 失败:过人中被铲断
  m.events.length = 0;
  p.x = 0; p.z = 0; p.setState('idle'); p.dribbleCd = 0; m.ball.owner = p;
  slider.x = C.PLAYER_RADIUS; slider.z = 0; slider.setState('idle');
  m.doDribble(p, 1, 0);
  slider.setState('slide');
  const random = Math.random; Math.random = () => 0;
  try { m.playerCollisions(); } finally { Math.random = random; }
  assert(m.events.some(e => e.type === 'dribbleFail'), '过人被铲断应触发 dribbleFail');
}

function testFakeShotAndChargedShot() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;
  const inp = { dirX: 0, dirZ: 0, pass: false, shoot: true, dash: false, jump: false, skill: false,
    passPressed: false, shootPressed: false, dashPressed: false, jumpPressed: false, skillPressed: false } as any;
  // 轻点(<阈值)松开 → 假射:球未被踢出
  p.shootChargeT = -1;
  m.applyInput(p, inp, 1 / 60);
  assert(p.shootChargeT >= 0, '按住射门应进入蓄力');
  inp.shoot = false;
  m.applyInput(p, inp, C.FAKE_SHOT_TAP * 0.5);
  assert(p.fakeShotT > 0 && m.ball.owner === p, '轻点松开应为假射且保持球权');
  assert(m.events.some(e => e.type === 'fakeShot'), '假射应触发 fakeShot 事件');

  // 蓄力足够久松开 → 真射:球被踢出
  m.events.length = 0;
  p.setState('idle'); p.kickCd = 0; p.fakeShotT = 0; m.ball.owner = p; p.shootChargeT = -1;
  inp.shoot = true;
  // 持续按住蓄力数帧,累积超过轻点阈值
  for (let i = 0; i < 12; i++) m.applyInput(p, inp, 1 / 60);
  inp.shoot = false;
  m.applyInput(p, inp, 1 / 60);
  assert(m.ball.owner === null && m.events.some(e => e.type === 'shoot'), '蓄力足够松开应真射并踢出球');
}

function testShaolinTeamAndSpecials() {
  const sl = teamById('sl');
  assert(sl.name === '少林铁僧', '少林队应可按 id 查询');
  assert(sl.players.length === C.TEAM_SIZE, '少林队应有完整 6 人阵容');
  const strength = sl.players.reduce((s, pl) => s + pl.speed + pl.power + pl.toughness, 0);
  assert(strength >= 17.5 && strength <= 20, `少林队实力应落在平衡区间,实际 ${strength.toFixed(2)}`);
  assert(SPECIALS.luohan && SPECIALS.luohan.fxStyle === 'fist', '罗汉伏虎必杀应存在且为 fist 风格');
  assert(SPECIALS.sweep && SPECIALS.sweep.ground === true, '扫堂腿必杀应存在且为贴地弹道');
  assert(sl.players.some(pl => pl.special === 'luohan'), '少林队应有球员使用罗汉伏虎');
}

const tests: [string, () => void][] = [
  ['持球越界进球与更新顺序', testOwnedBallGoalAndBoundaryOrder],
  ['半场换边', testEndsSwap],
  ['帧率无关衰减', testFrameRateDecay],
  ['动作冷却', testActionCooldowns],
  ['必杀线段扫掠与单次命中', testSpecialSweepAndSingleHit],
  ['中场飞行球归中', testHalftimeResetsBall],
  ['进球只计一次射正', testGoalCountsOneOnTarget],
  ['非比赛阶段球位钳制', testNonPlayClamp],
  ['固定受控球员', testControlledPlayerStaysFixed],
  ['训练初始受控球员', testTrainingStartsWithControlledPlayer],
  ['忙碌球员不能拾球', testBusyPlayerCannotPickup],
  ['同距争球轮换优先队伍', testPickupTieAlternatesTeams],
  ['过高自由球不能凌空踢', testHighLooseBallCannotBeKicked],
  ['乌龙射正归原射门球队', testOwnGoalCreditsShooterOnTarget],
  ['点球胜者不污染正式比分', testShootoutWinnerKeepsRegulationScore],
  ['跳跃躲避滑铲', testJumpEvadesSlide],
  ['肩撞空中高度边界', testDashAirHeightLimit],
  ['变向过人动作', testDribbleAction],
  ['过人成功/失败反馈', testDribbleFeedbackEvents],
  ['假射与蓄力射门', testFakeShotAndChargedShot],
  ['少林队与新必杀', testShaolinTeamAndSpecials],
];

for (const [name, test] of tests) {
  test();
  console.log(`PASS ${name}`);
}
console.log(`CORE-OK (${tests.length})`);
