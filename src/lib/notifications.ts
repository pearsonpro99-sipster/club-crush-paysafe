import { getStreak } from './streak';

const PERM_KEY = 'notif_asked';

/** ms until the next 08:15:00 local time */
function msUntilNext0815(): number {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(8, 15, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Register the Service Worker (idempotent). */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

/** Request notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  localStorage.setItem(PERM_KEY, result);
  return result === 'granted';
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function hasBeenAsked(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PERM_KEY);
}

/**
 * Schedule the daily 08:15 notification via the Service Worker.
 * Safe to call on every app load — the SW debounces.
 */
export async function scheduleDailyNotification(clubName: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const reg = await registerSW();
  if (!reg?.active) return;

  reg.active.postMessage({
    type: 'SCHEDULE_DAILY',
    msUntilNext: msUntilNext0815(),
    streakCount: getStreak(),
    clubName,
  });
}
