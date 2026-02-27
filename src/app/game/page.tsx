'use client';
import { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { THEMES, ClubTheme } from '@/lib/game/themes';
import PaywallModal from './PaywallModal';
import LevelComplete from './LevelComplete';

const PhaserGame = dynamic(() => import('./PhaserGame'), { ssr: false });

const getLevelKey = (clubId: string) => `crush_level_${clubId}`;
const loadLevel = (clubId: string) => {
  if (typeof window === 'undefined') return 1;
  return parseInt(localStorage.getItem(getLevelKey(clubId)) || '1');
};
const saveLevel = (clubId: string, level: number) => {
  if (typeof window !== 'undefined') localStorage.setItem(getLevelKey(clubId), level.toString());
};

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientParam = searchParams.get('client') || 'arsenal';
  const [selectedClub] = useState<string>(THEMES[clientParam] ? clientParam : 'arsenal');
  const [gameStarted, setGameStarted] = useState(false);
  const [coins, setCoins] = useState(200);
  const [level, setLevel] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const sceneRef = useRef<any>(null);
  const theme: ClubTheme = THEMES[selectedClub];

  // Load saved level for this club on mount
  useEffect(() => { setLevel(loadLevel(selectedClub)); }, [selectedClub]);

  const handleGameEvent = useCallback((data: { score?: number; coinsEarned?: number; levelComplete?: boolean; outOfMoves?: boolean; }) => {
    if (data.levelComplete) { setLastScore(data.score ?? 0); setLastCoinsEarned(data.coinsEarned ?? 0); setCoins(prev => prev + (data.coinsEarned ?? 0)); setShowLevelComplete(true); }
    if (data.outOfMoves) { setLastScore(data.score ?? 0); setShowPaywall(true); }
  }, []);

  const handleBuyMoves = (moveCount: number, coinCost: number) => { if (coins < coinCost) return; setCoins(prev => prev - coinCost); setShowPaywall(false); sceneRef.current?.addMoves?.(moveCount); };
  const handleEndLevel = () => { setShowPaywall(false); setGameStarted(false); setGameKey(k => k + 1); };
  const handleNextLevel = () => {
    setShowLevelComplete(false);
    setLevel(prev => { const next = prev + 1; saveLevel(selectedClub, next); return next; });
    setGameKey(k => k + 1);
  };

  const HeaderBar = () => (
    <div style={{ background: theme.primaryColour, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 12px', color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 0 2 2h16v4z"/><path d="M22 12H18a2 2 0 0 0 0 4h4"/></svg>
        <span>🪙 {coins}</span>
      </button>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>💎 Club Crush</div>
      <button onClick={() => { setGameStarted(false); router.push(`/client/${selectedClub}`); }} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 10px', cursor: 'pointer', color: '#ffffff80', fontSize: 12 }}>✕</button>
    </div>
  );

  if (!gameStarted) {
    return (
      <div style={{ minHeight: '100vh', background: theme.backgroundColour, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <HeaderBar />
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 4px' }}>Club Crush</h1>
            <p style={{ color: '#ffffff50', fontSize: 12, margin: 0 }}>{theme.clubName}</p>
          </div>
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, background: '#ffffff10', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff50', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Level</p>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>{theme.levelLabel} {level}</p>
            </div>
            <div style={{ flex: 1, background: '#ffffff10', borderRadius: 14, padding: '12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff50', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Coins</p>
              <p style={{ color: '#FFD700', fontSize: 22, fontWeight: 900, margin: 0 }}>🪙 {coins}</p>
            </div>
          </div>
          <button onClick={() => setGameStarted(true)} style={{ width: '100%', maxWidth: 360, padding: '18px', borderRadius: 20, background: theme.primaryColour, border: `2px solid ${theme.accentColour}`, color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
            Play {theme.levelLabel} {level}
          </button>

          {/* McGinn Goggle Dash — Aston Villa only */}
          {selectedClub === 'aston_villa' && (
            <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
              <p style={{ color: '#ffffff40', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10 }}>Also Available</p>
              <a href="/villa-runner" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'linear-gradient(135deg, #95003B 0%, #3d0018 100%)', borderRadius: 16, padding: '16px', border: '2px solid #95BFE5', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40 }}>🥽</span>
                  <div>
                    <p style={{ color: '#95BFE5', fontWeight: 900, fontSize: 16, margin: 0 }}>McGinn's Goggle Dash</p>
                    <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>Aston Villa Flappy Bird</p>
                  </div>
                  <span style={{ color: '#ffffff44', marginLeft: 'auto', fontSize: 20 }}>▶</span>
                </div>
              </a>
            </div>
          )}

          {/* Transfer Deadline Dash — Sky Sports only */}
          {selectedClub === 'sky_sports' && (
            <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
              <p style={{ color: '#ffffff40', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10 }}>Also Available</p>
              <a href="/transfer-dash" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'linear-gradient(135deg, #0072CE 0%, #001f4d 100%)', borderRadius: 16, padding: '16px', border: '2px solid #E8003D', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40 }}>⏱️</span>
                  <div>
                    <p style={{ color: '#ffffff', fontWeight: 900, fontSize: 16, margin: 0 }}>Transfer Deadline Dash</p>
                    <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>Timed connections puzzle · Daily reset</p>
                  </div>
                  <span style={{ color: '#ffffff44', marginLeft: 'auto', fontSize: 20 }}>▶</span>
                </div>
              </a>
            </div>
          )}

          {/* Runner game link — Arsenal only */}
          {selectedClub === 'arsenal' && (
            <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
              <p style={{ color: '#ffffff40', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10 }}>Also Available</p>
              <a href="/runner" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'linear-gradient(135deg, #DB0007 0%, #8B0000 100%)', borderRadius: 16, padding: '16px', border: '2px solid #FFD700', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40 }}>🏆</span>
                  <div>
                    <p style={{ color: '#FFD700', fontWeight: 900, fontSize: 16, margin: 0 }}>Chase the Team Bus 🚌</p>
                    <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>Don't be late for the match!</p>
                  </div>
                  <span style={{ color: '#ffffff44', marginLeft: 'auto', fontSize: 20 }}>▶</span>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.backgroundColour, minHeight: '100vh' }}>
      <HeaderBar />
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <p style={{ color: '#ffffff40', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>{theme.seasonLabel} · {theme.levelLabel} {level} of {theme.totalLevels}</p>
      </div>
      <div style={{ padding: '0 8px' }}>
        <PhaserGame key={gameKey} theme={theme} onGameEvent={handleGameEvent} gameRef={sceneRef} />
      </div>
      {showPaywall && <PaywallModal theme={theme} coins={coins} score={lastScore} onBuyMoves={handleBuyMoves} onEndLevel={handleEndLevel} />}
      {showLevelComplete && <LevelComplete theme={theme} score={lastScore} coinsEarned={lastCoinsEarned} level={level} onNextLevel={handleNextLevel} />}
    </div>
  );
}

export default function GamePage() {
  return <Suspense fallback={<div style={{ background: '#111', minHeight: '100vh' }} />}><GameContent /></Suspense>;
}
