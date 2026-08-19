import { Match } from './game/match';
import { updateAI } from './game/ai';
import { GameScene } from './render/scene';
import { Input } from './core/input';
import { Hud } from './ui/hud';
import { Menu, MatchConfig } from './ui/menu';
import { NetClient, emptyInput } from './net/client';
import { TouchControls } from './ui/touch';
import { teamById } from './core/teams';
import { sfx } from './audio/sfx';
import { saveCampaign } from './game/campaign';
import { advance as tourAdvance } from './game/tournament';
import { showStatsPanel, StatsPanelHandle } from './ui/statsPanel';
import { PauseOverlay } from './ui/pause';
import { buildRoster, grantXp } from './game/progress';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui-root') as HTMLDivElement;

const input = new Input();
const touch = new TouchControls(uiRoot, input);
const menu = new Menu(uiRoot);

let match: Match | null = null;
let scene: GameScene | null = null;
let hud: Hud | null = null;
let pause: PauseOverlay | null = null;
let activeCfg: MatchConfig | null = null;
let net: NetClient | null = null;   // 联机会话(null=单机)
let netRole: 'host' | 'guest' = 'host';
let sessionId = 0;
let statsPanel: StatsPanelHandle | null = null;
const timers = new Set<number>();
let lastT = performance.now();

function later(cb: () => void, ms: number, session = sessionId) {
  const timer = window.setTimeout(() => {
    timers.delete(timer);
    if (session === sessionId) cb();
  }, ms);
  timers.add(timer);
  return timer;
}

function invalidateSession() {
  sessionId++;
  for (const timer of timers) window.clearTimeout(timer);
  timers.clear();
  statsPanel?.dismiss();
  statsPanel = null;
}

// 暂停层:跨比赛复用,回调读取当前 match/hud/scene
pause = new PauseOverlay(uiRoot, {
  onResume: () => {},
  onQuit: () => { pause?.hide(); backToMenu(); },
  onTrainingReset: () => {
    if (match?.training) {
      match.trainingReset();
      hud?.banner('重置', '#3dd5f5', 0.6);
    }
  },
  isTraining: () => match?.training ?? false,
});
touch.onPause = () => pause?.show();
menu.onOnlineCancel = () => {
  invalidateSession();
  net?.close();
  net = null;
};

menu.onStart = (cfg) => {
  invalidateSession();
  sfx.ensure();
  menu.hide();
  touch.show(true);
  activeCfg = cfg;
  // 我方套用成长/招募后的阵容,对手用原始数据
  match = new Match(buildRoster(cfg.teamA), teamById(cfg.teamB));
  match.humanTeam = 0;
  match.controlledIdx[0] = cfg.playAsKeeper ? 0 : 3;
  match.controlLocked[0] = !!cfg.playAsKeeper;
  match.aiLevel = cfg.aiLevel;
  match.goldenGoal = cfg.goldenGoal;
  match.training = cfg.training;
  match.ruleset = cfg.ruleset ?? 'arcade';
  match.halfDuration = cfg.halfDuration ?? 90;
  match.energyGainScale = cfg.energyGainScale ?? 1;
  if (cfg.training) {
    match.trainingDrill = cfg.trainingDrill ?? 'free';
    match.setupTrainingDrill();
  }
  if (!cfg.training) {
    if (!cfg.weather || cfg.weather === 'random') match.rollWeather();
    else { match.weather = cfg.weather; match.randomWind(); }
  }
  scene = new GameScene(canvas, match);
  hud = new Hud(uiRoot, match);
  const wName = { clear: '', rain: ' · 雨战', snow: ' · 雪战' }[match.weather];
  const ruleName = match.ruleset === 'classic' ? ' · 竞技规则' : ' · 热血规则';
  hud.banner(cfg.training ? '自由训练开始' : `开 球!${wName}${ruleName}`, '#d9b45b', 1.8);
};

function backToMenu(campaignWon = false) {
  const cfg = activeCfg;
  invalidateSession();
  pause?.hide();
  hud?.destroy(); hud = null;
  scene?.dispose(); scene = null;   // 释放 WebGL 资源,防止反复开赛泄漏
  match = null;
  net?.close(); net = null;
  touch.show(false);
  menu.show();
  if (cfg?.campaign) {
    // 征战胜利 → 先弹招募界面再回关卡页
    if (campaignWon) menu.showRecruit(cfg.campaign, cfg.teamB);
    else menu.showCampaignStage(cfg.campaign);
  }
  else if (cfg?.tournament) menu.showBracket(cfg.tournament);
  activeCfg = null;
}

