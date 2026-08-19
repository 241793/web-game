import { Match } from '../game/match';

// 终场数据统计面板,展示数秒后回调关闭
export interface StatsPanelHandle {
  dismiss(): void;
}

export function showStatsPanel(parent: HTMLElement, m: Match, onClose: () => void): StatsPanelHandle {
  const root = document.createElement('div');
  root.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(4,8,18,.82);color:#fff;font-family:"Courier New","SimHei",monospace;z-index:30;`;

  const [sa, sb] = m.stats;
  const poss = sa.possession + sb.possession || 1;
  const pa = Math.round(sa.possession / poss * 100), pb = 100 - pa;
  const [g0, g1] = m.score;
  const winner = m.winner();
  const localTeam = m.humanTeam >= 0 ? m.humanTeam : 0;
  const win = winner === localTeam;
  const result = win ? '胜利!' : winner >= 0 ? '败北…' : '平局';

  const row = (label: string, va: number | string, vb: number | string) => `
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;font-size:15px;line-height:2;">
      <span style="text-align:right;color:#ffd76a;">${va}</span>
      <span style="opacity:.65;min-width:120px;text-align:center;">${label}</span>
      <span style="text-align:left;color:#7ec8ff;">${vb}</span>
    </div>`;

  const box = document.createElement('div');
  box.style.cssText = `border:3px solid #f5d33d;background:#0d1428ee;padding:26px 40px;text-align:center;
    box-shadow:0 0 40px #000;max-width:min(92vw,560px);`;
  box.innerHTML = `
    <div style="font-size:26px;font-weight:bold;letter-spacing:4px;color:${win ? '#f5d33d' : winner >= 0 ? '#8899aa' : '#3dd5f5'};
      text-shadow:2px 2px 0 #000;margin-bottom:4px;">${result}</div>
    <div style="font-size:20px;margin-bottom:14px;">
      ${m.teams[0].name} <b style="font-size:28px;color:#f5d33d;">${g0} - ${g1}</b> ${m.teams[1].name}
      ${m.shootoutWinner >= 0 && m.shootout ? `<div style="font-size:13px;opacity:.75;">点球 ${m.shootout.scores[0]} - ${m.shootout.scores[1]}</div>` : ''}</div>
    <div style="border-top:1px solid #334;padding-top:10px;">
      ${row('控球率', pa + '%', pb + '%')}
      ${row('射门 (射正)', `${sa.shots} (${sa.onTarget})`, `${sb.shots} (${sb.onTarget})`)}
      ${row('传球 (成功/尝试)', `${sa.passCompleted}/${sa.passAttempts}`, `${sb.passCompleted}/${sb.passAttempts}`)}
      ${row('拦截', sa.interceptions, sb.interceptions)}
      ${row('铲球 (成功/尝试)', `${sa.tackles}/${sa.tackleAttempts}`, `${sb.tackles}/${sb.tackleAttempts}`)}
      ${m.ruleset === 'classic' ? row('犯规 / 越位', `${sa.fouls} / ${sa.offsides}`, `${sb.fouls} / ${sb.offsides}`) : ''}
      ${row('击中门框', sa.woodwork, sb.woodwork)}
      ${row('必杀射门', sa.specials, sb.specials)}
      ${row('门将扑救', sa.saves, sb.saves)}
    </div>
    <div style="margin-top:16px;font-size:13px;opacity:.6;">点击任意处继续</div>`;
  root.appendChild(box);
  parent.appendChild(root);

  let closed = false;
  let notify = true;
  let timer = 0;
  const close = () => {
    if (closed) return;
    closed = true;
    window.clearTimeout(timer);
    root.remove();
    if (notify) onClose();
  };
  root.addEventListener('click', close);
  timer = window.setTimeout(close, 9000);
  return {
    dismiss() {
      notify = false;
      close();
    },
  };
}
