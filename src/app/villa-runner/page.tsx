'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FlapperEvent } from '@/lib/game/AstionVillaFlapperScene';

const VillaFlapperGame = dynamic(() => import('./VillaFlapperGame'), { ssr: false });

export default function VillaRunnerPage() {
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

  const medal = finalScore >= 30 ? '🏆' : finalScore >= 15 ? '🥇' : finalScore >= 5 ? '⚽' : '🥽';
  const title = finalScore >= 30 ? 'McGinn Legend!' : finalScore >= 15 ? 'Brilliant Dash!' : finalScore >= 5 ? 'Nice Effort!' : 'Keep Flying!';

  return (
    <div style={{ background: '#1a0010', minHeight: '100vh' }}>

      {/* Live score overlay */}
      {phase === 'game' && (
        <div style={{
          position: 'fixed', top: 0, right: 0, zIndex: 50,
          padding: '6px 14px', background: 'rgba(0,0,0,0.55)',
          borderBottomLeftRadius: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: '#95BFE5', fontWeight: 'bold', fontSize: 18 }}>{liveScore}</span>
        </div>
      )}

      {phase === 'game' && (
        <VillaFlapperGame key={gameKey} onEvent={handleEvent} gameRef={sceneRef} />
      )}

      {phase === 'dead' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a0010 0%, #0d000a 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>{medal}</div>
            <h1 style={{ color: '#95BFE5', fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 2 }}>
              {title}
            </h1>
            <p style={{ color: '#ffffff55', fontSize: 13, margin: '4px 0 0' }}>
              McGinn's Goggle Dash · Aston Villa FC
            </p>
          </div>

          {/* Score cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, width: '100%', maxWidth: 320 }}>
            <div style={{ flex: 1, background: '#95003B', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>SCORE</p>
              <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{finalScore}</p>
            </div>
            <div style={{ flex: 1, background: '#1a1a2e', border: '2px solid #95BFE5', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ color: '#95BFE588', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>BEST</p>
              <p style={{ color: '#95BFE5', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{bestScore}</p>
            </div>
          </div>

          <button
            onClick={restart}
            style={{
              background: '#95003B', color: '#fff', border: 'none',
              borderRadius: 14, padding: '16px 0', fontSize: 17,
              fontWeight: 900, cursor: 'pointer', width: '100%',
              maxWidth: 320, marginBottom: 12, letterSpacing: 1,
            }}
          >
            🥽 FLY AGAIN
          </button>

          <button
            onClick={() => window.location.href = '/game'}
            style={{
              background: 'transparent', color: '#ffffff44',
              border: '1px solid #ffffff15', borderRadius: 14,
              padding: '12px 0', fontSize: 13,
              cursor: 'pointer', width: '100%', maxWidth: 320,
            }}
          >
            ← Back to Club Crush
          </button>
        </div>
      )}
    </div>
  );
}
