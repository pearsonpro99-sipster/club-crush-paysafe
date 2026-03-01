'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FlapperEvent } from '@/lib/game/TinyMovesFlapperScene';

const TinyMovesGame = dynamic(() => import('./TinyMovesGame'), { ssr: false });

export default function TinyMovesPage() {
  const [phase, setPhase] = useState<'game' | 'dead'>('game');
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const sceneRef = useRef<any>(null);

  const handleEvent = useCallback((e: FlapperEvent) => {
    if (e.type === 'score') setLiveScore(e.score);
    if (e.type === 'died') {
      setFinalScore(e.score);
      setBestScore(prev => Math.max(prev, e.score));
      setPhase('dead');
    }
  }, []);

  const restart = () => { setPhase('game'); setLiveScore(0); setGameKey(k => k + 1); };

  const medal = finalScore >= 30 ? '🏆' : finalScore >= 15 ? '🥇' : finalScore >= 5 ? '🏃' : '🍕';
  const title = finalScore >= 30 ? 'Tiny Moves Legend!' : finalScore >= 15 ? 'Great Run!' : finalScore >= 5 ? 'Nice Effort!' : 'Keep Moving!';

  return (
    <div style={{ background: '#0f0a08', minHeight: '100vh' }}>

      {/* Live score overlay */}
      {phase === 'game' && (
        <div style={{
          position: 'fixed', top: 0, right: 0, zIndex: 50,
          padding: '6px 14px', background: 'rgba(0,0,0,0.55)',
          borderBottomLeftRadius: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: '#FF5C35', fontWeight: 'bold', fontSize: 18 }}>{liveScore}</span>
        </div>
      )}

      {phase === 'game' && (
        <TinyMovesGame key={gameKey} onEvent={handleEvent} gameRef={sceneRef} />
      )}

      {phase === 'dead' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a0a05 0%, #0f0a08 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>{medal}</div>
            <h1 style={{ color: '#FF5C35', fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 2 }}>
              {title}
            </h1>
            <p style={{ color: '#ffffff55', fontSize: 13, margin: '4px 0 0' }}>
              Tiny Moves Run Club Dash 🏃
            </p>
          </div>

          {/* Score cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, width: '100%', maxWidth: 320 }}>
            <div style={{ flex: 1, background: '#FF5C35', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>SCORE</p>
              <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{finalScore}</p>
            </div>
            <div style={{ flex: 1, background: '#1a0a05', border: '2px solid #FF1477', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ color: '#FF147788', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>BEST</p>
              <p style={{ color: '#FF1477', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{bestScore}</p>
            </div>
          </div>

          <button
            onClick={restart}
            style={{
              background: '#FF5C35', color: '#fff', border: 'none',
              borderRadius: 14, padding: '16px 0', fontSize: 17,
              fontWeight: 900, cursor: 'pointer', width: '100%',
              maxWidth: 320, marginBottom: 12, letterSpacing: 1,
            }}
          >
            🏃 RUN AGAIN
          </button>

          <button
            onClick={() => window.location.href = '/client/tiny_moves'}
            style={{
              background: 'transparent', color: '#ffffff44',
              border: '1px solid #ffffff15', borderRadius: 14,
              padding: '12px 0', fontSize: 13,
              cursor: 'pointer', width: '100%', maxWidth: 320,
            }}
          >
            ← Back to Tiny Moves Hub
          </button>
        </div>
      )}
    </div>
  );
}
