'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStreak } from '@/lib/streak';
import { getFanScore } from '@/lib/fanScore';
import { getCoins } from '@/lib/coins';
import { MockUser, initAuth } from '@/lib/auth';
import { triggerTestNotification, notificationPermission } from '@/lib/notifications';
import AuthModal from '@/app/components/AuthModal';
import NotificationOptIn from '@/app/components/NotificationOptIn';
import CoinShopModal from '@/app/game/CoinShopModal';

const CLIENT_DATA: Record<string, {
  name: string; primary: string; secondary: string; bg: string;
  emoji: string; tagline: string;
  hasVolleyFlap?: boolean; hasServeAce?: boolean;
}> = {
  volleyverse: {
    name: 'VolleyVerse',
    primary: '#8E11FF',
    secondary: '#C385F9',
    bg: '#220C2D',
    emoji: '🏐',
    tagline: 'The Volleyball Universe',
    hasVolleyFlap: true,
    hasServeAce: true,
  },
};

export default function ClientHubPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const client = CLIENT_DATA[clientId] || { name: clientId, primary: '#8E11FF', secondary: '#C385F9', bg: '#220C2D', emoji: '🏐', tagline: '' };

  const [streak, setStreak]             = useState(0);
  const [fanScore, setFanScore]         = useState(0);
  const [coins, setCoins]               = useState(0);
  const [user, setUser]                 = useState<MockUser | null>(null);
  const [showAuth, setShowAuth]         = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [testFired, setTestFired]       = useState(false);

  useEffect(() => {
    setStreak(getStreak());
    setFanScore(getFanScore(clientId));
    setCoins(getCoins());
    setNotifGranted(notificationPermission() === 'granted');
    initAuth().then(setUser);
  }, [clientId]);

  return (
    <div style={{ minHeight: '100vh', background: client.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ background: client.primary, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setShowCoinShop(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 12px', color: '#DFF86C', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <span>🪙 {coins}</span>
          <span style={{ color: '#DFF86C99', fontSize: 11, fontWeight: 900 }}>＋</span>
        </button>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>{client.emoji} {client.name}</div>
        <button onClick={() => setShowAuth(true)} style={{ background: user ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: user ? '6px 12px' : '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 12, fontWeight: 700 }}>
          {user ? (<><div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>{user.name.charAt(0).toUpperCase()}</div><span>{user.name.split(' ')[0]}</span></>) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>)}
        </button>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: '#ffffff50', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Home</button>
      </div>
      <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{client.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>{client.name}</h1>
        <p style={{ color: '#ffffff50', fontSize: 12, margin: '0 0 10px' }}>{client.tagline}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {streak > 0 && <div style={{ background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.4)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#FF8C00' }}>🔥 {streak} day streak</div>}
          {fanScore > 0 && <div style={{ background: `${client.primary}22`, border: `1px solid ${client.primary}44`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: client.secondary }}>⭐ {fanScore.toLocaleString()} fan pts</div>}
        </div>
      </div>
      <div style={{ padding: '20px 16px 32px' }}>
        <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>Fan Games</p>
        <GameCard title="VolleyVerse Crush" description="Match volleyball tiles in this addictive puzzle game. Earn fan points, beat sets, climb the leaderboard." emoji="🏐" label="MATCH-3" primary={client.primary} onClick={() => router.push(`/game?client=${clientId}`)} />
        {client.hasVolleyFlap && <GameCard title="Volley Flapper" description="Keep the volleyball in play! Dodge the net posts and fly as far as you can." emoji="🏐" label="FLAPPER" primary={client.primary} accent={client.secondary} badge="EXCLUSIVE" onClick={() => router.push('/volley-flapper')} />}
        {client.hasServeAce && <GameCard title="Serve Ace" description="Nail the perfect serve! Time your tap to land an ace and rack up fan points." emoji="🏐" label="SERVE" primary={client.primary} accent="#DFF86C" badge="NEW" onClick={() => router.push('/serve-ace')} />}
        <div onClick={() => router.push('/leaderboard')} style={{ background: `${client.primary}12`, border: `1px solid ${client.primary}30`, borderRadius: 16, padding: '14px 16px', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div><p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>🏆 Fan Leaderboard</p><p style={{ color: '#ffffff44', fontSize: 11, margin: '2px 0 0' }}>See your rank · Monthly prize draws</p></div>
          <span style={{ color: '#ffffff30', fontSize: 22 }}>&rsaquo;</span>
        </div>
      </div>
      {notifGranted && (
        <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
          <button onClick={() => { triggerTestNotification(client.name); setTestFired(true); setTimeout(() => setTestFired(false), 6000); }} style={{ background: 'transparent', border: '1px solid #ffffff15', borderRadius: 20, padding: '6px 16px', color: testFired ? '#DFF86C' : '#ffffff33', fontSize: 11, cursor: 'pointer', transition: 'color 0.3s' }}>
            {testFired ? '🔔 Incoming in ~5s…' : '🔔 Test notification'}
          </button>
        </div>
      )}
      <NotificationOptIn clubName={client.name} primary={client.primary} />
      {showCoinShop && <CoinShopModal onClose={() => setShowCoinShop(false)} clientId={clientId} />}
      {showAuth && <AuthModal user={user} onClose={() => setShowAuth(false)} onAuthChange={(u) => { setUser(u); setShowAuth(false); }} />}
    </div>
  );
}

function GameCard({ title, description, emoji, label, primary, accent, badge, onClick }: { title: string; description: string; emoji: string; label: string; primary: string; accent?: string; badge?: string; onClick: () => void; }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', gap: 14, alignItems: 'flex-start', background: primary + '18', border: `1px solid ${primary}40`, borderRadius: 16, padding: '16px', marginBottom: 10, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: primary + '30', border: `2px solid ${primary}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{title}</span>
          <span style={{ background: accent ? accent + '33' : primary + '33', color: accent || primary, fontSize: 8, fontWeight: 800, letterSpacing: 1.5, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' as const }}>{label}</span>
        </div>
        {badge && <div style={{ background: (accent || primary) + '22', color: accent || primary, fontSize: 8, fontWeight: 800, letterSpacing: 1.5, padding: '2px 8px', borderRadius: 5, display: 'inline-block', textTransform: 'uppercase' as const, marginBottom: 5 }}>{badge}</div>}
        <p style={{ color: '#ffffff60', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      <span style={{ color: '#ffffff30', fontSize: 22, alignSelf: 'center' }}>›</span>
    </button>
  );
}
