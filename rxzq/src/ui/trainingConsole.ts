import { Match } from '../game/match';

// 单人训练场控制台:悬浮面板,提供球复位/充能/换位等快捷操作
export interface TrainingConsoleHandle {
  destroy(): void;
}

export function showTrainingConsole(
  parent: HTMLElement,
  match: Match,
  onBanner: (text: string) => void,
): TrainingConsoleHandle {
  const root = document.createElement('div');
  root.dataset.testid = 'training-console';
  root.style.cssText = `position:absolute;right:10px;top:calc(env(safe-area-inset-top,0px) + 120px);z-index:20;
    background:#0d1428e6;border:2px solid #3dd5f5;padding:10px 12px;color:#fff;
    font-family:"Courier New","SimHei",monospace;min-width:150px;user-select:none;`;
  const title = document.createElement('div');
  title.textContent = '⚙ 控制台';
  title.style.cssText = 'font-size:13px;color:#3dd5f5;letter-spacing:2px;margin-bottom:8px;text-align:center;';
  root.appendChild(title);

  const mkBtn = (label: string, cb: () => void) => {
    const b = document.createElement('div');
    b.textContent = label;
    b.style.cssText = `padding:6px 10px;margin:5px 0;font-size:12px;cursor:pointer;text-align:center;
      border:1px solid #3a5ac8;background:#d83a2a22;color:#fff;letter-spacing:1px;`;
    b.onmouseenter = () => (b.style.background = '#d83a2a66');
    b.onmouseleave = () => (b.style.background = '#d83a2a22');
    b.onclick = () => cb();
    root.appendChild(b);
    return b;
  };

  mkBtn('球复位(脚下)', () => {
    const p = match.getControlled(match.humanTeam);
    match.ball.reset(p.x + p.faceX * 1.5, p.z + p.faceZ * 1.5);
    match.ball.owner = p;
    onBanner('球已复位');
  });
  mkBtn('回中圈', () => {
    match.ball.reset(0, 0);
    match.ball.owner = null;
    onBanner('球回到中圈');
  });
  mkBtn('能量充满', () => {
    match.energy[match.humanTeam] = 100;
    onBanner('能量已充满');
  });
  mkBtn('体力恢复', () => {
    const p = match.getControlled(match.humanTeam);
    for (const q of match.teamPlayers(match.humanTeam)) q.stamina = 100;
    void p;
    onBanner('体力已恢复');
  });
  mkBtn('切换门将/中场', () => {
    // 仅单人训练场允许体验另一位置的固定操控
    const cur = match.controlledIdx[match.humanTeam];
    match.controlledIdx[match.humanTeam] = cur === 0 ? 3 : 0;
    const nowKeeper = match.controlledIdx[match.humanTeam] === 0;
    const k = match.getControlled(match.humanTeam);
    if (nowKeeper) { k.x = -match.attackDir(match.humanTeam) * 51.5; k.z = 0; }
    onBanner(nowKeeper ? '已切至门将位' : '已切至中场核心');
  });

  // NPC 冻结开关:冻结后其余球员原地静止(练球/摆人墙)
  const freezeBtn = mkBtn('冻结NPC', () => {
    match.soloNpcFrozen = !match.soloNpcFrozen;
    freezeBtn.textContent = match.soloNpcFrozen ? '解冻NPC' : '冻结NPC';
    freezeBtn.style.borderColor = match.soloNpcFrozen ? '#f5a63d' : '#3a5ac8';
    onBanner(match.soloNpcFrozen ? 'NPC 已冻结' : 'NPC 已解冻');
  });

  // NPC 上场/清场:把对手拉到场上当陪练,或全部移出场外
  let npcsOn = false;
  mkBtn('NPC上场陪练', () => {
    const human = match.getControlled(match.humanTeam);
    if (!npcsOn) {
      // 拉三名对手进场:一持球近距、两名中距离站位
      const opps = match.teamPlayers(1 - match.humanTeam).filter(q => !q.isKeeper);
      opps.forEach((q, i) => {
        q.x = human.x + (i === 0 ? 6 : -8 - i * 4);
        q.z = human.z + (i === 0 ? 3 : (i === 1 ? -7 : 7));
        q.vx = q.vz = 0;
        q.setState('idle');
      });
      if (opps.length) {
        match.ball.reset(opps[0].x + opps[0].faceX * 1.2, opps[0].z);
        match.ball.owner = opps[0];
        match.ball.lastTeam = 1 - match.humanTeam;
      }
      onBanner('陪练已上场');
    } else {
      match.soloReset();
      onBanner('已清场,球回脚下');
    }
    npcsOn = !npcsOn;
  });

  parent.appendChild(root);
  return { destroy() { root.remove(); } };
}
