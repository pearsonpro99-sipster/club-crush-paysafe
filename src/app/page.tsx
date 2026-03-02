'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MockUser, getUser } from '@/lib/auth';
import AuthModal from '@/app/components/AuthModal';

const CLIENTS = [
  { id: 'arsenal',     name: 'Arsenal FC',    emoji: '🔴', primary: '#EF0107', games: 2 },
  { id: 'aston_villa', name: 'Aston Villa',   emoji: '🟣', primary: '#670E36', games: 2 },
  { id: 'tiny_moves',  name: 'Tiny Moves RC', emoji: '🏃', primary: '#4FC3F7', games: 3 },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser]         = useState<MockUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Sticky header */}
      <div style={{
        background: '#111118', borderBottom: '1px solid #ffffff10',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Wallet */}
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff10', border: '1px solid #ffffff15', borderRadius: 20, padding: '6px 12px', color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 0 2 2h16v4z"/><path d="M22 12H18a2 2 0 0 0 0 4h4"/></svg>
          <span>🪙 200</span>
        </button>

        {/* Logo */}
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>
          DIZPLAI<span style={{ color: '#EF0107' }}>.</span>
        </div>

        {/* Account button */}
        <button
          onClick={() => setShowAuth(true)}
          style={{
            background: user ? '#0072CE' : '#ffffff10',
            border: '1px solid #ffffff15', borderRadius: 20,
            padding: user ? '6px 12px' : '6px 10px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}
        >
          {user ? (
            <>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name.split(' ')[0]}</span>
            </>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '24px 16px 16px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 6px' }}>Second Screen · Fan Games</p>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>Select Your Club</h1>
        <p style={{ color: '#ffffff40', fontSize: 12, margin: '0 0 16px' }}>Earn points. Climb the leaderboard. Win prizes.</p>
        <button onClick={() => router.push('/leaderboard')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#FFD70015', border: '1px solid #FFD70030',
          borderRadius: 20, padding: '6px 14px',
          color: '#FFD700', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          🏆 Fan Leaderboard →
        </button>
      </div>

      {/* Club list */}
      <div style={{ padding: '8px 12px 32px' }}>
        {CLIENTS.map(client => (
          <button key={client.id} onClick={() => router.push(`/client/${client.id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, background: '#111118', border: '1px solid #ffffff08', borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: client.primary + '22', border: `2px solid ${client.primary}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{client.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{client.name}</div>
              <div style={{ color: '#ffffff40', fontSize: 11, marginTop: 2 }}>{`🎮 ${client.games} game${client.games === 1 ? '' : 's'} available`}</div>
            </div>
            {client.games >= 2 && <span style={{ background: client.primary + '33', color: client.primary, fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '3px 7px', borderRadius: 6, textTransform: 'uppercase' as const }}>NEW</span>}
            <span style={{ color: '#ffffff30', fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '0 0 24px', color: '#ffffff20', fontSize: 10, letterSpacing: 1 }}>DIZPLAI INNOVATION LAB · POC BUILD</div>

      {showAuth && (
        <AuthModal
          user={user}
          onClose={() => setShowAuth(false)}
          onAuthChange={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}
    </div>
  );
}
