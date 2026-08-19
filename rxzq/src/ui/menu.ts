import { TEAMS, teamById } from '../core/teams';
import { SPECIALS } from '../core/specials';
import { sfx } from '../audio/sfx';
import {
  CampaignState, loadCampaign, newCampaign, clearCampaign,
  currentOpponent, totalStages, stageDifficulty,
} from '../game/campaign';
import {
  TournamentState, loadTournament, newTournament, clearTournament,
  playerMatch, ROUND_NAMES,
} from '../game/tournament';
import { recruit, loadProgress, getProgress, xpForLevel, MAX_LEVEL, buildRoster } from '../game/progress';
import { Ruleset } from '../core/types';
import { Weather } from '../game/match';

export interface MatchConfig {
  teamA: string;
  teamB: string;
  aiLevel: 0 | 1 | 2;
  goldenGoal: boolean;
  training: boolean;
  trainingDrill?: 'free' | 'pass' | 'tackle' | 'special';
  ruleset?: Ruleset;
  weather?: Weather | 'random';
  halfDuration?: 60 | 90 | 120;
  energyGainScale?: number;
  campaign?: CampaignState;    // 来自征战之路则带上进度
  tournament?: TournamentState; // 来自锦标赛则带上进度
  playAsKeeper?: boolean;      // 玩家操控门将位
}

export interface OnlineConfig {
  role: 'host' | 'guest';
  myTeam: string;
  oppTeam: string;
}

