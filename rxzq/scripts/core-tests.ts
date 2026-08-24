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

const emptyInp = (over: Record<string, unknown> = {}) =>
  ({ dirX: 0, dirZ: 0, pass: false, shoot: false, dash: false, jump: false, skill: false,
    tactic: false, passPressed: false, shootPressed: false, dashPressed: false, jumpPressed: false,
    skillPressed: false, tacticPressed: false, ...over }) as any;

function testFixedPositionNeverSwitches() {
  const m = makeMatch();
  const ctrl = m.getControlled(0);
  assert(ctrl.index === 3, '默认固定中场');

  // 传球不切人
  m.ball.owner = ctrl;
  ctrl.x = 0; ctrl.z = 0; ctrl.kickCd = 0; ctrl.setState('idle'); ctrl.face(1, 0);
  const mate = m.teamPlayers(0)[5];
  mate.x = 20; mate.z = 0; mate.setState('idle');
  m.executePass(ctrl, mate);
  assert(m.getControlled(0) === ctrl, '传球后仍固定操控原球员');

  // 定位球不切人
  m.phase = 'throwin'; m.phaseT = 0; m.restartTeam = 0;
  m.restartPos = { x: 10, z: 5 };
  m.doRestart();
  assert(m.getControlled(0) === ctrl, '定位球后仍固定操控原球员');

  // 旧 switchPressed 输入无效
  m.phase = 'play'; m.phaseT = 0;
  m.update(1 / 60, [emptyInp({ switchPressed: true }), null]);
  assert(m.getControlled(0) === ctrl, '旧换人输入不应改变受控球员');
}

function testCallForPassContext() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  const mate = m.teamPlayers(0)[5];

  // 队友持球 → 要球(不滑铲)
  m.ball.owner = mate;
  m.applyInput(p, emptyInp({ passPressed: true }), 1 / 60);
  assert(p.passCallT > 0 && p.state !== 'slide', '队友持球按传球键应要球而非滑铲');
  assert(m.events.some(e => e.type === 'callForPass'), '要球应触发 callForPass 事件');

  // 方向要球:归一化到 (0.6, 0.8)
  m.events.length = 0; p.setState('idle');
  m.applyInput(p, emptyInp({ passPressed: true, dirX: 3, dirZ: 4 }), 1 / 60);
  near(p.passCallDirX, 0.6, 1e-6, '要球方向 X 应归一化');
  near(p.passCallDirZ, 0.8, 1e-6, '要球方向 Z 应归一化');

  // 对手持球 → 滑铲
  m.events.length = 0; p.setState('idle'); p.kickCd = 0;
  const opp = m.teamPlayers(1)[2];
  m.ball.owner = opp;
  m.applyInput(p, emptyInp({ passPressed: true }), 1 / 60);
  assert(p.state === 'slide', '对手持球按传球键应滑铲');

  // 自由球 → 滑铲
  p.setState('idle'); p.kickCd = 0;
  m.ball.owner = null;
  m.applyInput(p, emptyInp({ passPressed: true }), 1 / 60);
  assert(p.state === 'slide', '自由球按传球键应滑铲');
}

function testSpacePassRequest() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.kickCd = 0; p.setState('idle');
  m.ball.owner = p;
  const mate = m.teamPlayers(0)[4];
  mate.x = 10; mate.z = 0; mate.vx = 0; mate.vz = 0; mate.setState('idle');
  const spaceX = 5, spaceZ = 3;
  m.executePass(p, mate, 0, false, spaceX, spaceZ);
  const tx = mate.x + spaceX, tz = mate.z + spaceZ;
  const dx = tx - p.x, dz = tz - p.z;
  const dd = Math.hypot(dx, dz) || 1;
  const speed = Math.hypot(m.ball.vx, m.ball.vz) || 1;
  near(m.ball.vx / speed, dx / dd, 1e-6, '空间要球应指向请求空间 X');
  near(m.ball.vz / speed, dz / dd, 1e-6, '空间要球应指向请求空间 Z');
}

