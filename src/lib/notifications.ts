import { getStreak } from './streak';

const PERM_KEY = 'notif_asked';

const DAILY_TIMES = [
  { slotId: 'morning', hour: 8,  minute: 15 },
  { slotId: 'midday',  hour: 12, minute: 0  },
  { slotId: 'evening', hour: 19, minute: 0  },
];

/** ms until the next occurrence of a given HH:MM local time */
function msUntilNext(hour: number, minute: number): number {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
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
 * Schedule daily notifications at 8:15, 12:00 and 19:00 via the Service Worker.
 * Safe to call on every app load — the SW debounces per slot.
 */
export async function scheduleDailyNotifications(clubName: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const reg = await registerSW();
  if (!reg?.active) return;

  const streak = getStreak();
  for (const { slotId, hour, minute } of DAILY_TIMES) {
    reg.active.postMessage({
      type: 'SCHEDULE_DAILY',
      slotId,
      msUntilNext: msUntilNext(hour, minute),
      streakCount: streak,
      clubName,
    });
  }
}

/** Fire a test notification in ~2 seconds. */
export async function triggerTestNotification(clubName: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const reg = await registerSW();
  if (!reg?.active) return;

  reg.active.postMessage({
    type: 'TEST_NOTIFICATION',
    streakCount: getStreak(),
    clubName,
  });
}

// Keep old singular export for any callers not yet updated
export const scheduleDailyNotification = scheduleDailyNotifications;
