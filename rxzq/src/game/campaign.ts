import { TEAMS } from '../core/teams';

// 征战之路:选一队后按顺序挑战其余各队,难度递增,进度存 localStorage
export interface CampaignState {
  teamId: string;
  stage: number;        // 当前关卡(0 起)
  wins: number;
  losses: number;
}

const KEY = 'nekketsu_campaign_v1';

export function loadCampaign(): CampaignState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<CampaignState>;
    if (!TEAMS.some(t => t.id === s.teamId)) return null;
    if (![s.stage, s.wins, s.losses].every(Number.isInteger)) return null;
    if (s.stage! < 0 || s.stage! > TEAMS.length - 1 || s.wins! < 0 || s.losses! < 0) return null;
    return s as CampaignState;
  } catch { return null; }
}

export function saveCampaign(s: CampaignState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 存储不可用时继续游戏 */ }
}

export function clearCampaign() {
  try { localStorage.removeItem(KEY); } catch { /* 存储不可用时继续游戏 */ }
}

export function newCampaign(teamId: string): CampaignState {
  const s = { teamId, stage: 0, wins: 0, losses: 0 };
  saveCampaign(s);
  return s;
}

// 对手序列:除玩家队伍外的所有队
export function opponents(s: CampaignState) {
  return TEAMS.filter(t => t.id !== s.teamId);
}

export function currentOpponent(s: CampaignState) {
  const list = opponents(s);
  return s.stage < list.length ? list[s.stage] : null;
}

export function totalStages(s: CampaignState) {
  return opponents(s).length;
}

// 关卡难度:前2关容易,中间普通,最后2关困难
export function stageDifficulty(s: CampaignState): 0 | 1 | 2 {
  const total = totalStages(s);
  if (s.stage < 2) return 0;
  if (s.stage >= total - 2) return 2;
  return 1;
}