function testChargeStopAndAimCache() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;

  // 蓄力期间持续输入方向:慢速移动(约40%跑速),不恢复全速
  const hold = emptyInp({ shoot: true, dirX: 1, dirZ: 0 });
  m.applyInput(p, hold, 1 / 60);
  for (let i = 0; i < 6; i++) m.applyInput(p, hold, 1 / 60);
  const expectedSp = p.moveSpeed() * C.CHARGE_MOVE_SCALE;
  assert(Math.abs(p.vx) < expectedSp * 1.3 && Math.abs(p.vx) > expectedSp * 0.6,
    `蓄力期间应保持约40%跑速,实际 vx=${p.vx.toFixed(2)} (期望≈${expectedSp.toFixed(2)})`);
  near(p.vz, 0, 0.3, '蓄力移动不应产生侧向速度');

  // 蓄力期间 dirZ 瞄准,松开帧回中,仍用缓存瞄准
  p.shootChargeT = -1; p.shootAimX = 0; p.shootAimZ = 0; p.vx = 0; p.vz = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p; m.events.length = 0;
  const aim = emptyInp({ shoot: true, dirZ: 1 });
  m.applyInput(p, aim, 1 / 60);
  for (let i = 0; i < 10; i++) m.applyInput(p, aim, 1 / 60);
  aim.shoot = false; aim.dirZ = 0;
  m.applyInput(p, aim, 1 / 60);
  assert(m.ball.owner === null, '蓄力足够松开应真射');
  assert(m.ball.vz > 0, '松开帧回中后应仍使用缓存瞄准(正 z)');
}

function testKeeperManualDive() {
  const m = makeMatch();
  const keeper = m.teamPlayers(0)[0];
  keeper.x = -C.FIELD_LENGTH / 2 + 1.5; keeper.z = 0; keeper.y = 0;
  keeper.setState('idle'); keeper.kickCd = 0;
  m.ball.reset(-C.FIELD_LENGTH / 2 + 6, 3);
  m.ball.kick(28, 2, -2, m.teamPlayers(1)[2]);
  m.ball.prevY = m.ball.y;

  // 手动扑救:dive 状态扩大接触半径,必抱稳并给能量奖励
  m.doKeeperDive(keeper, 0, -1, 0.8);
  assert(keeper.state === 'dive' && keeper.divePower > 0.7, '扑救应进入 dive 且记录力度');
  assert(keeper.vz < -10, '扑救应朝负 z 方向高速扑出');
  m.energy[0] = 0;
  // 把球挪到扩大半径内模拟高速射门到达
  keeper.x = -C.FIELD_LENGTH / 2 + 2; keeper.z = -1.5; keeper.y = 0.5;
  m.ball.x = keeper.x + 1; m.ball.y = 1; m.ball.z = keeper.z + 1;
  m.ball.vx = -26; m.ball.vz = 0; m.ball.prevX = m.ball.x + 1;
  m.ballPickup();
  assert(m.ball.owner === keeper, '主动扑救半径内必抱稳');
  assert(m.energy[0] > 0, '扑救抱稳应给全队能量奖励');
}

function testChipAndDaisyCutter() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;

  // 吊射:过人键窗口内射门 → 高抛
  p.chipRequestT = C.CHIP_WINDOW;
  m.doShoot(p, emptyInp(), 0, 0, true, false);
  assert(m.ball.vy > 8, `吊射应有高抬升,实际 vy=${m.ball.vy.toFixed(2)}`);

  // 贴地斩:蓄力+按住冲刺 → 低平快球
  m.ball.reset(p.x + 1.4, p.z); m.ball.owner = p;
  p.kickCd = 0; p.setState('idle');
  const speedDaisy = () => Math.hypot(m.ball.vx, m.ball.vz);
  m.doShoot(p, emptyInp({ dash: true }), 0.5, 0, false, true);
  assert(m.ball.vy < 2, `贴地斩应贴地,实际 vy=${m.ball.vy.toFixed(2)}`);
  assert(speedDaisy() > C.SHOOT_SPEED * 1.1, `贴地斩应高速,实际 ${speedDaisy().toFixed(1)}`);
}

