// Fan Games Service Worker
// Handles push notifications and caching

const CACHE_NAME = 'fan-games-v1';

// ── Install & activate ──────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Push event (server-sent push) ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fan Games', {
      body: data.body || "Your streak is waiting! Tap to play today's game.",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'fan-games-daily',
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'play', title: '▶ Play Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    })
  );
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ── Scheduled local notification (message from page) ────────────────────────
// The page sends { type: 'SCHEDULE_DAILY', msUntilNext, streakCount, clubName }
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'SCHEDULE_DAILY') return;
  const { msUntilNext, streakCount, clubName } = event.data;

  // Clear any existing timer
  if (self._dailyTimer) clearTimeout(self._dailyTimer);

  const fire = () => {
    const streak = streakCount || 1;
    const club   = clubName || 'your club';
    self.registration.showNotification('🔥 Keep your streak alive!', {
      body: `${streak} day streak on ${club} — tap to play before midnight.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'fan-games-daily',
      renotify: true,
      data: { url: '/' },
      actions: [
        { action: 'play', title: '▶ Play Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    });
    // Re-schedule for next day
    self._dailyTimer = setTimeout(fire, 24 * 60 * 60 * 1000);
  };

  self._dailyTimer = setTimeout(fire, msUntilNext);
});
