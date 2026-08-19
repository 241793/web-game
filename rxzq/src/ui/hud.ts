import { Match } from '../game/match';
import * as C from '../core/constants';

// 中国风比赛 HUD:比分牌、气势槽、体力/战术、天气与训练目标。
export class Hud {
  root: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private timeEl: HTMLDivElement;
  private energyBars: HTMLDivElement[] = [];
  private comboEls: HTMLSpanElement[] = [];
  private windEl: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private staminaBar: HTMLDivElement;
  private bannerEl: HTMLDivElement;
  private drillEl: HTMLDivElement;
  private drillLabelEl: HTMLDivElement;
  private drillBar: HTMLDivElement;
  private drillBarInner: HTMLDivElement;
  private bannerT = 0;

  constructor(parent: HTMLElement, private match: Match) {
    this.root = document.createElement('div');
    this.root.dataset.testid = 'match-hud';
    this.root.style.cssText = 'position:absolute;inset:0;pointer-events:none;color:#f8f0dc;font-family:"STKaiti","KaiTi","Noto Serif SC",serif;';
    const style = document.createElement('style');
    style.textContent = `
      @keyframes hudSeal { 0% { transform:translate(-50%,-50%) scale(1.34);opacity:0;filter:blur(3px); } 18% { transform:translate(-50%,-50%) scale(.96);opacity:1;filter:blur(0); } 26% { transform:translate(-50%,-50%) scale(1); } }
      .hud-ink-panel { background:linear-gradient(135deg,rgba(18,15,13,.92),rgba(49,24,18,.83));border:1px solid #d4ad5b;box-shadow:0 5px 24px #0009,inset 0 0 0 1px #f4d88b22;backdrop-filter:blur(7px); }
      .hud-team { position:absolute;top:14px;width:clamp(130px,21vw,228px);padding:8px 11px 9px; }
      .hud-team::after { content:"";position:absolute;bottom:-5px;width:34px;height:9px;background:#a62e25;border:1px solid #d4ad5b;transform:skewX(-28deg); }
      .hud-team-left { left:14px;border-radius:2px 12px 2px 2px; }
      .hud-team-left::after { left:12px; }
      .hud-team-right { right:14px;border-radius:12px 2px 2px 2px;text-align:right; }
      .hud-team-right::after { right:12px; }
      .hud-center { position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:5px 18px 7px;min-width:min(390px,45vw);text-align:center;clip-path:polygon(8% 0,92% 0,100% 22%,94% 100%,6% 100%,0 22%); }
      .hud-status { position:absolute;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);min-width:min(430px,64vw);padding:6px 14px 8px;text-align:center;font-size:12px;letter-spacing:1px; }
      .hud-banner { animation:hudSeal .28s cubic-bezier(.2,.9,.28,1.2); }
      @media (max-width: 700px) {
        .hud-center { top:max(5px,env(safe-area-inset-top));min-width:50vw;padding:4px 8px 5px; }
        .hud-team { top:max(58px,calc(env(safe-area-inset-top) + 54px));width:min(39vw,158px);padding:6px 8px; }
        .hud-team-left { left:max(7px,env(safe-area-inset-left)); }
        .hud-team-right { right:max(7px,env(safe-area-inset-right)); }
        .hud-wind { top:max(105px,calc(env(safe-area-inset-top) + 101px)) !important;max-width:78vw; }
        .hud-drill { top:max(127px,calc(env(safe-area-inset-top) + 123px)) !important; }
        .hud-status { min-width:min(54vw,310px);font-size:10px;bottom:max(5px,env(safe-area-inset-bottom));padding:4px 8px 6px; }
      }
      @media (max-height: 500px) and (orientation:landscape) {
        .hud-team { top:max(7px,env(safe-area-inset-top));width:min(18vw,150px); }
        .hud-team-left { left:max(58px,calc(env(safe-area-inset-left) + 54px)); }
        .hud-center { min-width:38vw; }
        .hud-wind { top:max(52px,calc(env(safe-area-inset-top) + 46px)) !important; }
        .hud-drill { top:max(70px,calc(env(safe-area-inset-top) + 64px)) !important; }
        .hud-status { bottom:max(4px,env(safe-area-inset-bottom)); }
      }
      @media (prefers-reduced-motion:reduce) { .hud-banner { animation:none; } }
    `;
    this.root.appendChild(style);
    parent.appendChild(this.root);

    const center = document.createElement('div');
    center.className = 'hud-center hud-ink-panel';
    this.root.appendChild(center);
    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = 'font-size:clamp(17px,3.2vw,28px);font-weight:800;color:#f4d88b;text-shadow:0 2px 0 #000;letter-spacing:2px;white-space:nowrap;';
    center.appendChild(this.scoreEl);
    this.timeEl = document.createElement('div');
    this.timeEl.style.cssText = 'font-size:clamp(11px,1.8vw,14px);color:#e9dfc9;letter-spacing:2px;margin-top:1px;';
    center.appendChild(this.timeEl);

    for (let team = 0; team < 2; team++) {
      const panel = document.createElement('div');
      panel.className = `hud-team hud-team-${team === 0 ? 'left' : 'right'} hud-ink-panel`;
      const label = document.createElement('div');
      label.innerHTML = `<b>${this.match.teams[team].name}</b> <span style="opacity:.55;font-size:10px;">气势</span>`;
      label.style.cssText = 'display:flex;justify-content:space-between;gap:8px;font-size:clamp(10px,1.7vw,14px);text-shadow:0 1px 2px #000;margin-bottom:5px;';
      const combo = document.createElement('span');
      combo.style.cssText = 'color:#f2c45f;font-size:10px;min-height:12px;';
      label.appendChild(combo);
      this.comboEls.push(combo);
      panel.appendChild(label);
      const track = document.createElement('div');
      track.style.cssText = 'height:9px;padding:1px;background:#090807;border:1px solid #a98b52;overflow:hidden;';
      const bar = document.createElement('div');
      bar.style.cssText = 'height:100%;width:0;background:linear-gradient(90deg,#8f201c,#ef8d32,#f4d36c);transition:width .14s ease;';
      track.appendChild(bar); panel.appendChild(track);
      this.energyBars.push(bar);
      this.root.appendChild(panel);
    }

    this.windEl = document.createElement('div');
    this.windEl.className = 'hud-wind';
    this.windEl.style.cssText = 'position:absolute;top:67px;left:50%;transform:translateX(-50%);font-size:clamp(10px,1.6vw,13px);text-shadow:0 2px 3px #000;color:#e7dcc6;white-space:nowrap;';
    this.root.appendChild(this.windEl);

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'hud-status hud-ink-panel';
    const staminaTrack = document.createElement('div');
    staminaTrack.style.cssText = 'height:4px;background:#0c0b09;margin-top:4px;border:1px solid #6f5a36;';
    this.staminaBar = document.createElement('div');
    this.staminaBar.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#9e2f26,#d7b45c,#79c796);transition:width .16s;';
    staminaTrack.appendChild(this.staminaBar);
    this.statusEl.appendChild(staminaTrack);
    this.root.appendChild(this.statusEl);

    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'hud-banner';
    this.bannerEl.style.cssText = 'position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);padding:.12em .45em .22em;font-size:clamp(28px,7vw,66px);font-weight:900;text-shadow:0 4px 0 #160d08,0 0 18px #000;display:none;white-space:nowrap;letter-spacing:.16em;border-top:2px solid currentColor;border-bottom:2px solid currentColor;background:linear-gradient(90deg,transparent,#170c08bb 18%,#170c08bb 82%,transparent);';
    this.root.appendChild(this.bannerEl);

    this.drillEl = document.createElement('div');
    this.drillEl.className = 'hud-drill';
    this.drillEl.style.cssText = 'position:absolute;top:88px;left:50%;transform:translateX(-50%);font-size:clamp(11px,1.8vw,14px);text-shadow:0 2px 2px #000;display:none;text-align:center;color:#f4d88b;';
    this.drillLabelEl = document.createElement('div');
    this.drillEl.appendChild(this.drillLabelEl);
    this.drillBar = document.createElement('div');
    this.drillBar.style.cssText = 'width:min(220px,60vw);height:5px;background:#17120e;border:1px solid #a98b52;margin:4px auto 0;display:none;';
    this.drillBarInner = document.createElement('div');
    this.drillBarInner.style.cssText = 'height:100%;width:0;background:linear-gradient(90deg,#a62e25,#e4c46b);';
    this.drillBar.appendChild(this.drillBarInner);
    this.drillEl.appendChild(this.drillBar);
    this.root.appendChild(this.drillEl);
  }