function endMatch() {
  if (!match || !hud) return;
  const m = match;
  const currentSession = sessionId;
  const currentHud = hud;
  const [s0, s1] = m.score;
  const winner = m.winner();
  const localTeam = m.humanTeam >= 0 ? m.humanTeam : 0;
  const win = winner === localTeam;

  const camp = activeCfg?.campaign;
  if (camp) {
    if (win) { camp.stage++; camp.wins++; }
    else camp.losses++;
    saveCampaign(camp);
  }
  const tour = activeCfg?.tournament;
  if (tour && winner >= 0) {
    tourAdvance(tour, {
      score: [s0, s1],
      winner: winner as 0 | 1,
      shootout: m.shootoutWinner >= 0 && m.shootout
        ? [m.shootout.scores[0], m.shootout.scores[1]]
        : undefined,
    });
  }

  let leveled: number[] = [];
  if (activeCfg && !activeCfg.training && !net) {
    leveled = grantXp(activeCfg.teamA, {
      win, goals: m.score[localTeam], specials: m.stats[localTeam].specials,
    });
  }
  if (leveled.length > 0) {
    const names = leveled.map(i => m.teams[localTeam].players[i].name).join('、');
    later(() => currentHud.banner(`${names} 升级!`, '#3df58a', 2), 1200, currentSession);
  }

  const pk = m.shootoutWinner >= 0 ? ` (点球 ${m.shootout!.scores[0]}-${m.shootout!.scores[1]})` : '';
  currentHud.banner(`比赛结束 ${s0}-${s1}${pk}`, win ? '#f5d33d' : '#8899aa', 2);
  later(() => {
    if (match !== m || hud !== currentHud) return;
    statsPanel = showStatsPanel(uiRoot, m, () => {
      statsPanel = null;
      if (match === m) backToMenu(win && !!camp);
    });
  }, 2100, currentSession);
}

// ---------- 联机 ----------
function serverUrl() {
  const q = new URLSearchParams(location.search).get('server');
  return q || 'ws://localhost:8890';
}

menu.onOnline = async (create, team, code) => {
  invalidateSession();
  sfx.ensure();
  net = new NetClient();
  const currentNet = net;
  const currentSession = sessionId;
  try {
    await currentNet.connect(serverUrl());
    if (net !== currentNet) {
      currentNet.close();
      return;
    }
  } catch {
    if (net !== currentNet) return;
    alert('无法连接服务器,请先运行: node server/server.mjs');
    net = null;
    return;
  }
  currentNet.onError = msg => { if (net === currentNet) alert(msg); };
  currentNet.onCreated = c => {
    if (net !== currentNet) return;
    menu.showWaiting(c, () => {
      if (net === currentNet) net = null;
      currentNet.close();
      invalidateSession();
      menu.showTitle();
    });
  };
  currentNet.onPeerLeft = () => {
    if (net !== currentNet) return;
    hud?.banner('对手已离开', '#f55', 3);
    later(() => {
      if (net !== currentNet) return;
      currentNet.close();
      net = null;
      backToMenu();
    }, 2000, currentSession);
  };
  currentNet.onStart = s => {
    if (net !== currentNet) return;
    netRole = s.role;
    menu.hide();
    touch.show(true);
    // 联机统一规则:主机=0 队(左),客机=1 队(右);双方都固定操控中场核心
    const teamA = s.role === 'host' ? s.myTeam : s.oppTeam;
    const teamB = s.role === 'host' ? s.oppTeam : s.myTeam;
    activeCfg = { teamA, teamB, aiLevel: 1, goldenGoal: true, training: false, ruleset: 'arcade', weather: 'random' };
    match = new Match(teamById(teamA), teamById(teamB));
    match.humans = [0, 1];
    match.humanTeam = s.role === 'host' ? 0 : 1;  // 本地视角(镜头/指示环)
    match.goldenGoal = true;
    match.ruleset = 'arcade';
    match.rollWeather();
    scene = new GameScene(canvas, match);
    hud = new Hud(uiRoot, match);
    hud.banner('联机对战开始!', '#c03df5', 2);
  };
  if (create) currentNet.create(team);
  else currentNet.join(code, team);
};

