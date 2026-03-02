const STREAK_DATE_KEY  = 'streak_date';
const STREAK_COUNT_KEY = 'streak_count';

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/** Call when a game session starts. Updates the streak and returns the current count. */
export function touchStreak(): number {
  if (typeof window === 'undefined') return 0;

  const lastDate = localStorage.getItem(STREAK_DATE_KEY) || '';
  const count    = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0');
  const t        = today();

  if (lastDate === t) {
    // Already played today — no change
    return count;
  }

  const gap  = lastDate ? daysBetween(lastDate, t) : 999;
  const next = gap === 1 ? count + 1 : 1; // continue or reset

  localStorage.setItem(STREAK_DATE_KEY,  t);
  localStorage.setItem(STREAK_COUNT_KEY, next.toString());
  return next;
}

/** Read the current streak without updating it. */
export function getStreak(): number {
  if (typeof window === 'undefined') return 0;

  const lastDate = localStorage.getItem(STREAK_DATE_KEY) || '';
  const count    = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0');
  const t        = today();

  if (!lastDate) return 0;
  const gap = daysBetween(lastDate, t);
  // Streak broken if last play was more than 1 day ago
  return gap > 1 ? 0 : count;
}