  banner(text: string, color = '#f4d88b', duration = 2) {
    this.bannerEl.textContent = text;
    this.bannerEl.style.color = color;
    this.bannerEl.style.display = 'block';
    // 重新触发入场印章动画。
    this.bannerEl.classList.remove('hud-banner');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('hud-banner');
    this.bannerT = duration;
  }

  update(dt: number) {
    const m = this.match;
    this.scoreEl.textContent = `${m.teams[0].name}  ${m.score[0]} · ${m.score[1]}  ${m.teams[1].name}`;
    const seconds = Math.floor(m.time);
    if (m.phase === 'shootout' && m.shootout) {
      const so = m.shootout;
      const shooterName = m.teams[so.shooterTeam].players[so.shooterIdx].name;
      const role = so.shooterTeam === m.humanTeam ? `${shooterName} 主罚 · ↑↓瞄准 K射门` : '门将扑救 · ↑↓移动';
      this.timeEl.textContent = `点球 ${so.scores[0]} 比 ${so.scores[1]} · ${role}`;
    } else {
      const halfName = m.training ? '演武场' : m.half === 1 ? '上半场' : m.half === 2 ? '下半场' : '金球加时';
      const phaseName = m.phase === 'freekick' ? ' · 任意球' : m.phase === 'corner' ? ' · 角球'
        : m.phase === 'throwin' ? ' · 界外球' : m.phase === 'goalkick' ? ' · 球门球' : '';
      this.timeEl.textContent = m.training
        ? `${halfName} · R 重置`
        : `${halfName}${phaseName}  ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }

    for (let team = 0; team < 2; team++) {
      const energy = m.energy[team];
      this.energyBars[team].style.width = `${energy}%`;
      this.energyBars[team].style.background = energy >= C.ENERGY_MAX - 1
        ? 'linear-gradient(90deg,#f3c857,#fff0a1,#df3f2f)' : 'linear-gradient(90deg,#8f201c,#ef8d32,#f4d36c)';
      this.energyBars[team].style.boxShadow = energy >= C.ENERGY_MAX - 1 ? '0 0 10px #f4d36c' : 'none';
      this.comboEls[team].textContent = m.combo[team] >= 2 ? `连携×${m.combo[team]}` : '';
    }

    const controlled = m.humanTeam >= 0 ? m.getControlled(m.humanTeam) : null;
    if (controlled) {
      const stamina = Math.round(controlled.stamina);
      const lock = m.controlLocked[m.humanTeam] ? '固定位置' : 'E/LB 换人';
      // 文本节点放在体力条前面，避免每帧重建进度条。
      let text = this.statusEl.querySelector('[data-role="status-text"]') as HTMLDivElement | null;
      if (!text) {
        text = document.createElement('div');
        text.dataset.role = 'status-text';
        this.statusEl.insertBefore(text, this.statusEl.firstChild);
      }
      text.textContent = `${controlled.isKeeper ? '门神' : '执掌'} · ${controlled.def.name}　体力 ${stamina}　战术「${m.tacticLabel(m.humanTeam)}」　${lock} · T 战术`;
      this.staminaBar.style.width = `${stamina}%`;
    }

    if (m.training) {
      this.drillEl.style.display = 'block';
      this.drillBar.style.display = m.trainingDrill === 'free' ? 'none' : 'block';
      this.drillLabelEl.textContent = m.drillLabel();
      this.drillLabelEl.style.color = m.drillDone ? '#7fe0a1' : '#f4d88b';
      this.drillBarInner.style.width = `${m.drillFrac() * 100}%`;
    } else {
      this.drillEl.style.display = 'none';
      this.drillBar.style.display = 'none';
    }

    const wind = m.wind;
    const magnitude = Math.hypot(wind.x, wind.z);
    const arrow = Math.abs(wind.x) > Math.abs(wind.z) ? (wind.x > 0 ? '东 →' : '← 西') : (wind.z > 0 ? '南 ↓' : '↑ 北');
    const weather = m.weather === 'rain' ? '雨战' : m.weather === 'snow' ? '雪战' : '晴夜';
    const rules = m.ruleset === 'classic' ? '竞技' : '热血';
    this.windEl.textContent = `${weather} · ${rules}规则 · ${magnitude < 1 ? '无风' : `${arrow} ${magnitude.toFixed(1)}`}`;

    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.bannerEl.style.display = 'none';
    }
  }

  destroy() { this.root.remove(); }
}
