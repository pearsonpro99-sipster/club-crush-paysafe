'use client';
import { useState, useRef, useCallback, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { THEMES, ClubTheme } from '@/lib/game/themes';
import PaywallModal from './PaywallModal';
import LevelComplete from './LevelComplete';
import CoinShopModal from './CoinShopModal';
import { recordScore } from '@/lib/fanScore';
import { touchStreak } from '@/lib/streak';

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
  const [coins, setCoins] = useState(150);
  const [level, setLevel] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [lastCoinsEarned, setLastCoinsEarned] = useState(0);
  const [lastMovesLeft, setLastMovesLeft] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const sceneRef = useRef<any>(null);
  const theme: ClubTheme = THEMES[selectedClub];

  // Load saved level for this club on mount
  useEffect(() => { setLevel(loadLevel(selectedClub)); }, [selectedClub]);

  const handleGameEvent = useCallback((data: { score?: number; moves?: number; coinsEarned?: number; levelComplete?: boolean; outOfMoves?: boolean; }) => {
    if (data.levelComplete) {
      recordScore(selectedClub, 'crush', data.score ?? 0);
      setLastScore(data.score ?? 0);
      setLastMovesLeft(data.moves ?? 0);
      setLastCoinsEarned(data.coinsEarned ?? 0);
      setCoins(prev => prev + (data.coinsEarned ?? 0));
      setShowLevelComplete(true);
    }
    if (data.outOfMoves) { setLastScore(data.score ?? 0); setShowPaywall(true); }
  }, [selectedClub]);

  const handleBuyMoves = (moveCount: number, coinCost: number) => {
    if (coins < coinCost) { setShowCoinShop(true); return; }
    setCoins(prev => prev - coinCost);
    setShowPaywall(false);
    sceneRef.current?.addMoves?.(moveCount);
  };
  const handleEndLevel = () => { setShowPaywall(false); setGameStarted(false); setGameKey(k => k + 1); };
  const handleNextLevel = () => {
    setShowLevelComplete(false);
    setLevel(prev => { const next = prev + 1; saveLevel(selectedClub, next); return next; });
    setGameKey(k => k + 1);
  };
  const handleStartGame = () => { touchStreak(); setGameStarted(true); };

  const lowCoins = coins < 60;
  const HeaderBar = () => (
    <div style={{ background: theme.primaryColour, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button
        onClick={() => setShowCoinShop(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: lowCoins ? 'rgba(255,80,80,0.35)' : 'rgba(0,0,0,0.25)',
          border: `1px solid ${lowCoins ? 'rgba(255,80,80,0.6)' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 20, padding: '6px 12px',
          color: '#FFD700', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <span>🪙 {coins}</span>
        {lowCoins && <span style={{ color: '#ff8080', fontSize: 10, fontWeight: 800 }}>LOW ＋</span>}
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
          <button onClick={handleStartGame} style={{ width: '100%', maxWidth: 360, padding: '18px', borderRadius: 20, background: theme.primaryColour, border: `2px solid ${theme.accentColour}`, color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
            Play {theme.levelLabel} {level}
          </button>

          {/* ── Skip Level / Leaderboard Boost ── */}
          <SkipLevelPanel
            level={level}
            coins={coins}
            levelLabel={theme.levelLabel}
            primary={theme.primaryColour}
            accent={theme.accentColour}
            selectedClub={selectedClub}
            onSkip={() => {
              const skipCost = Math.min(Math.max(level * 15, 100), 400);
              if (coins < skipCost) { setShowCoinShop(true); return; }
              const fanPts = level * 120; // less than playing earns
              recordScore(selectedClub, 'crush_skip', fanPts);
              setCoins(prev => prev - skipCost);
              setLevel(prev => { const next = prev + 1; saveLevel(selectedClub, next); return next; });
            }}
            onBoost={() => {
              // Boost: spend 250 coins → +800 fan pts directly
              if (coins < 250) { setShowCoinShop(true); return; }
              recordScore(selectedClub, 'boost', 800);
              setCoins(prev => prev - 250);
            }}
            onBuyCoins={() => setShowCoinShop(true)}
          />

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

          {/* Tiny Moves Dash — Tiny Moves Run Club only */}
          {selectedClub === 'tiny_moves' && (
            <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
              <p style={{ color: '#ffffff40', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10 }}>Also Available</p>
              <a href="/tiny-moves" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'linear-gradient(135deg, #0288D1 0%, #01579B 100%)', borderRadius: 16, padding: '16px', border: '2px solid #4FC3F7', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40 }}>🏃</span>
                  <div>
                    <p style={{ color: '#ffffff', fontWeight: 900, fontSize: 16, margin: 0 }}>Tiny Moves Run Club Dash</p>
                    <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>Dodge the cones · Collect pizzas</p>
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
        <PhaserGame key={gameKey} theme={theme} level={level} onGameEvent={handleGameEvent} gameRef={sceneRef} />
      </div>
      {showPaywall && <PaywallModal theme={theme} coins={coins} score={lastScore} onBuyMoves={handleBuyMoves} onEndLevel={handleEndLevel} onBuyCoins={() => { setShowPaywall(false); setShowCoinShop(true); }} />}
      {showLevelComplete && <LevelComplete theme={theme} score={lastScore} coinsEarned={lastCoinsEarned} level={level} movesLeft={lastMovesLeft} onNextLevel={handleNextLevel} />}
      {showCoinShop && <CoinShopModal onClose={() => setShowCoinShop(false)} onBuy={(amount) => setCoins(prev => prev + amount)} />}
    </div>
  );
}

export default function GamePage() {
  return <Suspense fallback={<div style={{ background: '#111', minHeight: '100vh' }} />}><GameContent /></Suspense>;
}

// ── Skip Level / Leaderboard Boost panel ─────────────────────────────────────
function SkipLevelPanel({
  level, coins, levelLabel, primary, accent, selectedClub, onSkip, onBoost, onBuyCoins,
}: {
  level: number; coins: number; levelLabel: string;
  primary: string; accent: string; selectedClub: string;
  onSkip: () => void; onBoost: () => void; onBuyCoins: () => void;
}) {
  const skipCost  = Math.min(Math.max(level * 15, 100), 400);
  const boostCost = 250;
  const canSkip   = coins >= skipCost;
  const canBoost  = coins >= boostCost;

  return (
    <div style={{ width: '100%', maxWidth: 360, marginTop: 16 }}>
      <p style={{ color: '#ffffff30', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>
        Shortcuts &amp; Boosts
      </p>

      {/* Skip Level */}
      <button
        onClick={canSkip ? onSkip : onBuyCoins}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: canSkip ? primary + '22' : '#ffffff08',
          border: `1px solid ${canSkip ? primary + '55' : '#ffffff15'}`,
          borderRadius: 14, padding: '12px 16px', marginBottom: 8,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>
            ⚡ Skip {levelLabel} {level}
          </p>
          <p style={{ color: '#ffffff55', fontSize: 11, margin: '2px 0 0' }}>
            Advance instantly · earn {(level * 120).toLocaleString()} fan pts
          </p>
        </div>
        <div style={{
          background: canSkip ? primary : '#ffffff15',
          borderRadius: 10, padding: '6px 12px',
          color: '#fff', fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap',
        }}>
          🪙 {skipCost}
        </div>
      </button>

      {/* Leaderboard Boost */}
      <button
        onClick={canBoost ? onBoost : onBuyCoins}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: canBoost ? '#FFD70015' : '#ffffff08',
          border: `1px solid ${canBoost ? '#FFD70040' : '#ffffff15'}`,
          borderRadius: 14, padding: '12px 16px',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>
            🏆 Leaderboard Boost
          </p>
          <p style={{ color: '#ffffff55', fontSize: 11, margin: '2px 0 0' }}>
            Instantly add 800 fan pts to your score
          </p>
        </div>
        <div style={{
          background: canBoost ? '#FFD70033' : '#ffffff15',
          borderRadius: 10, padding: '6px 12px',
          color: canBoost ? '#FFD700' : '#ffffff44', fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap',
        }}>
          🪙 {boostCost}
        </div>
      </button>

      {!canSkip && !canBoost && (
        <p style={{ color: '#ffffff33', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          <span onClick={onBuyCoins} style={{ color: '#FFD700', cursor: 'pointer', textDecoration: 'underline' }}>
            Top up coins
          </span>{' '}to unlock shortcuts
        </p>
      )}
    </div>
  );
}
