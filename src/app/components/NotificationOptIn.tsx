'use client';

import { useState, useEffect } from 'react';
import {
  notificationPermission,
  hasBeenAsked,
  requestNotificationPermission,
  scheduleDailyNotification,
} from '@/lib/notifications';

interface Props {
  clubName: string;
  primary: string;
}

export default function NotificationOptIn({ clubName, primary }: Props) {
  const [visible, setVisible] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const perm = notificationPermission();
    if (perm === 'unsupported') return;
    if (perm === 'granted') {
      setGranted(true);
      scheduleDailyNotification(clubName);
      return;
    }
    // Show prompt if not yet asked
    if (!hasBeenAsked()) setVisible(true);
  }, [clubName]);

  const handleEnable = async () => {
    const ok = await requestNotificationPermission();
    setVisible(false);
    if (ok) {
      setGranted(true);
      scheduleDailyNotification(clubName);
    }
  };

  if (granted || !visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 90,
      background: '#111118', border: `1px solid ${primary}44`,
      borderRadius: 18, padding: '16px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', gap: 14, alignItems: 'center',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: primary + '22', border: `2px solid ${primary}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>🔥</div>

      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 2px' }}>
          Daily streak reminder
        </p>
        <p style={{ color: '#ffffff55', fontSize: 11, margin: 0 }}>
          Get a nudge at 8:15 AM so you never miss a day
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={handleEnable}
          style={{
            background: primary, border: 'none', borderRadius: 10,
            padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Enable
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent', border: 'none',
            color: '#ffffff33', fontSize: 11, cursor: 'pointer', padding: 0,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