// 复古风主菜单:友谊赛 / 征战之路 / 锦标赛 / 训练场 / 联机
export class Menu {
  root: HTMLDivElement;
  onStart: (cfg: MatchConfig) => void = () => {};
  onOnline: (create: boolean, team: string, code: string) => void = () => {};
  onOnlineCancel: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.style.cssText = `position:absolute;inset:0;background:
      radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, #0a0f1e 70%);
      color:#fff;font-family:"Courier New","SimHei",monospace;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:2vh;overflow:auto;`;
    // 动态背景:飘动的像素足球与流星线条(纯 CSS 动画)
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes menuFloat { 0% { transform: translate(0,0) rotate(0deg); } 50% { transform: translate(18px,-26px) rotate(180deg); } 100% { transform: translate(0,0) rotate(360deg); } }
      @keyframes menuStreak { 0% { transform: translateX(-30vw); opacity: 0; } 15% { opacity: .5; } 100% { transform: translateX(130vw); opacity: 0; } }
    `;
    document.head.appendChild(styleEl);
    const bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;';
    for (let i = 0; i < 8; i++) {
      const ball = document.createElement('div');
      const s = 14 + Math.random() * 26;
      ball.textContent = '⚽';
      ball.style.cssText = `position:absolute;left:${Math.random() * 92}%;top:${Math.random() * 88}%;
        font-size:${s}px;opacity:${0.05 + Math.random() * 0.12};
        animation:menuFloat ${9 + Math.random() * 14}s ease-in-out infinite;
        animation-delay:-${Math.random() * 10}s;`;
      bg.appendChild(ball);
    }
    for (let i = 0; i < 4; i++) {
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;top:${8 + Math.random() * 80}%;left:0;width:180px;height:2px;
        background:linear-gradient(90deg,transparent,#3dd5f5aa,transparent);
        animation:menuStreak ${5 + Math.random() * 6}s linear infinite;
        animation-delay:-${Math.random() * 8}s;`;
      bg.appendChild(streak);
    }
    this.root.appendChild(bg);
    this.content = document.createElement('div');
    this.content.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vh;width:100%;';
    this.root.appendChild(this.content);
    parent.appendChild(this.root);
    this.showTitle();
  }

  private content!: HTMLDivElement;
  private clear() { this.content.innerHTML = ''; }

  private mkBtn(label: string, enabled: boolean, cb?: () => void, accent = '#f5d33d') {
    const b = document.createElement('div');
    b.textContent = label;
    b.style.cssText = `font-size:clamp(15px,3vw,24px);padding:10px 40px;letter-spacing:4px;cursor:${enabled ? 'pointer' : 'default'};
      color:${enabled ? '#fff' : '#555'};text-shadow:2px 2px 0 #000;border:3px solid ${enabled ? accent : '#333'};
      background:${enabled ? '#d83a2a33' : 'transparent'};min-width:min(320px,64vw);text-align:center;`;
    if (enabled && cb) {
      b.onmouseenter = () => { b.style.background = '#d83a2a88'; sfx.ensure(); sfx.menuMove(); };
      b.onmouseleave = () => (b.style.background = '#d83a2a33');
      b.onclick = () => { sfx.ensure(); sfx.menuOk(); cb(); };
    }
    this.content.appendChild(b);
    return b;
  }

  private mkBack(cb: () => void) {
    const back = document.createElement('div');
    back.textContent = '← 返回';
    back.style.cssText = 'font-size:16px;padding:8px 24px;cursor:pointer;border:2px solid #888;margin-top:8px;';
    back.onclick = () => { sfx.menuOk(); cb(); };
    this.content.appendChild(back);
  }

  showTitle() {
    this.clear();
    const title = document.createElement('div');
    title.innerHTML = `
      <div style="font-size:clamp(30px,8vw,72px);font-weight:bold;letter-spacing:6px;
        color:#f5d33d;text-shadow:4px 4px 0 #d83a2a, 8px 8px 0 #000;">热血风暴</div>
      <div style="font-size:clamp(14px,3vw,24px);letter-spacing:8px;text-align:center;margin-top:8px;
        color:#3dd5f5;text-shadow:2px 2px 0 #000;">NEKKETSU STORM SOCCER</div>`;
    this.content.appendChild(title);

    const sub = document.createElement('div');
    sub.textContent = '— 致敬街机热血足球的原创作品 —';
    sub.style.cssText = 'font-size:clamp(11px,2vw,15px);opacity:.6;margin-bottom:2vh;';
    this.content.appendChild(sub);

    const camp = loadCampaign();
    const tour = loadTournament();
    this.mkBtn('友谊赛  EXHIBITION', true, () => this.showTeamSelect());
    this.mkBtn(
      camp ? `征战之路  第 ${camp.stage + 1} 关 (继续)` : '征战之路  CAMPAIGN',
      true, () => this.showCampaign(), '#3df58a'
    );
    this.mkBtn(
      tour && tour.round < 3 ? `锦标赛  ${ROUND_NAMES[tour.round]} (继续)` : '锦标赛  TOURNAMENT',
      true, () => this.showTournament(), '#f5a63d'
    );
    this.mkBtn('训练场  TRAINING', true, () => this.showTrainingSelect(), '#3dd5f5');
    this.mkBtn('联机对战  ONLINE (Beta)', true, () => this.showOnline(), '#c03df5');

    const hint = document.createElement('div');
    hint.innerHTML = `键盘: 方向键/WASD 移动 · J/Z 传球(铲球) · K/X 射门 · L/C/Shift 冲刺 · I/空格 跳跃 · Q/U 过人<br>
      手柄: 左摇杆移动 · X 传球 · B 射门 · Y 冲刺 · A 跳跃 · RB 过人 · Start 暂停<br>
      触屏: 虚拟摇杆 + 右侧传射/冲跳/过人按键<br>
      金圈标记固定操控的中场核心,门将模式则整场固定操控门将<br>
      能量槽积满后 跳跃+射门 = 必杀射门!传球与铲球可积攒能量`;
    hint.style.cssText = 'font-size:clamp(10px,1.8vw,14px);opacity:.7;text-align:center;line-height:1.8;margin-top:3vh;';
    this.content.appendChild(hint);
  }

  // ---------- 队伍卡片网格(复用) ----------
  private teamGrid(onPick: (id: string) => void, exclude?: string) {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,240px));gap:14px;justify-content:center;padding:10px;max-width:900px;';
    for (const t of TEAMS) {
      if (t.id === exclude) continue;
      const card = document.createElement('div');
      const c = '#' + t.color.toString(16).padStart(6, '0');
      const c2 = '#' + t.color2.toString(16).padStart(6, '0');
      const stars = t.players.slice(1).map(p =>
        `<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.85;">
          <span>${p.name}</span><span style="color:${c2}">${SPECIALS[p.special].name}</span></div>`).join('');
      card.innerHTML = `
        <div style="font-size:18px;font-weight:bold;color:${c};text-shadow:1px 1px 0 #000;-webkit-text-stroke:.5px #fff3;">${t.name}</div>
        <div style="font-size:11px;letter-spacing:2px;opacity:.6;margin-bottom:6px;">${t.nameEn}</div>
        ${stars}`;
      card.style.cssText = `border:3px solid ${c};padding:10px 14px;cursor:pointer;background:#00000055;transition:transform .1s;`;
      card.onmouseenter = () => { card.style.transform = 'scale(1.04)'; sfx.ensure(); sfx.menuMove(); };
      card.onmouseleave = () => (card.style.transform = 'scale(1)');
      card.onclick = () => { sfx.ensure(); sfx.menuOk(); onPick(t.id); };
      grid.appendChild(card);
    }
    this.content.appendChild(grid);
    return grid;
  }

  private heading(text: string, subText = '') {
    const title = document.createElement('div');
    title.textContent = text;
    title.style.cssText = 'font-size:clamp(20px,5vw,36px);color:#f5d33d;text-shadow:3px 3px 0 #000;letter-spacing:4px;';
    this.content.appendChild(title);
    if (subText) {
      const sub = document.createElement('div');
      sub.textContent = subText;
      sub.style.cssText = 'font-size:clamp(11px,2vw,15px);opacity:.7;';
      this.content.appendChild(sub);
    }
    return title;
  }

  // ---------- 友谊赛 ----------
  showTeamSelect() {
    this.clear();
    let pickA: string | null = null;
    let aiLevel: 0 | 1 | 2 = 1;
    let ruleset: Ruleset = 'classic';
    let weather: Weather | 'random' = 'random';
    let halfDuration: 60 | 90 | 120 = 90;
    let energyGainScale = 1;

    const title = this.heading('选择你的队伍', '(先选我方,再选对手)');
    let asKeeper = false;

    // 难度选择 + 位置选择
    const optWrap = document.createElement('div');
    optWrap.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;';
    const names = ['容易', '普通', '困难'];
    const btns: HTMLDivElement[] = [];
    names.forEach((n, i) => {
      const d = document.createElement('div');
      d.textContent = n;
      d.style.cssText = `padding:6px 20px;border:2px solid ${i === 1 ? '#f5d33d' : '#666'};cursor:pointer;font-size:15px;`;
      d.onclick = () => {
        aiLevel = i as 0 | 1 | 2;
        btns.forEach((b, k) => (b.style.borderColor = k === i ? '#f5d33d' : '#666'));
        sfx.menuMove();
      };
      btns.push(d);
      optWrap.appendChild(d);
    });
    const keeperBtn = document.createElement('div');
    keeperBtn.textContent = '🧤 当门将';
    keeperBtn.style.cssText = 'padding:6px 20px;border:2px solid #666;cursor:pointer;font-size:15px;margin-left:16px;';
    keeperBtn.onclick = () => {
      asKeeper = !asKeeper;
      keeperBtn.style.borderColor = asKeeper ? '#3dd5f5' : '#666';
      keeperBtn.style.color = asKeeper ? '#3dd5f5' : '#fff';
      sfx.menuMove();
    };
    optWrap.appendChild(keeperBtn);
    this.content.appendChild(optWrap);

    // 比赛规则预设:让友谊赛同时承担“标准足球”和“热血乱斗”两种玩法。
    const advanced = document.createElement('div');
    advanced.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:8px 18px;max-width:min(760px,92vw);font-size:12px;';
    const optionGroup = <T extends string | number>(
      label: string,
      values: readonly { value: T; text: string }[],
      current: () => T,
      set: (value: T) => void,
    ) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
      const name = document.createElement('span');
      name.textContent = label;
      name.style.cssText = 'color:#d9c28d;min-width:52px;';
      row.appendChild(name);
      const chips: HTMLDivElement[] = [];
      values.forEach(item => {
        const chip = document.createElement('div');
        chip.textContent = item.text;
        chip.style.cssText = `padding:4px 9px;border:1px solid ${item.value === current() ? '#f5d33d' : '#59616d'};cursor:pointer;background:#080d16aa;`;
        chip.onclick = () => {
          set(item.value);
          chips.forEach((c, i) => (c.style.borderColor = values[i].value === current() ? '#f5d33d' : '#59616d'));
          sfx.menuMove();
        };
        chips.push(chip); row.appendChild(chip);
      });
      advanced.appendChild(row);
    };
    optionGroup('规则', [
      { value: 'classic', text: '竞技' }, { value: 'arcade', text: '热血' },
    ] as const, () => ruleset, value => { ruleset = value; });
    optionGroup('时长', [
      { value: 60, text: '闪电' }, { value: 90, text: '标准' }, { value: 120, text: '鏖战' },
    ] as const, () => halfDuration, value => { halfDuration = value; });
    optionGroup('天气', [
      { value: 'random', text: '随机' }, { value: 'clear', text: '晴' }, { value: 'rain', text: '雨' }, { value: 'snow', text: '雪' },
    ] as const, () => weather, value => { weather = value; });
    optionGroup('必杀', [
      { value: 'normal', text: '标准' }, { value: 'frenzy', text: '狂热' },
    ] as const, () => energyGainScale > 1 ? 'frenzy' : 'normal', value => { energyGainScale = value === 'frenzy' ? 1.6 : 1; });
    this.content.appendChild(advanced);

    this.teamGrid(id => {
      if (!pickA) {
        pickA = id;
        title.textContent = `我方: ${teamById(id).name} · 选择对手`;
      } else if (id !== pickA) {
        this.onStart({
          teamA: pickA, teamB: id, aiLevel, goldenGoal: false, training: false,
          playAsKeeper: asKeeper, ruleset, weather, halfDuration, energyGainScale,
        });
      }
    });
    this.mkBack(() => this.showTitle());
  }

  // ---------- 征战之路 ----------
  showCampaign() {
    this.clear();
    const camp = loadCampaign();
    if (!camp) {
      this.heading('征战之路', '选择你的队伍,依次击败其余强队!平局将进入金球加时');
      this.teamGrid(id => {
        const s = newCampaign(id);
        this.showCampaignStage(s);
      });
      this.mkBack(() => this.showTitle());
      return;
    }
    this.showCampaignStage(camp);
  }

  showCampaignStage(s: CampaignState) {
    this.clear();
    const opp = currentOpponent(s);
    const total = totalStages(s);
    const my = teamById(s.teamId);

    if (!opp) {
      // 通关
      this.heading('🏆 冠军!', `${my.name} 完成征战之路!战绩 ${s.wins} 胜 ${s.losses} 负`);
      this.mkBtn('重新开始征战', true, () => { clearCampaign(); this.showCampaign(); }, '#3df58a');
      this.mkBack(() => this.showTitle());
      return;
    }

    this.heading(`征战之路 · 第 ${s.stage + 1} / ${total} 关`,
      `${my.name}  VS  ${opp.name} · 战绩 ${s.wins}胜${s.losses}负`);

    // 关卡进度条
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;margin:8px 0;';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `width:26px;height:10px;border:2px solid #888;
        background:${i < s.stage ? '#3df58a' : i === s.stage ? '#f5d33d' : 'transparent'};`;
      bar.appendChild(dot);
    }
    this.content.appendChild(bar);

    const lv = stageDifficulty(s);
    const lvName = ['容易', '普通', '困难'][lv];
    const info = document.createElement('div');
    info.textContent = `本关难度: ${lvName} · 平局进入金球加时`;
    info.style.cssText = 'font-size:14px;opacity:.75;';
    this.content.appendChild(info);

    this.mkBtn(`开战!VS ${opp.name}`, true, () => {
      this.onStart({
        teamA: s.teamId, teamB: opp.id,
        aiLevel: lv, goldenGoal: true, training: false,
        campaign: s, ruleset: 'classic', weather: 'random', halfDuration: 90,
      });
    }, '#3df58a');
    this.mkBtn('查看阵容', true, () => this.showSquad(s.teamId, () => this.showCampaignStage(s)), '#3dd5f5');
    this.mkBtn('放弃进度', true, () => { clearCampaign(); this.showTitle(); }, '#f55');
    this.mkBack(() => this.showTitle());
  }

  // ---------- 招募(征战胜利后) ----------
  showRecruit(camp: CampaignState, beatenTeamId: string) {
    this.clear();
    const beaten = teamById(beatenTeamId);
    const my = buildRoster(camp.teamId);
    this.heading('招募球星!', `击败 ${beaten.name},可挑选一名对方球员加入(替换同位置)`);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,210px));gap:12px;justify-content:center;padding:8px;max-width:820px;';
    for (let i = 1; i <= 5; i++) {
      const p = beaten.players[i];
      const cur = my.players[i];
      const card = document.createElement('div');
      card.innerHTML = `
        <div style="font-size:16px;font-weight:bold;color:#f5a63d;">${p.name}</div>
        <div style="font-size:11px;opacity:.75;line-height:1.7;">
          必杀: ${SPECIALS[p.special].name}<br>
          速度 ${p.speed.toFixed(2)} · 力量 ${p.power.toFixed(2)} · 韧性 ${p.toughness.toFixed(2)}</div>
        <div style="font-size:11px;opacity:.5;margin-top:5px;border-top:1px solid #334;padding-top:4px;">
          替换我方: ${cur.name}</div>`;
      card.style.cssText = 'border:2px solid #f5a63d88;padding:10px 12px;cursor:pointer;background:#00000055;';
      card.onmouseenter = () => { card.style.borderColor = '#f5a63d'; sfx.menuMove(); };
      card.onmouseleave = () => (card.style.borderColor = '#f5a63d88');
      card.onclick = () => {
        sfx.menuOk();
        recruit(camp.teamId, beatenTeamId, i, i);
        this.showCampaignStage(camp);
      };
      grid.appendChild(card);
    }
    this.content.appendChild(grid);
    this.mkBtn('不招募,继续前进 →', true, () => this.showCampaignStage(camp), '#3df58a');
  }

  // ---------- 我的阵容(等级/经验一览) ----------
  showSquad(teamId: string, back: () => void) {
    this.clear();
    const team = buildRoster(teamId);
    const prog = loadProgress();
    this.heading(`${team.name} · 阵容`, '等级由比赛经验积累,属性随等级提升');
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,220px));gap:12px;justify-content:center;padding:8px;max-width:860px;';
    team.players.forEach((p, i) => {
      const pr = getProgress(prog, teamId, i);
      const need = xpForLevel(pr.level);
      const pct = pr.level >= MAX_LEVEL ? 100 : Math.round(pr.xp / need * 100);
      const card = document.createElement('div');
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;">
          <b style="color:#3dd5f5;">${i === 0 ? '🧤' : ''}${p.name}</b>
          <span style="color:#f5d33d;">Lv.${pr.level}</span></div>
        <div style="font-size:11px;opacity:.75;line-height:1.7;">
          ${i === 0 ? '门将' : '必杀: ' + SPECIALS[p.special].name}<br>
          速 ${p.speed.toFixed(2)} · 力 ${p.power.toFixed(2)} · 韧 ${p.toughness.toFixed(2)}</div>
        <div style="height:7px;background:#1a2238;border:1px solid #445;margin-top:5px;">
          <div style="height:100%;width:${pct}%;background:#3df58a;"></div></div>
        <div style="font-size:10px;opacity:.5;">${pr.level >= MAX_LEVEL ? 'MAX' : `EXP ${pr.xp}/${need}`}</div>`;
      card.style.cssText = 'border:2px solid #33507a;padding:10px 12px;background:#00000055;';
      grid.appendChild(card);
    });
    this.content.appendChild(grid);
    this.mkBack(back);
  }

  // ---------- 锦标赛 ----------
  showTournament() {
    this.clear();
    const tour = loadTournament();
    if (!tour) {
      this.heading('锦标赛', '8 队单败淘汰!选择你的队伍');
      this.teamGrid(id => {
        const s = newTournament(id);
        this.showBracket(s);
      });
      this.mkBack(() => this.showTitle());
      return;
    }
    this.showBracket(tour);
  }

  showBracket(s: TournamentState) {
    this.clear();
    const my = teamById(s.playerTeam);

    if (s.round >= 3) {
      const champ = teamById(s.champion!);
      const won = s.champion === s.playerTeam;
      this.heading(won ? '🏆 夺冠!' : '锦标赛结束',
        won ? `${my.name} 捧起奖杯!` : `冠军: ${champ.name}`);
      this.renderBracketTable(s);
      this.mkBtn('再来一届', true, () => { clearTournament(); this.showTournament(); }, '#f5a63d');
      this.mkBack(() => this.showTitle());
      return;
    }

    this.heading(`锦标赛 · ${ROUND_NAMES[s.round]}`,
      s.eliminated ? '你已被淘汰,可继续观战模拟' : `${my.name} 出战!淘汰赛平局进入金球加时`);
    this.renderBracketTable(s);

    const pm = playerMatch(s);
    if (pm && !s.eliminated) {
      const opp = teamById(pm.a === s.playerTeam ? pm.b : pm.a);
      const lv: 0 | 1 | 2 = s.round === 0 ? 1 : 2;
      this.mkBtn(`开战!VS ${opp.name}`, true, () => {
        this.onStart({
          teamA: s.playerTeam, teamB: opp.id,
          aiLevel: lv, goldenGoal: true, training: false,
          tournament: s, ruleset: 'classic', weather: 'random', halfDuration: 90,
        });
      }, '#f5a63d');
    } else {
      // 玩家被淘汰:一键模拟本轮
      this.mkBtn('模拟本轮比赛 ▶', true, () => {
        import('../game/tournament').then(T => {
          T.advance(s);
          this.showBracket(s);
        });
      }, '#f5a63d');
    }
    this.mkBtn('放弃本届', true, () => { clearTournament(); this.showTitle(); }, '#f55');
    this.mkBack(() => this.showTitle());
  }

  private renderBracketTable(s: TournamentState) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap;padding:8px;';
    for (let r = 0; r < s.bracket.length; r++) {
      const col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
      const label = document.createElement('div');
      label.textContent = ROUND_NAMES[r];
      label.style.cssText = 'font-size:12px;opacity:.6;text-align:center;letter-spacing:2px;';
      col.appendChild(label);
      for (const mt of s.bracket[r]) {
        const a = teamById(mt.a), b = teamById(mt.b);
        const done = mt.scoreA !== undefined;
        const box = document.createElement('div');
        const mine = mt.a === s.playerTeam || mt.b === s.playerTeam;
        const row = (t: typeof a, sc: number | undefined, pk: number | undefined, winner: boolean) => `
          <div style="display:flex;justify-content:space-between;gap:10px;min-width:150px;
            ${winner ? 'color:#f5d33d;font-weight:bold;' : done ? 'opacity:.55;' : ''}">
            <span>${t.id === s.playerTeam ? '★ ' : ''}${t.name}</span><span>${sc ?? '-'}${pk === undefined ? '' : ` (${pk})`}</span></div>`;
        const winner = mt.winner ?? (done ? (mt.scoreA! > mt.scoreB! ? mt.a : mt.b) : '');
        box.innerHTML =
          row(a, mt.scoreA, mt.shootoutA, winner === mt.a) +
          row(b, mt.scoreB, mt.shootoutB, winner === mt.b);
        box.style.cssText = `border:2px solid ${mine ? '#f5a63d' : '#445'};padding:7px 12px;
          background:#00000066;font-size:13px;line-height:1.7;`;
        col.appendChild(box);
      }
      wrap.appendChild(col);
    }
    // 冠军列
    if (s.champion) {
      const col = document.createElement('div');
      col.innerHTML = `<div style="font-size:12px;opacity:.6;letter-spacing:2px;text-align:center;">冠军</div>
        <div style="border:2px solid #f5d33d;padding:10px 14px;color:#f5d33d;font-weight:bold;background:#00000066;">
        🏆 ${teamById(s.champion).name}</div>`;
      col.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
      wrap.appendChild(col);
    }
    this.content.appendChild(wrap);
  }

  // ---------- 联机对战 ----------
  showOnline() {
    this.clear();
    this.heading('联机对战 (Beta)', '同一服务器下:一人创建房间获得房间码,另一人输入房间码加入');
    let myTeam = TEAMS[0].id;

    // 队伍横向选择
    const teamRow = document.createElement('div');
    teamRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:760px;';
    const chips: HTMLDivElement[] = [];
    for (const t of TEAMS) {
      const c = '#' + t.color.toString(16).padStart(6, '0');
      const chip = document.createElement('div');
      chip.textContent = t.name;
      chip.style.cssText = `padding:6px 14px;border:2px solid ${t.id === myTeam ? '#f5d33d' : c + '88'};
        cursor:pointer;font-size:13px;background:#00000055;`;
      chip.onclick = () => {
        myTeam = t.id;
        chips.forEach((ch, i2) => (ch.style.borderColor = TEAMS[i2].id === myTeam ? '#f5d33d' : '#' + TEAMS[i2].color.toString(16).padStart(6, '0') + '88'));
        sfx.menuMove();
      };
      chips.push(chip);
      teamRow.appendChild(chip);
    }
    this.content.appendChild(teamRow);

    this.mkBtn('创建房间(主机)', true, () => this.onOnline(true, myTeam, ''), '#c03df5');

    const joinRow = document.createElement('div');
    joinRow.style.cssText = 'display:flex;gap:10px;align-items:center;';
    const codeInput = document.createElement('input');
    codeInput.placeholder = '房间码';
    codeInput.maxLength = 4;
    codeInput.style.cssText = `width:110px;padding:9px;font-size:19px;text-align:center;letter-spacing:5px;
      background:#0d1428;border:2px solid #c03df5;color:#fff;font-family:inherit;outline:none;`;
    const joinBtn = document.createElement('div');
    joinBtn.textContent = '加入房间';
    joinBtn.style.cssText = 'padding:9px 22px;border:2px solid #c03df5;cursor:pointer;font-size:16px;background:#d83a2a33;';
    joinBtn.onclick = () => {
      if (codeInput.value.length === 4) { sfx.menuOk(); this.onOnline(false, myTeam, codeInput.value); }
    };
    joinRow.appendChild(codeInput);
    joinRow.appendChild(joinBtn);
    this.content.appendChild(joinRow);

    const tip = document.createElement('div');
    tip.innerHTML = '需先启动服务器: <b>node server/server.mjs</b>(默认 ws://localhost:8890,可用 ?server=ws://IP:8890 指定)';
    tip.style.cssText = 'font-size:12px;opacity:.55;margin-top:8px;text-align:center;line-height:1.8;';
    this.content.appendChild(tip);
    this.mkBack(() => { this.onOnlineCancel(); this.showTitle(); });
  }

  // 等待对手界面
  showWaiting(code: string, onCancel: () => void) {
    this.clear();
    this.heading('等待对手加入…', '把房间码告诉你的朋友');
    const codeEl = document.createElement('div');
    codeEl.textContent = code;
    codeEl.style.cssText = `font-size:64px;font-weight:bold;letter-spacing:16px;color:#c03df5;
      text-shadow:3px 3px 0 #000;border:3px dashed #c03df5;padding:12px 30px;`;
    this.content.appendChild(codeEl);
    this.mkBtn('取消', true, onCancel, '#f55');
  }

  // ---------- 训练场 ----------
  showTrainingSelect() {
    this.clear();
    this.heading('训练场', '先选训练项目,再选你的队伍(能量恒满 · 不计时 · R 键重置)');

    const drills: { id: 'free' | 'pass' | 'tackle' | 'special'; label: string; desc: string; color: string }[] = [
      { id: 'free', label: '自由练习', desc: '任意踢球 · 熟悉操控', color: '#3dd5f5' },
      { id: 'pass', label: '连续传球', desc: '连传 6 次不丢球', color: '#3df58a' },
      { id: 'tackle', label: '铲断抢球', desc: '铲下对手 3 次球权', color: '#f5a63d' },
      { id: 'special', label: '必杀射门', desc: '跳跃必杀射正 2 次', color: '#f53d5a' },
    ];
    let picked: 'free' | 'pass' | 'tackle' | 'special' = 'free';

    const pickRow = document.createElement('div');
    pickRow.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;max-width:720px;width:100%;';
    const cards: HTMLDivElement[] = [];
    drills.forEach(d => {
      const card = document.createElement('div');
      card.innerHTML = `<div style="font-size:16px;font-weight:bold;">${d.label}</div>
        <div style="font-size:11px;opacity:.7;margin-top:3px;">${d.desc}</div>`;
      card.style.cssText = `border:3px solid ${d.color};padding:10px 12px;cursor:pointer;background:#00000066;text-align:center;`;
      const mark = () => {
        cards.forEach(c => (c.style.background = '#00000066'));
        card.style.background = `${d.color}44`;
      };
      card.onmouseenter = () => { sfx.ensure(); sfx.menuMove(); };
      card.onclick = () => { sfx.ensure(); sfx.menuOk(); picked = d.id; mark(); };
      cards.push(card);
      pickRow.appendChild(card);
    });
    this.content.appendChild(pickRow);

    this.heading('', '选择你的队伍');
    this.teamGrid(id => {
      // 陪练队随机选一支
      const others = TEAMS.filter(t => t.id !== id);
      const sparring = others[(Math.random() * others.length) | 0];
      this.onStart({
        teamA: id, teamB: sparring.id, aiLevel: 0, goldenGoal: false,
        training: true, trainingDrill: picked, ruleset: 'arcade', weather: 'clear',
      });
    });
    this.mkBack(() => this.showTitle());
  }

  hide() { this.root.style.display = 'none'; }
  show() { this.root.style.display = 'flex'; this.showTitle(); }
}