function testTrickDribbles() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.dribbleCd = 0;
  p.face(1, 0);
  m.ball.owner = p;

  // 马赛回旋:拉后方向(与面朝反向)
  assert(m.doDribble(p, -1, 0), '拉后方向应触发过人');
  assert(p.trickType === 'roulette', '反向输入应触发马赛回旋');
  assert(p.state === 'dribble', '回旋应进入过人状态');

  // 踩单车:同向 + 按住冲刺 → 近处防守者僵直
  for (let t = 0; t < 1.8; t += 1 / 60) p.update(1 / 60);
  p.setState('idle'); p.dribbleCd = 0; p.trickType = 'none';
  p.face(1, 0); m.ball.owner = p;
  const defender = m.teamPlayers(1)[2];
  defender.x = p.x + 2; defender.z = p.z; defender.setState('idle'); defender.stunned = 0;
  assert(m.doDribble(p, 1, 0, true), '按住冲刺应触发过人');
  assert(p.trickType === 'stepover', '冲刺+过人应触发踩单车');
  assert(defender.stunned > 0.4, `踩单车应使近处防守者僵直,实际 ${defender.stunned.toFixed(2)}`);
}

function testNeymarTricks() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.dribbleCd = 0;
  p.face(1, 0);
  m.ball.owner = p;

  // 彩虹过人:球被高高挑起且短暂无人可拾
  assert(m.doDribble(p, 1, 0, false, 'rainbow'), '彩虹过人应触发');
  assert(p.trickType === 'rainbow', '变体应为 rainbow');
  assert(m.ball.owner === null, '彩虹挑起后球权释放');
  assert(m.ball.vy > 6, `彩虹挑球应有高抬升,vy=${m.ball.vy.toFixed(2)}`);
  assert(m.ball.untouchable >= C.RAINBOW_UNTOUCH - 1e-9, `彩虹球无人可拾,${m.ball.untouchable.toFixed(2)}`);
  for (let t = 0; t < 1.6; t += 1 / 60) p.update(1 / 60);

  // 牛尾巴:近处防守者僵直更久(0.7s)
  p.setState('idle'); p.dribbleCd = 0; p.trickType = 'none';
  p.face(1, 0); m.ball.owner = p;
  const defender = m.teamPlayers(1)[3];
  defender.x = p.x + 2; defender.z = p.z; defender.setState('idle'); defender.stunned = 0;
  assert(m.doDribble(p, 1, 0, false, 'elastico'), '牛尾巴应触发');
  assert(p.trickType === 'elastico', '变体应为 elastico');
  near(defender.stunned, C.ELASTICO_STUN, 0.01, '牛尾巴僵直应为 0.7s');
  for (let t = 0; t < 1.8; t += 1 / 60) p.update(1 / 60);

  // 油炸丸子:垂直于拨球方向的横拨+短冷却可串联
  p.setState('idle'); p.dribbleCd = 0; p.trickType = 'none';
  p.face(1, 0); m.ball.owner = p;
  assert(m.doDribble(p, 0, 0.5, false, 'croqueta'), '油炸丸子应触发');
  assert(p.trickType === 'croqueta', '变体应为 croqueta');
  // dribbleDir=(0,1),横拨应垂直于它 → 速度以 x 为主
  assert(Math.abs(p.vx) > Math.abs(p.vz), '油炸丸子应为垂直横拨');
  near(p.dribbleCd, C.CROQUETA_CD, 0.01, `油炸丸子冷却应短(${p.dribbleCd.toFixed(2)})`);
}

function testNewContentData() {
  assert(teamById('ar').name === '沙漠猎鹰', '新球队 ar 应可查询');
  assert(teamById('fr').name === '高卢雄鸡', '新球队 fr 应可查询');
  assert(SPECIALS.eagle && SPECIALS.eagle.gravityScale > 1.2, '鹰击长空应为急坠弹道');
  assert(SPECIALS.mirage && SPECIALS.mirage.wave > 6, '沙漠幻影应为大摆动弹道');
  assert(TEAMS.length >= 11, `应有至少 11 支球队,实际 ${TEAMS.length}`);
}

function testGoalCelebration() {
  const m = makeMatch();
  const scorer = m.teamPlayers(0)[3];
  scorer.x = C.FIELD_LENGTH / 2 - 2; scorer.z = 0;
  m.ball.reset(C.FIELD_LENGTH / 2 + 0.3, 0);
  m.ball.y = 1;
  m.ball.lastKicker = scorer; m.ball.lastTeam = 0;
  (m as any).shotFlight = { id: m.ball.flightId, team: 0, onTarget: false };
  m.checkBounds();
  assert(m.score[0] === 1, '进球应计分');
  assert(scorer.state === 'celebrateSlide', '进球者应滑跪庆祝');
  assert(scorer.vx !== 0, '滑跪应带前向滑动');
  const mate = m.teamPlayers(0)[5];
  assert(mate.state.startsWith('celebrate'), '队友也应进入庆祝状态');
  assert(scorer.celebrateStyle === 0 && mate.celebrateStyle !== scorer.celebrateStyle, '进球者与队友庆祝样式应错开');
  m.setupKickoff(1);
  assert(!scorer.state.startsWith('celebrate'), '重新开球应复位庆祝状态');
}

