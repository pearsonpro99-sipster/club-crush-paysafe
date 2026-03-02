'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MockUser, initAuth } from '@/lib/auth';
import AuthModal from '@/app/components/AuthModal';
import CoinShopModal from '@/app/game/CoinShopModal';
import { getCoins } from '@/lib/coins';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser]             = useState<MockUser | null>(null);
  const [showAuth, setShowAuth]     = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [coins, setCoins]           = useState(0);

  useEffect(() => {
    initAuth().then(setUser);
    setCoins(getCoins());
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#220C2D', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* Sticky header */}
      <div style={{
        background: '#1a0a22', borderBottom: '1px solid #8E11FF30',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Coins */}
        <button
          onClick={() => setShowCoinShop(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#8E11FF20', border: '1px solid #8E11FF40',
            borderRadius: 20, padding: '6px 12px',
            color: '#DFF86C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          🪙 {coins}
        </button>

        {/* Logo */}
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>
          volley<span style={{ color: '#C385F9', fontStyle: 'italic' }}>verse</span>
        </div>

        {/* Account button */}
        <button
          onClick={() => setShowAuth(true)}
          style={{
            background: user ? '#8E11FF80' : '#ffffff10',
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
      <div style={{ padding: '32px 16px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏐</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
          volley<span style={{ color: '#C385F9', fontStyle: 'italic' }}>verse</span>
        </h1>
        <p style={{ color: '#ffffff55', fontSize: 13, margin: '0 0 6px' }}>Fan Games · The Volleyball Universe</p>
        <p style={{ color: '#ffffff33', fontSize: 11, margin: '0 0 20px' }}>Play. Score. Climb the leaderboard.</p>
        <button onClick={() => router.push('/leaderboard')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#DFF86C15', border: '1px solid #DFF86C30',
          borderRadius: 20, padding: '6px 16px',
          color: '#DFF86C', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          🏆 Fan Leaderboard →
        </button>
      </div>

      {/* Enter Hub card */}
      <div style={{ padding: '8px 16px 32px' }}>
        <button
          onClick={() => router.push('/client/volleyverse')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 16,
            background: 'linear-gradient(135deg, #8E11FF20 0%, #630CB320 100%)',
            border: '2px solid #8E11FF50',
            borderRadius: 20, padding: '20px 20px',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: '#8E11FF30', border: '2px solid #8E11FF80',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🏐</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 18, marginBottom: 4 }}>VolleyVerse Hub</div>
            <div style={{ color: '#C385F9', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>3 games available</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['MATCH-3', 'FLAPPER', 'SERVE'].map(g => (
                <span key={g} style={{
                  background: '#8E11FF33', color: '#C385F9',
                  fontSize: 8, fontWeight: 800, letterSpacing: 1.5,
                  padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
                }}>{g}</span>
              ))}
            </div>
          </div>
          <span style={{ color: '#8E11FF80', fontSize: 24 }}>›</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '0 0 24px', color: '#ffffff15', fontSize: 10, letterSpacing: 2 }}>
        VOLLEYVERSE · FAN GAMES PLATFORM
      </div>

      {showCoinShop && (
        <CoinShopModal onClose={() => setShowCoinShop(false)} clientId="volleyverse" returnPath="/" />
      )}
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
