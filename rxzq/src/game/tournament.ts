import { TEAMS, teamById, teamStrength } from '../core/teams';

// 锦标赛:8 队单败淘汰(1/4 决赛 → 半决赛 → 决赛)
// 玩家场次亲自打,其余场次按实力模拟
export interface TourMatch {
  a: string; b: string;
  scoreA?: number; scoreB?: number;
  shootoutA?: number; shootoutB?: number;
  winner?: string;
}
export interface TournamentState {
  playerTeam: string;
  round: number;            // 0=1/4决赛 1=半决赛 2=决赛 3=已结束
  bracket: TourMatch[][];   // bracket[round] = 该轮对阵
  eliminated: boolean;      // 玩家是否已被淘汰(淘汰后可观战模拟)
  champion?: string;
}

const KEY = 'nekketsu_tournament_v1';
const validTeam = (id: unknown): id is string => typeof id === 'string' && TEAMS.some(t => t.id === id);

export const ROUND_NAMES = ['四分之一决赛', '半决赛', '决赛'];

export function loadTournament(): TournamentState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<TournamentState>;
    if (!validTeam(s.playerTeam) || !Number.isInteger(s.round) || s.round! < 0 || s.round! > 3) return null;
    if (typeof s.eliminated !== 'boolean' || !Array.isArray(s.bracket)) return null;
    if (s.bracket.length < 1 || s.bracket.length > 3 || (s.round! < 3 && !Array.isArray(s.bracket[s.round!]))) return null;
    for (let roundIdx = 0; roundIdx < s.bracket.length; roundIdx++) {
      const round = s.bracket[roundIdx];
      if (!Array.isArray(round) || round.length !== 4 >> roundIdx) return null;
      for (const mt of round) {
        if (!mt || !validTeam(mt.a) || !validTeam(mt.b) || mt.a === mt.b) return null;
        const hasScore = mt.scoreA !== undefined || mt.scoreB !== undefined;
        if (hasScore && (!Number.isInteger(mt.scoreA) || !Number.isInteger(mt.scoreB))) return null;
        if (mt.winner !== undefined && mt.winner !== mt.a && mt.winner !== mt.b) return null;
        const hasShootout = mt.shootoutA !== undefined || mt.shootoutB !== undefined;
        if (hasShootout && (!Number.isInteger(mt.shootoutA) || !Number.isInteger(mt.shootoutB))) return null;
      }
    }
    if (s.champion !== undefined && !validTeam(s.champion)) return null;
    return s as TournamentState;
  } catch { return null; }
}
export function saveTournament(s: TournamentState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 存储不可用时继续游戏 */ }
}
export function clearTournament() {
  try { localStorage.removeItem(KEY); } catch { /* 存储不可用时继续游戏 */ }
}

export function newTournament(playerTeam: string): TournamentState {
  // 8 队随机抽签(玩家一定在列)
  const ids = TEAMS.map(t => t.id).filter(id => id !== playerTeam);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const eight = [playerTeam, ...ids.slice(0, 7)];
  // 再打乱一次决定对阵位置
  for (let i = eight.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [eight[i], eight[j]] = [eight[j], eight[i]];
  }
  const quarter: TourMatch[] = [];
  for (let i = 0; i < 8; i += 2) quarter.push({ a: eight[i], b: eight[i + 1] });
  const s: TournamentState = { playerTeam, round: 0, bracket: [quarter], eliminated: false };
  saveTournament(s);
  return s;
}

// 模拟一场 AI 对 AI 的比分(实力差 + 随机)
export function simulateScore(aId: string, bId: string): [number, number] {
  const sa = teamStrength(teamById(aId)), sb = teamStrength(teamById(bId));
  const diffAdv = (sa - sb) * 0.35;
  const base = Math.random() * 2;
  let ga = Math.max(0, Math.round(base + diffAdv + (Math.random() - 0.4) * 2));
  let gb = Math.max(0, Math.round(base - diffAdv + (Math.random() - 0.4) * 2));
  // 淘汰赛不允许平局:随机加时定胜负
  if (ga === gb) { if (Math.random() < 0.5 + (sa - sb) * 0.05) ga++; else gb++; }
  return [Math.min(ga, 9), Math.min(gb, 9)];
}

// 找到玩家当前轮的比赛(未打)
export function playerMatch(s: TournamentState): TourMatch | null {
  if (s.round >= 3 || s.eliminated) return null;
  const round = s.bracket[s.round];
  return round.find(mt => (mt.a === s.playerTeam || mt.b === s.playerTeam) && mt.scoreA === undefined) ?? null;
}

// 玩家场次结束后调用:填入比分、模拟其余场次、推进轮次
export interface PlayerMatchResult {
  score: [number, number];
  winner: 0 | 1;
  shootout?: [number, number];
}

export function advance(s: TournamentState, playerResult?: PlayerMatchResult) {
  const round = s.bracket[s.round];
  for (const mt of round) {
    if (mt.scoreA !== undefined) continue;
    const isPlayerMatch = mt.a === s.playerTeam || mt.b === s.playerTeam;
    if (isPlayerMatch && playerResult && !s.eliminated) {
      const playerIsA = mt.a === s.playerTeam;
      mt.scoreA = playerIsA ? playerResult.score[0] : playerResult.score[1];
      mt.scoreB = playerIsA ? playerResult.score[1] : playerResult.score[0];
      mt.winner = playerResult.winner === 0 ? s.playerTeam : (playerIsA ? mt.b : mt.a);
      if (playerResult.shootout) {
        mt.shootoutA = playerIsA ? playerResult.shootout[0] : playerResult.shootout[1];
        mt.shootoutB = playerIsA ? playerResult.shootout[1] : playerResult.shootout[0];
      }
      if (mt.winner !== s.playerTeam) s.eliminated = true;
    } else {
      [mt.scoreA, mt.scoreB] = simulateScore(mt.a, mt.b);
      mt.winner = mt.scoreA > mt.scoreB ? mt.a : mt.b;
    }
  }
  // 产生下一轮
  const winners = round.map(mt => mt.winner ?? (mt.scoreA! > mt.scoreB! ? mt.a : mt.b));
  if (s.round === 2) {
    s.champion = winners[0];
    s.round = 3;
  } else {
    const next: TourMatch[] = [];
    for (let i = 0; i < winners.length; i += 2) next.push({ a: winners[i], b: winners[i + 1] });
    s.bracket.push(next);
    s.round++;
  }
  saveTournament(s);
}