function testKeeperPunchAndTackle() {
  const m = makeMatch();
  const keeper = m.teamPlayers(0)[0];
  keeper.x = -C.FIELD_LENGTH / 2 + 2; keeper.z = 0; keeper.y = 0;
  keeper.setState('idle'); keeper.kickCd = 0;

  // 拳击解围:球在附近时长按松开应大力踢出
  m.ball.reset(keeper.x + 1.5, 0);
  m.ball.vx = 0; m.ball.vy = 0; m.ball.vz = 0; m.ball.owner = null;
  (m as any).doKeeperPunch(keeper, 1, 0);
  const speed = Math.hypot(m.ball.vx, m.ball.vz);
  assert(speed > 28, `拳击解围应大力踢出,实际 ${speed.toFixed(1)}`);
  assert(m.ball.lastTeam === 0, '拳击解围球权应归门将方');

  // 门将滑铲逼抢
  keeper.setState('idle'); keeper.kickCd = 0;
  const attempts = m.stats[0].tackleAttempts;
  m.doSlideTackle(keeper);
  assert(keeper.state === 'slide', '门将应能滑铲逼抢');
  assert(m.stats[0].tackleAttempts === attempts + 1, '门将滑铲应计入铲球尝试');
}

function testSpecialLandingGrace() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;
  m.energy[0] = C.ENERGY_MAX;

  // 模拟跳跃后落地:能量满时落地开启缓冲窗口
  p.y = 1; p.vy = 0;
  for (let i = 0; i < 20 && !p.onGround; i++) {
    const wasAir = p.y > 0.05;
    p.update(1 / 60);
    if (wasAir && p.onGround && m.energyFull(0)) p.landingGraceT = C.LANDING_GRACE_T;
  }
  assert(p.landingGraceT > 0, '落地应开启必杀缓冲窗口');

  // 缓冲窗口内地面射门应触发必杀
  const flight0 = m.ball.flightId;
  m.doShoot(p, emptyInp(), 0.5, 0, false, false);
  assert(m.ball.flightId === flight0 + 1, '射门应出脚');
  assert(m.ball.special !== null, '缓冲窗口内射门应触发必杀');
  assert(m.energy[0] === 0, '必杀应清空能量');
}

function testSoloTrainingDrill() {
  const m = makeMatch();
  m.trainingDrill = 'solo';
  m.setupTrainingDrill();
  const human = m.getControlled(0);
  assert(human.index === 3, '单人训练默认操控中场');
  assert(m.ball.owner === human, '单人训练球权应交给玩家');
  for (const p of m.players) {
    if (p === human) continue;
    assert(Math.abs(p.x) > 50 || Math.abs(p.z) > 35, '其余球员应移出场外');
  }
  // 控制台的复位行为:切门将位
  m.controlledIdx[0] = 0;
  const keeper = m.getControlled(0);
  assert(keeper.isKeeper, '控制台切位后应操控门将');
  m.soloReset();
  assert(m.ball.owner === m.getControlled(0), 'soloReset 后球权应交给当前受控球员');
}

function testSoloNpcFreeze() {
  const m = makeMatch();
  m.trainingDrill = 'solo';
  m.soloReset();
  const human = m.getControlled(0);
  const npc = m.teamPlayers(1)[2];

  // 冻结后 NPC 不更新:位置/状态保持静止
  m.soloNpcFrozen = true;
  const nx = npc.x, nz = npc.z;
  for (let i = 0; i < 30; i++) m.update(1 / 60, [null, null]);
  near(npc.x, nx, 1e-6, '冻结 NPC 的 X 应保持不变');
  near(npc.z, nz, 1e-6, '冻结 NPC 的 Z 应保持不变');
  assert(npc.state !== 'run' || Math.hypot(npc.vx, npc.vz) === 0, '冻结 NPC 不应有移动速度');

  // 玩家仍可正常活动
  assert(m.getControlled(0) === human, '冻结期间玩家受控角色不变');

  // 解冻后恢复
  m.soloNpcFrozen = false;
  m.update(1 / 60, [null, null]);
  assert(true, '解冻后更新不抛错');
}