// ESC 暂停/继续 · R 训练重置
window.addEventListener('keydown', e => {
  if (!match) return;
  if (e.key === 'Escape') { e.preventDefault(); pause?.toggle(); return; }
  if ((e.key === 'r' || e.key === 'R') && match.training) {
    match.trainingReset();
    hud?.banner('重置', '#3dd5f5', 0.6);
  }
});

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  let dt = Math.min(0.033, (now - lastT) / 1000);
  lastT = now;

  input.update();

  if (match && scene && hud) {
    if (pause?.isVisible()) {
      // 暂停:冻结模拟,仅处理恢复输入与退出确认倒计时
      pause.update(dt);
      if (input.startPressed) pause.hide();
    } else if (statsPanel) {
      return;
    } else {
      if (input.startPressed) pause?.show();
      const wasPhase = match.phase;
      if (net && netRole === 'guest') {
        // 客机:只上报输入 + 渲染快照,不做本地模拟
        net.guestTick(input.state, dt);
        net.applySnapshot(match, dt);
        // 主机转发的事件驱动本地音效/横幅
        for (const e of net.remoteEvents) {
          match.events.push({
            type: e.type, team: e.team, x: e.x, z: e.z,
            special: e.special ? { ...e.special } as any : undefined,
            player: e.px !== undefined ? { x: e.px, z: e.pz, team: e.team ?? 0 } as any : undefined,
          });
        }
        net.remoteEvents.length = 0;
      } else {
        updateAI(match, dt);
        const guestInput = net ? net.remoteInput : null;
        match.update(dt, [
          match.humanTeam === 0 || net ? input.state : null,
          guestInput,
        ]);
        if (net) net.hostTick(match, dt);
      }

      // 消费事件 → 音效/横幅/震屏
      for (const e of match.events) {
        switch (e.type) {
          case 'pass': sfx.pass(); break;
          case 'shoot': sfx.shoot(); break;
          case 'kick': sfx.kick(); break;
          case 'bounce': sfx.bounce(); break;
          case 'jump': sfx.jump(); break;
          case 'dribble': sfx.dribble(); break;
          case 'dribbleWin': sfx.dribbleWin(); hud.banner('过人!', '#3df58a', 0.8); break;
          case 'dribbleFail': sfx.tackle(); break;
          case 'fakeShot': sfx.fakeShot(); break;
          case 'tackle': sfx.tackle(); break;
          case 'collide': sfx.collide(); break;
          case 'knockdown': sfx.knockdown(); break;
          case 'post': sfx.post(); break;
          case 'save': sfx.save(); break;
          case 'offside': sfx.whistle(); hud.banner('越 位', '#f5d33d', 1.2); break;
          case 'foul': sfx.whistle(); hud.banner('犯 规 · 任意球', '#efb24d', 1.2); break;
          case 'controlSwitch': sfx.switchPlayer(); break;
          case 'tactic':
            sfx.tactic();
            if (e.team === match.humanTeam) hud.banner(`战术 · ${match.tacticLabel(e.team)}`, '#d9b45b', 0.8);
            break;
          case 'whistle': sfx.whistle(); break;
          case 'special':
            sfx.special();
            if (e.special) hud.banner(`必杀!${e.special.name}!!`, '#' + e.special.color.toString(16).padStart(6, '0'), 1.6);
            break;
          case 'goal':
            sfx.goal();
            hud.banner(match.goldenGoal && match.half >= 3 ? '金球绝杀!!' : 'GOAL!!!', '#f5d33d', 2.4);
            break;
        }
      }
      scene.handleEvents(match.events);
      match.events.length = 0;

      if (wasPhase !== 'halftime' && match.phase === 'halftime') {
        hud.banner(match.half === 3 ? '进入金球加时!' : '中场休息', '#3dd5f5', 2);
      }
      if (wasPhase !== 'fulltime' && match.phase === 'fulltime') endMatch();

      if (match.training && match.trainingDrill !== 'free' && match.drillDone && !match.drillCelebrated) {
        match.drillCelebrated = true;
        hud.banner('训练完成!', '#3df58a', 2);
      }

      scene.update(dt);
      hud.update(dt);
    }
  }
}
loop();

// 首次交互解锁音频(浏览器策略)
window.addEventListener('pointerdown', () => sfx.ensure(), { once: true });
window.addEventListener('keydown', () => sfx.ensure(), { once: true });
