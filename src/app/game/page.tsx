'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { THEMES, ClubTheme } from '@/lib/game/themes';
import PaywallModal from './PaywallModal';
import LevelComplete from './LevelComplete';

// Phaser must be client-side only — no SSR
const PhaserGame = dynamic(() => import('./PhaserGame'), { ssr: false });

export default function GamePage() {
  const [selectedClub, setSelectedClub] = useState<string>('arsenal');
  const [gameStarted, setGameStarted] = useState(false);
  const [coins, setCoins] = useState(200); // starter coins
  const [level, setLevel] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [gameKey, setGameKey] = useState(0); // increment to remount Phaser

  const sceneRef = useRef<any>(null);
  const theme: ClubTheme = THEMES[selectedClub];

  const handleGameEvent = useCallback((data: {
    score?: number;
    moves?: number;
    coinsEarned?: number;
    levelComplete?: boolean;
    outOfMoves?: boolean;
  }) => {
    if (data.levelComplete) {
      setLastScore(data.score ?? 0);
      setLastCoinsEarned(data.coinsEarned ?? 0);
      setCoins(prev => prev + (data.coinsEarned ?? 0));
      setShowLevelComplete(true);
    }
    if (data.outOfMoves) {
      setLastScore(data.score ?? 0);
      setShowPaywall(true);
    }
  }, []);

  const handleBuyMoves = (moveCount: number, coinCost: number) => {
    if (coins < coinCost) return;
    setCoins(prev => prev - coinCost);
    setShowPaywall(false);
    sceneRef.current?.addMoves?.(moveCount);
  };

  const handleEndLevel = () => {
    setShowPaywall(false);
    setGameStarted(false);
    setGameKey(k => k + 1);
  };

  const handleNextLevel = () => {
    setShowLevelComplete(false);
    setLevel(prev => prev + 1);
    setGameKey(k => k + 1);
  };

  // ─── LOBBY ─────────────────────────────────────────────────────────────────
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: theme.backgroundColour }}>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Club Crush</h1>
          <p className="text-white/50 text-sm mt-1">by Dizplai</p>
        </div>

        {/* Club selector */}
        <div className="w-full max-w-sm mb-6">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-3 text-center">Select Your Club</p>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setSelectedClub(key)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: selectedClub === key ? t.primaryColour : '#ffffff15',
                  border: `2px solid ${selectedClub === key ? t.accentColour : 'transparent'}`,
                }}
              >
                <span className="text-2xl">{t.tiles[0].emoji}</span>
                <span className="text-white font-bold">{t.clubName}</span>
                {selectedClub === key && (
                  <span className="ml-auto text-white/80 text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Level + Coins info */}
        <div className="w-full max-w-sm flex gap-3 mb-6">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#ffffff10' }}>
            <p className="text-white/50 text-xs uppercase">Level</p>
            <p className="text-white text-2xl font-black">{theme.levelLabel} {level}</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#ffffff10' }}>
            <p className="text-white/50 text-xs uppercase">Coins</p>
            <p className="text-white text-2xl font-black">🪙 {coins}</p>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={() => setGameStarted(true)}
          className="w-full max-w-sm py-5 rounded-2xl text-white text-xl font-black uppercase tracking-wider transition-transform active:scale-95"
          style={{ background: theme.primaryColour }}
        >
          Play {theme.levelLabel} {level}
        </button>

        <p className="text-white/30 text-xs mt-4 text-center">
          Match 3 or more tiles · Reach the target score · Earn coins
        </p>

        {/* Runner game link */}
        <div className="w-full max-w-sm mt-6">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3 text-center">Also Available</p>
          <a href="/runner" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #DB0007 0%, #8B0000 100%)',
              borderRadius: 16, padding: '16px',
              border: '2px solid #FFD700',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <span style={{ fontSize: 40 }}>🏆</span>
              <div>
                <p style={{ color: '#FFD700', fontWeight: 900, fontSize: 16, margin: 0 }}>
                  Shirt Number Sprint
                </p>
                <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>
                  Arsenal Trophy Celebration Runner
                </p>
              </div>
              <span style={{ color: '#ffffff44', marginLeft: 'auto', fontSize: 20 }}>▶</span>
            </div>
          </a>
        </div>
      </div>
    );
  }

  // ─── GAME ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: theme.backgroundColour, minHeight: "100vh" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: theme.primaryColour + 'cc' }}>
        <button onClick={() => setGameStarted(false)} className="text-white/70 text-sm">
          ← Back
        </button>
        <p className="text-white font-bold text-sm">{theme.clubName}</p>
        <div className="flex items-center gap-1">
          <span className="text-lg">🪙</span>
          <span className="text-white font-bold">{coins}</span>
        </div>
      </div>

      {/* Level label */}
      <div className="text-center py-2">
        <p className="text-white/40 text-xs uppercase tracking-widest">
          {theme.seasonLabel} · {theme.levelLabel} {level} of {theme.totalLevels}
        </p>
      </div>

      {/* Phaser game */}
      <div style={{ padding: "0 8px" }}>
        <PhaserGame
          key={gameKey}
          theme={theme}
          onGameEvent={handleGameEvent}
          gameRef={sceneRef}
        />
      </div>

      {/* Modals */}
      {showPaywall && (
        <PaywallModal
          theme={theme}
          coins={coins}
          score={lastScore}
          onBuyMoves={handleBuyMoves}
          onEndLevel={handleEndLevel}
        />
      )}

      {showLevelComplete && (
        <LevelComplete
          theme={theme}
          score={lastScore}
          coinsEarned={lastCoinsEarned}
          level={level}
          onNextLevel={handleNextLevel}
        />
      )}
    </div>
  );
}