function testChargeMoveAndOmniShot() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;

  // 蓄力期间持续给方向:应能慢速移动(约40%跑速)而非站桩
  const hold = emptyInp({ shoot: true, dirX: 1, dirZ: 0 });
  m.applyInput(p, hold, 1 / 60);
  for (let i = 0; i < 5; i++) m.applyInput(p, hold, 1 / 60);
  const expected = p.moveSpeed() * C.CHARGE_MOVE_SCALE;
  near(Math.abs(p.vx), expected, expected * 0.25, '蓄力期间应以约40%跑速移动');

  // 全向射门:蓄力中瞄准己方半场方向(-x),松开应朝 -x 出脚
  p.x = 10; p.setState('idle'); p.shootChargeT = -1; p.shootAimX = 0; p.shootAimZ = 0;
  m.ball.owner = p; m.events.length = 0;
  const backAim = emptyInp({ shoot: true, dirX: -1 });
  m.applyInput(p, backAim, 1 / 60);
  for (let i = 0; i < 12; i++) m.applyInput(p, backAim, 1 / 60);
  backAim.shoot = false;
  m.applyInput(p, backAim, 1 / 60);
  assert(m.ball.vx < -5, `自由方向应朝输入方向出脚,实际 vx=${m.ball.vx.toFixed(2)}`);

  // 无输入默认仍朝对方球门(+x)
  p.setState('idle'); p.kickCd = 0; p.shootChargeT = -1; p.shootAimX = 0; p.shootAimZ = 0;
  m.ball.reset(p.x + 1.4, p.z); m.ball.owner = p; m.events.length = 0;
  const noAim = emptyInp({ shoot: true });
  m.applyInput(p, noAim, 1 / 60);
  for (let i = 0; i < 12; i++) m.applyInput(p, noAim, 1 / 60);
  noAim.shoot = false;
  m.applyInput(p, noAim, 1 / 60);
  assert(m.ball.vx > 5, `无输入应默认射向对方球门,实际 vx=${m.ball.vx.toFixed(2)}`);
}

function testDashCombos() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.kickCd = 0; p.dashCd = 0;
  p.face(1, 0); p.stamina = C.STAMINA_MAX;

  // 冲刺+跳跃=鱼跃冲顶
  m.applyInput(p, emptyInp({ dashPressed: true }), 1 / 60);
  assert(p.state === 'dash', '应进入冲刺');
  m.applyInput(p, emptyInp({ jumpPressed: true }), 1 / 60);
  assert(p.state === 'headbutt', '冲刺中跳跃应为鱼跃冲顶');
  for (let t = 0; t < 1.4; t += 1 / 60) p.update(1 / 60);

  // 冲刺+传球=低平快传
  p.setState('dash'); p.y = 0; p.kickCd = 0;
  const mate = m.teamPlayers(0)[5];
  mate.x = p.x + 20; mate.z = 0; mate.setState('idle');
  m.ball.owner = p;
  m.doPass(p);
  assert(m.ball.vy <= 1.01, `冲刺快传应贴地,vy=${m.ball.vy.toFixed(2)}`);
  const passSpeed = Math.hypot(m.ball.vx, m.ball.vz);
  assert(passSpeed > C.PASS_SPEED * 1.15, `冲刺快传应加速,${passSpeed.toFixed(1)}`);

  // 假射真扣:假射后立刻过人应豁免冷却(经 applyInput 的 kick 硬直连招窗口)
  p.setState('idle'); p.kickCd = 0; p.dribbleCd = 3;   // 故意挂冷却
  m.ball.owner = p; m.energy[0] = 50;
  m.doFakeShot(p);
  assert(p.fakeShotT > 0, '假射应设置诱骗窗口');
  m.applyInput(p, emptyInp({ skillPressed: true, dirX: 1 }), 1 / 60);
  assert(p.state === 'dribble', '假射后过人应豁免冷却(连招)');
}

