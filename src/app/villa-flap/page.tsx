'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VillaFlapGame = dynamic(() => import('./VillaFlapGame'), { ssr: false });

export default function VillaFlapPage() {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [isDead, setIsDead] = useState(false);

  const handleEvent = useCallback((e: any) => {
    if (e.type === 'score') { setScore(e.score); setCoins(e.coins); }
    if (e.type === 'died') { setScore(e.score); setCoins(e.coins); setIsDead(true); }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#1a0512', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: '#670E36', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 12px', color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 0 2 2h16v4z"/><path d="M22 12H18a2 2 0 0 0 0 4h4"/>
          </svg>
          <span>{coins + 200}</span>
        </button>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>🥽 McGinn Goggles</div>
        <button onClick={() => router.push('/client/aston_villa')} style={{
          background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '6px 10px', cursor: 'pointer', color: '#ffffff80', fontSize: 12,
        }}>✕</button>
      </div>

      <VillaFlapGame key={gameKey} onEvent={handleEvent} />

      {/* Death overlay */}
      {isDead && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>🥽</div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 26, margin: '0 0 4px' }}>Game Over!</h2>
          <p style={{ color: '#ffffff60', fontSize: 14, marginBottom: 24 }}>
            Score: <strong style={{ color: '#FFD700' }}>{score}</strong> · Coins: <strong style={{ color: '#95BFE5' }}>{coins}</strong>
          </p>
          <button onClick={() => { setIsDead(false); setScore(0); setCoins(0); setGameKey(k => k + 1); }}
            style={{
              background: '#670E36', border: '2px solid #95BFE5', borderRadius: 26,
              color: '#fff', fontSize: 16, fontWeight: 800, padding: '14px 36px', cursor: 'pointer', marginBottom: 12,
            }}>
            🔄 Try Again
          </button>
          <button onClick={() => router.push('/client/aston_villa')} style={{
            background: 'transparent', border: 'none', color: '#ffffff50', fontSize: 13, cursor: 'pointer',
          }}>
            ← Back to Villa Hub
          </button>
        </div>
      )}
    </div>
  );
}
