'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArsenalFlapperEvent, ArsenalCharacter } from '@/lib/game/ArsenalFlapperScene';
import { recordScore } from '@/lib/fanScore';
import { touchStreak } from '@/lib/streak';

const ArsenalFlapperGame = dynamic(() => import('./ArsenalFlapperGame'), { ssr: false });

const CHARACTERS: {
  id: ArsenalCharacter;
  emoji: string;
  name: string;
  role: string;
  bg: string;
}[] = [
  { id: 'gunnersaurus', emoji: '🦖', name: 'Gunnersaurus',      role: 'Club Mascot',      bg: '#1a4a1a' },
  { id: 'saka',         emoji: '⚡', name: 'Bukayo Saka',        role: 'No. 7 · Winger',   bg: '#4a0505' },
  { id: 'odegaard',     emoji: '🔭', name: 'Martin Ødegaard',    role: 'No. 8 · Captain',  bg: '#0a0a3a' },
  { id: 'henry',        emoji: '🕷',  name: 'Thierry Henry',      role: 'Legend · No. 14',  bg: '#2a0a0a' },
];

export default function ArsenalFlapperPage() {
  const [phase, setPhase] = useState<'select' | 'game' | 'dead'>('select');
  const [character, setCharacter] = useState<ArsenalCharacter>('gunnersaurus');
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore]   = useState(0);
  const [liveScore, setLiveScore]   = useState(0);
  const [gameKey, setGameKey]       = useState(0);
  const sceneRef = useRef<any>(null);

  useEffect(() => { touchStreak(); }, []);

  const handleEvent = useCallback((e: ArsenalFlapperEvent) => {
    if (e.type === 'score') setLiveScore(e.score);
    if (e.type === 'died') {
      recordScore('arsenal', 'flapper', e.score);
      setFinalScore(e.score);
      setBestScore(prev => Math.max(prev, e.score));
      setPhase('dead');
    }
  }, []);

  const startGame = (char: ArsenalCharacter) => {
    setCharacter(char);
    setLiveScore(0);
    setPhase('game');
    setGameKey(k => k + 1);
  };

  const restart = () => {
    setLiveScore(0);
    setPhase('game');
    setGameKey(k => k + 1);
  };

  const medal = finalScore >= 30 ? '🏆' : finalScore >= 15 ? '🥇' : finalScore >= 5 ? '⚽' : '🦖';
  const title = finalScore >= 30 ? 'Gunners Legend!' : finalScore >= 15 ? 'Brilliant Flap!' : finalScore >= 5 ? 'Nice Effort!' : 'Keep Flying!';

  const selectedChar = CHARACTERS.find(c => c.id === character) || CHARACTERS[0];

  return (
    <div style={{ background: '#0a0505', minHeight: '100vh', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* ── CHARACTER SELECT ── */}
      {phase === 'select' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0a0505 0%, #1a0808 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '24px 16px',
        }}>
          {/* Header */}
          <div style={{ width: '100%', maxWidth: 400, marginBottom: 8 }}>
            <button
              onClick={() => window.location.href = '/client/arsenal'}
              style={{
                background: 'transparent', border: 'none',
                color: '#ffffff44', fontSize: 13, cursor: 'pointer', padding: 0,
              }}
            >
              ← Arsenal Hub
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 58, marginBottom: 8 }}>🔴</div>
            <h1 style={{ color: '#EF0107', fontSize: 26, fontWeight: 900, margin: '0 0 4px', letterSpacing: 1 }}>
              GUNNERS FLAP
            </h1>
            <p style={{ color: '#ffffff55', fontSize: 13, margin: 0 }}>
              Arsenal FC · Flappy Bird
            </p>
            <p style={{ color: '#FFD700', fontSize: 11, margin: '8px 0 0', fontWeight: 700 }}>
              Grab ⚽ 🪙 🏆 collectibles for bonus points!
            </p>
          </div>

          <p style={{
            color: '#ffffff44', fontSize: 10, letterSpacing: 3,
            textTransform: 'uppercase', marginBottom: 14, width: '100%', maxWidth: 400,
          }}>
            Choose your character
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 400 }}>
            {CHARACTERS.map(char => (
              <button
                key={char.id}
                onClick={() => startGame(char.id)}
                style={{
                  background: char.bg,
                  border: '2px solid rgba(239,1,7,0.4)',
                  borderRadius: 16, padding: '18px 12px',
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'transform 0.1s',
                }}
              >
                <span style={{ fontSize: 40 }}>{char.emoji}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{char.name}</div>
                  <div style={{ color: '#ffffff55', fontSize: 10, marginTop: 2 }}>{char.role}</div>
                </div>
                <div style={{
                  background: '#EF010720', border: '1px solid #EF010740',
                  borderRadius: 8, padding: '3px 10px',
                  color: '#EF0107', fontSize: 9, fontWeight: 800, letterSpacing: 1,
                }}>
                  SELECT ›
                </div>
              </button>
            ))}
          </div>

          <p style={{ color: '#ffffff18', fontSize: 10, marginTop: 24, textAlign: 'center', letterSpacing: 1 }}>
            ARSENAL FC · DIZPLAI FAN GAMES
          </p>
        </div>
      )}

      {/* ── GAME ── */}
      {phase === 'game' && (
        <>
          <div style={{
            position: 'fixed', top: 0, right: 0, zIndex: 50,
            padding: '6px 14px', background: 'rgba(0,0,0,0.6)',
            borderBottomLeftRadius: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{selectedChar.emoji}</span>
            <span style={{ color: '#EF0107', fontWeight: 'bold', fontSize: 18 }}>{liveScore}</span>
          </div>
          <ArsenalFlapperGame key={gameKey} character={character} onEvent={handleEvent} gameRef={sceneRef} />
        </>
      )}

      {/* ── DEATH SCREEN ── */}
      {phase === 'dead' && (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0a0505 0%, #05000a 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>{medal}</div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{selectedChar.emoji}</div>
            <h1 style={{ color: '#EF0107', fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 2 }}>
              {title}
            </h1>
            <p style={{ color: '#ffffff55', fontSize: 13, margin: '4px 0 0' }}>
              {selectedChar.name} · Gunners Flap
            </p>
          </div>

          {/* Score cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, width: '100%', maxWidth: 320 }}>
            <div style={{
              flex: 1, background: '#EF0107', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>SCORE</p>
              <p style={{ color: '#fff', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{finalScore}</p>
            </div>
            <div style={{
              flex: 1, background: '#0a0505', border: '2px solid #EF0107', borderRadius: 16, padding: '16px 12px', textAlign: 'center',
            }}>
              <p style={{ color: '#EF010788', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>BEST</p>
              <p style={{ color: '#EF0107', fontSize: 32, fontWeight: 900, margin: '4px 0 0' }}>{bestScore}</p>
            </div>
          </div>

          <button
            onClick={restart}
            style={{
              background: '#EF0107', color: '#fff', border: 'none',
              borderRadius: 14, padding: '16px 0', fontSize: 17,
              fontWeight: 900, cursor: 'pointer', width: '100%',
              maxWidth: 320, marginBottom: 10, letterSpacing: 1,
            }}
          >
            {selectedChar.emoji} FLY AGAIN
          </button>

          <button
            onClick={() => setPhase('select')}
            style={{
              background: '#ffffff0a', color: '#FFD700',
              border: '1px solid #FFD70030', borderRadius: 14,
              padding: '12px 0', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', width: '100%', maxWidth: 320, marginBottom: 10,
            }}
          >
            Switch Character
          </button>

          <button
            onClick={() => window.location.href = '/client/arsenal'}
            style={{
              background: 'transparent', color: '#ffffff44',
              border: '1px solid #ffffff15', borderRadius: 14,
              padding: '12px 0', fontSize: 13,
              cursor: 'pointer', width: '100%', maxWidth: 320,
            }}
          >
            ← Back to Arsenal Hub
          </button>
        </div>
      )}
    </div>
  );
}