function testKeeperInterferenceFoul() {
  const m = makeMatch();
  const attacker = m.teamPlayers(0)[2];
  const oppKeeper = m.teamPlayers(1)[0];
  // 对方门将在本方禁区内(1 队守 +x 门)
  oppKeeper.x = C.FIELD_LENGTH / 2 - 8; oppKeeper.z = 0;
  oppKeeper.setState('idle'); oppKeeper.y = 0;
  attacker.x = oppKeeper.x - C.PLAYER_RADIUS * 2; attacker.z = 0;
  attacker.setState('slide');
  const fouls0 = m.stats[0].fouls;
  const random = Math.random; Math.random = () => 0;
  try { m.playerCollisions(); } finally { Math.random = random; }
  assert(m.stats[0].fouls === fouls0 + 1, '禁区冲撞对方门将应记犯规');
  assert(m.phase === 'freekick' && m.restartTeam === 1, '干扰门将应判任意球给门将方');
  assert(m.events.some(e => e.type === 'foul'), '应触发 foul 事件');

  // 铲普通球员不吹犯规(街机对抗保持合法)
  m.phase = 'play'; m.phaseT = 0;
  const fielder = m.teamPlayers(1)[3];
  fielder.x = 0; fielder.z = 0; fielder.setState('idle'); fielder.y = 0;
  attacker.x = -C.PLAYER_RADIUS * 2; attacker.z = 0;
  attacker.setState('slide');
  const fouls1 = m.stats[0].fouls;
  try { m.playerCollisions(); } finally { /* random restored */ }
  assert(m.stats[0].fouls === fouls1, '铲倒普通球员不应判犯规');

  // 禁区外撞门将也不吹(仅保护禁区/持球场景)
  m.phase = 'play'; m.phaseT = 0;
  oppKeeper.x = 0; oppKeeper.z = 20; oppKeeper.setState('idle'); oppKeeper.y = 0;
  m.ball.owner = null;
  attacker.x = -C.PLAYER_RADIUS * 2; attacker.z = 20;
  attacker.setState('slide');
  const fouls2 = m.stats[0].fouls;
  try { m.playerCollisions(); } finally { /* noop */ }
  assert(m.stats[0].fouls === fouls2, '禁区外冲撞门将不应判犯规');
}

function testShootAccuracy() {
  const m = makeMatch();
  const p = m.getControlled(0);
  // 中场附近无输入射门:应朝 +x 方向且弹道合理(lift 在门框高度内可入射)
  p.x = 10; p.z = 5; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;
  m.doShoot(p, emptyInp(), 0.3, 0);
  assert(m.ball.vx > 15, `默认射门应朝对方球门,vx=${m.ball.vx.toFixed(1)}`);
  const lift = m.ball.vy;
  assert(lift > 1 && lift < 5, `平射击应低飘,lift=${lift.toFixed(2)}`);
  assert(Math.abs(m.ball.swerve) <= 6, `侧旋应收紧到 ±6,swerve=${m.ball.swerve.toFixed(2)}`);
}

