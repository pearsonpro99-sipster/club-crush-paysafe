const MAX_ENTRIES = 30;

type ScoreEntry = { game: string; score: number; ts: number };

function storageKey(clubId: string) {
  return `fan_scores_${clubId}`;
}

function loadEntries(clubId: string): ScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(clubId)) || '[]') as ScoreEntry[];
  } catch {
    return [];
  }
}

/** Record a game score for a club. Keeps last MAX_ENTRIES scores. */
export function recordScore(clubId: string, game: string, score: number): void {
  if (typeof window === 'undefined') return;
  const entries = loadEntries(clubId);
  entries.push({ game, score, ts: Date.now() });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  localStorage.setItem(storageKey(clubId), JSON.stringify(entries));
}

/** Total fan score = sum of all recorded scores for a club. */
export function getFanScore(clubId: string): number {
  return loadEntries(clubId).reduce((acc, e) => acc + e.score, 0);
}

/** Score breakdown by game type. */
export function getScoreBreakdown(clubId: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of loadEntries(clubId)) {
    result[e.game] = (result[e.game] || 0) + e.score;
  }
  return result;
}

// ─── Mock leaderboard ────────────────────────────────────────────────────────

const MOCK_NAMES: Record<string, string[]> = {
  arsenal: [
    'GunnerGaz', 'HenryFan1', 'HighburyLad', 'RedArsenal',  'SakaTribe',
    'NorthLondon', 'ArsenalMatt', 'GoaldenBoot', 'ClockEndCrew', 'TopFourBen',
  ],
  aston_villa: [
    'HolteEnder', 'VillaVince', 'McGinnMad', 'Claret&Blue', 'VillanKev',
    'TrinidadVilla', 'VillaSteve', 'DouglasLuiz', 'B6Fan', 'WatkinsMark',
  ],
};

const BASE_SCORES: Record<string, number[]> = {
  arsenal:     [48200, 41500, 36000, 29800, 24100, 19500, 15800, 11200, 7400, 3900],
  aston_villa: [52000, 44000, 37500, 31000, 25500, 20000, 15000, 10500, 6800, 3200],
};

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isYou: boolean;
  emoji: string;
}

const AVATARS = ['🏆','⭐','🔥','💎','🎯','🎮','🏅','👑','🥇','🎖️'];

export function getLeaderboard(clubId: string): LeaderboardEntry[] {
  const yourScore = getFanScore(clubId);
  const names     = MOCK_NAMES[clubId] || MOCK_NAMES.arsenal;
  const bases     = BASE_SCORES[clubId] || BASE_SCORES.arsenal;

  // Build mock list
  const entries: LeaderboardEntry[] = names.map((name, i) => ({
    rank: 0, name, score: bases[i], isYou: false, emoji: AVATARS[i],
  }));

  if (yourScore > 0) {
    entries.push({ rank: 0, name: 'You', score: yourScore, isYou: true, emoji: '🫵' });
  }

  // Sort descending, assign ranks
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}
