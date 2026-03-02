// Fan Games Service Worker
// Handles push notifications and scheduled local notifications

// Per-slot timer handles (keyed by slotId)
self._timers = {};

// ── Install & activate ──────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ── Push event (server-sent push) ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fan Games', {
      body: data.body || "Your streak is waiting! Tap to play today's game.",
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-96.svg',
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

// ── Scheduled local notifications (messages from page) ─────────────────────
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  // SCHEDULE_DAILY: { type, slotId, msUntilNext, streakCount, clubName }
  if (type === 'SCHEDULE_DAILY') {
    const { slotId, msUntilNext, streakCount, clubName } = event.data;

    // Clear existing timer for this slot
    if (self._timers[slotId]) clearTimeout(self._timers[slotId]);

    const fire = () => {
      const streak = streakCount || 1;
      const club   = clubName || 'your club';
      self.registration.showNotification('🔥 Keep your streak alive!', {
        body: `${streak} day streak on ${club} — tap to play before midnight.`,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-96.svg',
        tag: `fan-games-${slotId}`,
        renotify: true,
        data: { url: '/' },
        actions: [
          { action: 'play', title: '▶ Play Now' },
          { action: 'dismiss', title: 'Later' },
        ],
      });
      // Re-schedule for the same time tomorrow
      self._timers[slotId] = setTimeout(fire, 24 * 60 * 60 * 1000);
    };

    self._timers[slotId] = setTimeout(fire, msUntilNext);
    return;
  }

  // TEST_NOTIFICATION: fires in 2 seconds so the user can see it immediately
  if (type === 'TEST_NOTIFICATION') {
    const { streakCount, clubName } = event.data;
    setTimeout(() => {
      const streak = streakCount || 1;
      const club   = clubName || 'Fan Games';
      self.registration.showNotification('🔥 Keep your streak alive!', {
        body: `${streak} day streak on ${club} — tap to play before midnight.`,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-96.svg',
        tag: 'fan-games-test',
        renotify: true,
        data: { url: '/' },
        actions: [
          { action: 'play', title: '▶ Play Now' },
          { action: 'dismiss', title: 'Later' },
        ],
      });
    }, 2000);
  }
});
