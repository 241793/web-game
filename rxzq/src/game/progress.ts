import { TEAMS, teamById } from '../core/teams';
import { PlayerDef, TeamDef } from '../core/types';

// 球员成长与招募:经验/等级持久化,按等级放大属性;征战胜利可招募对方球星
// 存档键 = teamId:playerIndex(招募球员另存于 roster)
export interface PlayerProgress {
  xp: number;
  level: number;      // 1~10
}
export interface RecruitEntry {
  fromTeam: string;   // 来源队伍 id
  playerIdx: number;  // 来源队伍中的编号(1~5)
  replaceIdx: number; // 替换我方哪个位置(1~5)
}
export interface ProgressState {
  players: Record<string, PlayerProgress>; // key: teamId:idx
  recruits: Record<string, RecruitEntry[]>; // key: 我方 teamId
}

const KEY = 'nekketsu_progress_v1';
export const MAX_LEVEL = 10;

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { players: {}, recruits: {} };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const players = parsed.players && typeof parsed.players === 'object' && !Array.isArray(parsed.players)
      ? parsed.players : {};
    const recruits = parsed.recruits && typeof parsed.recruits === 'object' && !Array.isArray(parsed.recruits)
      ? parsed.recruits : {};
    const safePlayers: Record<string, PlayerProgress> = {};
    const validPlayerKeys = new Set(TEAMS.flatMap(team => team.players.map((_, idx) => playerKey(team.id, idx))));
    for (const [key, value] of Object.entries(players)) {
      if (!validPlayerKeys.has(key) || !value || !Number.isFinite(value.xp) || !Number.isInteger(value.level)) continue;
      safePlayers[key] = { xp: Math.max(0, value.xp), level: Math.max(1, Math.min(MAX_LEVEL, value.level)) };
    }
    const safeRecruits: Record<string, RecruitEntry[]> = {};
    for (const [teamId, entries] of Object.entries(recruits)) {
      if (!TEAMS.some(t => t.id === teamId) || !Array.isArray(entries)) continue;
      const byPosition = new Map<number, RecruitEntry>();
      for (const r of entries) {
        if (!r || !TEAMS.some(t => t.id === r.fromTeam)
            || !Number.isInteger(r.playerIdx) || r.playerIdx < 1 || r.playerIdx > 5
            || !Number.isInteger(r.replaceIdx) || r.replaceIdx < 1 || r.replaceIdx > 5) continue;
        byPosition.set(r.replaceIdx, r);
      }
      safeRecruits[teamId] = [...byPosition.values()];
    }
    return { players: safePlayers, recruits: safeRecruits };
  } catch { /* 损坏则重置 */ }
  return { players: {}, recruits: {} };
}
export function saveProgress(s: ProgressState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 存储不可用时继续游戏 */ }
}

export function xpForLevel(level: number) { return level * 100; } // 升到 L+1 需 L*100

export function playerKey(teamId: string, idx: number) { return `${teamId}:${idx}`; }

export function getProgress(s: ProgressState, teamId: string, idx: number): PlayerProgress {
  return s.players[playerKey(teamId, idx)] ?? { xp: 0, level: 1 };
}

// 赛后发经验:全队基础 + 进球/胜利加成;返回升级的球员下标列表
export function grantXp(teamId: string, opts: { win: boolean; goals: number; specials: number }): number[] {
  const s = loadProgress();
  const base = 40 + (opts.win ? 40 : 10) + opts.goals * 15 + opts.specials * 10;
  const leveled: number[] = [];
  for (let i = 0; i < 6; i++) {
    const k = playerKey(teamId, i);
    const p = s.players[k] ?? { xp: 0, level: 1 };
    p.xp += base;
    while (p.level < MAX_LEVEL && p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level++;
      leveled.push(i);
    }
    s.players[k] = p;
  }
  saveProgress(s);
  return leveled;
}

// 等级 → 属性倍率(每级 +2.2%,10 级约 +20%)
export function levelScale(level: number) { return 1 + (level - 1) * 0.022; }

// 招募:征战胜利后把对方一名球星编入我方(替换同位置)
export function recruit(myTeam: string, fromTeam: string, playerIdx: number, replaceIdx: number) {
  const s = loadProgress();
  const list = s.recruits[myTeam] ?? [];
  // 同一位置只保留最新招募
  const filtered = list.filter(r => r.replaceIdx !== replaceIdx);
  filtered.push({ fromTeam, playerIdx, replaceIdx });
  s.recruits[myTeam] = filtered;
  saveProgress(s);
}

// 组装实战阵容:应用招募替换 + 等级加成,返回克隆的 TeamDef(不污染原始数据)
export function buildRoster(teamId: string): TeamDef {
  const s = loadProgress();
  const base = teamById(teamId);
  const players: PlayerDef[] = base.players.map(p => ({ ...p }));
  for (const r of s.recruits[teamId] ?? []) {
    const src = teamById(r.fromTeam).players[r.playerIdx];
    if (src) players[r.replaceIdx] = { ...src };
  }
  players.forEach((p, i) => {
    const lv = getProgress(s, teamId, i).level;
    const k = levelScale(lv);
    p.speed *= k; p.power *= k; p.toughness *= k;
  });
  return { ...base, players };
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* 存储不可用时继续游戏 */ }
}
