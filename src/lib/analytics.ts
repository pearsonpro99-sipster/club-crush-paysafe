/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

/** Track a custom event */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  gtag('event', eventName, params);
}

/** Track page view (call on route change) */
export function trackPageView(path: string) {
  gtag('event', 'page_view', { page_path: path });
}

// ── Game-specific helpers ────────────────────────────────────────────────────

export function trackGameStart(gameType: string, clientId: string) {
  trackEvent('game_start', { game_type: gameType, client_id: clientId });
}

export function trackGameEnd(gameType: string, clientId: string, score: number) {
  trackEvent('game_end', { game_type: gameType, client_id: clientId, score });
}

export function trackStreakUpdate(streakDays: number) {
  trackEvent('streak_update', { streak_days: streakDays });
}

export function trackSignUp() {
  trackEvent('sign_up');
}

export function trackLogin() {
  trackEvent('login');
}

export function trackNotificationOptIn() {
  trackEvent('notification_opt_in');
}