function testChargeTiers() {
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 10; p.z = 3; p.y = 0; p.setState('idle'); p.kickCd = 0;

  // 半蓄=普通强化(power≈1.14×base)
  m.ball.owner = p; m.energy[0] = 30;   // 能量不满,避免触发必杀
  const base = C.SHOOT_SPEED * p.def.power;
  m.doShoot(p, emptyInp(), 0.5, 0);
  const halfSpeed = Math.hypot(m.ball.vx, m.ball.vz);
  near(halfSpeed, base * 1.14, 1.2, `半蓄力量应为 1.14×base`);

  // 满蓄(能量不满)=重炮:power≥1.4×base 且贴地
  p.setState('idle'); p.kickCd = 0; m.ball.owner = p;
  m.doShoot(p, emptyInp(), 1, 0);
  const cannonSpeed = Math.hypot(m.ball.vx, m.ball.vz);
  assert(cannonSpeed >= base * C.CANNON_POWER_MUL - 1, `重炮应大力,cannon=${cannonSpeed.toFixed(1)} vs base×${C.CANNON_POWER_MUL}=${(base * C.CANNON_POWER_MUL).toFixed(1)}`);
  assert(m.ball.vy <= C.CANNON_MAX_LIFT + 0.01, `重炮应贴地强袭,vy=${m.ball.vy.toFixed(2)}`);

  // 满蓄+能量满=必杀(通道 B 地面触发)
  p.setState('idle'); p.kickCd = 0; m.ball.owner = p;
  m.energy[0] = C.ENERGY_MAX;
  m.doShoot(p, emptyInp(), 1, 0);
  assert(m.ball.special !== null, '能量满+满蓄松开应地面触发必杀');
  assert(m.energy[0] === 0, '必杀应清空能量');

  // 满蓄但能量刚耗尽 → 回落为重炮(不再必杀)
  p.setState('idle'); p.kickCd = 0; m.ball.reset(p.x + 1.4, p.z); m.ball.owner = p;
  m.doShoot(p, emptyInp(), 1, 0);
  assert(m.ball.special === null, '能量耗尽后满蓄应为重炮而非必杀');
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
  ['固定位置全程不切换', testFixedPositionNeverSwitches],
  ['要球与滑铲按球权分流', testCallForPassContext],
  ['空间要球落点', testSpacePassRequest],
  ['蓄力急停与瞄准缓存', testChargeStopAndAimCache],
  ['门将手动扑救与能量奖励', testKeeperManualDive],
  ['吊射与贴地斩', testChipAndDaisyCutter],
  ['马赛回旋与踩单车', testTrickDribbles],
  ['内马尔式花式过人', testNeymarTricks],
  ['新球队与新必杀', testNewContentData],
  ['进球庆祝与复位', testGoalCelebration],
  ['门将拳击解围与滑铲', testKeeperPunchAndTackle],
  ['必杀落地缓冲窗口', testSpecialLandingGrace],
  ['单人训练场', testSoloTrainingDrill],
  ['单人训练NPC冻结', testSoloNpcFreeze],
  ['蓄力移动与全向射门', testChargeMoveAndOmniShot],
  ['冲刺连招与假射真扣', testDashCombos],
  ['干扰门将犯规', testKeeperInterferenceFoul],
  ['射门准度回归', testShootAccuracy],
  ['蓄力分级与重炮/必杀通道', testChargeTiers],
  ['护球/回追/手抛球/庆祝', testNewOperations],
];

function testNewOperations() {
  // 护球:按住战术键+持球 → shieldActive,能量缓慢积累
  const m = makeMatch();
  const p = m.getControlled(0);
  p.x = 0; p.z = 0; p.y = 0; p.setState('idle'); p.kickCd = 0;
  m.ball.owner = p;
  m.energy[0] = 50;
  m.applyInput(p, emptyInp({ tactic: true }), 1 / 60);
  assert(p.shieldActive, '按住战术键持球应进入护球');
  assert(m.energy[0] > 50, '护球应缓慢积攒能量');
  const shieldSpeed = Math.hypot(p.vx, p.vz);
  m.applyInput(p, emptyInp({ tactic: true, dirX: 1 }), 1 / 60);
  const shieldMove = Math.abs(p.vx);
  const normalMove = p.moveSpeed();
  assert(shieldMove < normalMove * 0.7, `护球移动应减速至55%,${shieldMove.toFixed(1)} vs ${normalMove.toFixed(1)}`);

  // 门将手抛球:低平快速
  const keeper = m.teamPlayers(0)[0];
  keeper.x = -C.FIELD_LENGTH / 2 + 2; keeper.z = 0; keeper.y = 0;
  keeper.setState('idle'); keeper.kickCd = 0;
  const mate = m.teamPlayers(0)[2];
  mate.x = keeper.x + 15; mate.z = 5; mate.setState('idle');
  m.ball.reset(keeper.x + 1.4, keeper.z);
  m.ball.owner = keeper;
  m.doKeeperThrow(keeper);
  assert(m.ball.owner === null, '手抛球应释放球权');
  assert(m.ball.vy <= 1.01, `手抛球应低平,vy=${m.ball.vy.toFixed(2)}`);
  const throwSpeed = Math.hypot(m.ball.vx, m.ball.vz);
  near(throwSpeed, C.PASS_SPEED * 1.1, 1.5, `手抛球速度应为 1.1×PASS_SPEED`);

  // 庆祝样式切换
  const scorer = m.teamPlayers(0)[3];
  scorer.celebrateStyle = 0;
  (m as any).setCelebration(scorer);
  assert(scorer.state === 'celebrateSlide', '样式0应为滑跪');
  scorer.celebrateStyle = 2;
  (m as any).setCelebration(scorer);
  assert(scorer.state === 'celebrateCradle', '样式2应为摇篮舞');
}

for (const [name, test] of tests) {
  test();
  console.log(`PASS ${name}`);
}
console.log(`CORE-OK (${tests.length})`);
