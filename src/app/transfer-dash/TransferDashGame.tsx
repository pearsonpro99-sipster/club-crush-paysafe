'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── COLOURS ───────────────────────────────────────────────────────────────────
const SKY_BLUE = '#0072CE';
const SKY_RED = '#E8003D';
const SKY_DARK = '#000d1a';

// Difficulty tiers (Easy → Expert), styled like NYT Connections
const DIFFICULTY_COLOURS = ['#00A651', '#FFD700', '#FF6B35', '#E8003D'];
const DIFFICULTY_LABELS  = ['Signing On', 'Transfer Talk', 'Deadline Day', '🔴 BREAKING'];

// ─── PUZZLE DATA ───────────────────────────────────────────────────────────────
// In production this would be fetched from an Opta-powered endpoint per matchday.
const DAILY_PUZZLE = {
  title: 'Transfer Deadline Dash',
  date: '',  // set client-side to avoid hydration mismatch
  categories: [
    {
      id: 'cat0',
      label: 'Brazilian forwards',
      difficulty: 0,
      items: ['Neymar', 'Vinicius Jr', 'Martinelli', 'Endrick'],
    },
    {
      id: 'cat1',
      label: 'Liverpool FC captains',
      difficulty: 1,
      items: ['Gerrard', 'Henderson', 'Hyypiä', 'Redknapp'],
    },
    {
      id: 'cat2',
      label: "Managed by Mourinho at Chelsea",
      difficulty: 2,
      items: ['Drogba', 'Lampard', 'Terry', 'J. Cole'],
    },
    {
      id: 'cat3',
      label: 'Scored in a Champions League final',
      difficulty: 3,
      items: ['Di María', 'Owen', 'Seedorf', 'Ramos'],
    },
  ],
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
type Item = { text: string; categoryId: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeItems(): Item[] {
  return shuffle(
    DAILY_PUZZLE.categories.flatMap(cat =>
      cat.items.map(text => ({ text, categoryId: cat.id }))
    )
  );
}

const MAX_WRONG = 4;
const TIMER_SECONDS = 90;
const FREEZE_COST = 150;
const BASE_COINS = 100;

// ─── COMPONENT ─────────────────────────────────────────────────────────────────
export default function TransferDashGame() {
  const [items, setItems]           = useState<Item[]>(makeItems);
  const [selected, setSelected]     = useState<string[]>([]);
  const [solved, setSolved]         = useState<string[]>([]);
  const [wrongGuesses, setWrong]    = useState(0);
  const [timeLeft, setTimeLeft]     = useState(TIMER_SECONDS);
  const [gameOver, setGameOver]     = useState(false);
  const [won, setWon]               = useState(false);
  const [shaking, setShaking]       = useState(false);
  const [nearMiss, setNearMiss]     = useState(false);
  const [lastEarned, setLastEarned] = useState<number | null>(null);

  // Persistent state
  const [streak,  setStreak]  = useState(0);
  const [coins,   setCoins]   = useState(200);
  const [freezes, setFreezes] = useState(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [date, setDate] = useState('');

  // ── Load persisted data ──────────────────────────────────────────────────────
  useEffect(() => {
    setStreak(parseInt(localStorage.getItem('tdd_streak')  || '0'));
    setCoins(parseInt(localStorage.getItem('tdd_coins')    || '200'));
    setFreezes(parseInt(localStorage.getItem('tdd_freezes')|| '1'));
    setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameOver) { timerRef.current && clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { timerRef.current && clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  // ── Game actions ─────────────────────────────────────────────────────────────
  const endGame = useCallback((didWin: boolean) => {
    setWon(didWin);
    setGameOver(true);
  }, []);

  const toggleItem = (text: string) => {
    if (gameOver) return;
    setSelected(prev => {
      if (prev.includes(text)) return prev.filter(s => s !== text);
      if (prev.length >= 4) return prev;
      return [...prev, text];
    });
  };

  const submitGuess = useCallback(() => {
    if (selected.length !== 4 || gameOver) return;

    const cats = selected.map(s =>
      DAILY_PUZZLE.categories.find(c => c.items.includes(s))?.id
    );
    const allSame = cats.every(c => c === cats[0]) && cats[0] !== undefined;

    if (allSame) {
      const catId = cats[0]!;
      const newSolved = [...solved, catId];
      setSolved(newSolved);
      setSelected([]);

      // Coins: base × streak multiplier (capped at 5×)
      const mult = Math.min(streak + 1, 5);
      const earned = BASE_COINS * mult;
      const newCoins = coins + earned;
      const newStreak = streak + 1;

      setCoins(newCoins);
      setStreak(newStreak);
      setLastEarned(earned);
      setTimeout(() => setLastEarned(null), 2000);

      localStorage.setItem('tdd_coins', newCoins.toString());
      localStorage.setItem('tdd_streak', newStreak.toString());

      if (newSolved.length === DAILY_PUZZLE.categories.length) {
        endGame(true);
      }
    } else {
      // Check "one away"
      const counts = new Map<string, number>();
      cats.forEach(c => { if (c) counts.set(c, (counts.get(c) || 0) + 1); });
      if (Math.max(...counts.values()) === 3) {
        setNearMiss(true);
        setTimeout(() => setNearMiss(false), 2000);
      }

      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setSelected([]);

      const newWrong = wrongGuesses + 1;
      setWrong(newWrong);

      // Streak freeze absorbs one wrong guess
      if (freezes > 0) {
        const f = freezes - 1;
        setFreezes(f);
        localStorage.setItem('tdd_freezes', f.toString());
      } else {
        setStreak(0);
        localStorage.setItem('tdd_streak', '0');
      }

      if (newWrong >= MAX_WRONG) endGame(false);
    }
  }, [selected, gameOver, solved, streak, coins, freezes, wrongGuesses, endGame]);

  const buyFreeze = () => {
    if (coins < FREEZE_COST) return;
    const c = coins - FREEZE_COST;
    const f = freezes + 1;
    setCoins(c); setFreezes(f);
    localStorage.setItem('tdd_coins', c.toString());
    localStorage.setItem('tdd_freezes', f.toString());
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const solvedCats   = DAILY_PUZZLE.categories.filter(c => solved.includes(c.id));
  const unsolvedCats = DAILY_PUZZLE.categories.filter(c => !solved.includes(c.id));
  const unsolvedItems = items.filter(i => !solved.includes(i.categoryId));

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const timerColour = timeLeft <= 10 ? SKY_RED : timeLeft <= 30 ? '#FFD700' : '#fff';
  const mult = Math.min(streak, 5);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: SKY_DARK, minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Shake keyframes */}
      <style>{`
        @keyframes tdd-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes tdd-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tdd-item { transition: background 0.12s, transform 0.12s, border-color 0.12s; }
        .tdd-item:active { transform: scale(0.95) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: SKY_BLUE, padding: '14px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 10, letterSpacing: 3, color: '#ffffff88', textTransform: 'uppercase' }}>
          Sky Sports
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, letterSpacing: 0.5 }}>
          Transfer Deadline Dash
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ffffff66' }}>{date}</p>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        background: '#001433', padding: '10px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #ffffff12',
      }}>
        <StatCell label="Time" value={fmtTime(timeLeft)} valueStyle={{ color: timerColour, fontVariantNumeric: 'tabular-nums' }} />
        <StatCell label="Streak" value={`🔥 ${streak}`} badge={mult > 0 ? `${mult}×` : undefined} />
        <StatCell label="Coins" value={`🪙 ${coins}`} valueStyle={{ color: '#FFD700' }} />
      </div>

      {/* ── Game body ── */}
      <div style={{ padding: '14px 12px', maxWidth: 480, margin: '0 auto' }}>

        {/* Near-miss toast */}
        {nearMiss && (
          <div style={{
            background: '#FF6B35', borderRadius: 8, padding: '8px 14px',
            textAlign: 'center', marginBottom: 10, fontSize: 13, fontWeight: 700,
            animation: 'tdd-pop 0.3s ease',
          }}>
            One away! 👀
          </div>
        )}

        {/* Coins earned toast */}
        {lastEarned !== null && (
          <div style={{
            background: '#FFD70020', border: '1px solid #FFD700',
            borderRadius: 8, padding: '8px 14px', textAlign: 'center',
            marginBottom: 10, fontSize: 13, fontWeight: 700, color: '#FFD700',
            animation: 'tdd-pop 0.3s ease',
          }}>
            +{lastEarned} coins! {mult > 1 ? `(${mult}× streak bonus)` : ''}
          </div>
        )}

        {/* Solved category rows */}
        {solvedCats.map(cat => (
          <div key={cat.id} style={{
            background: DIFFICULTY_COLOURS[cat.difficulty],
            borderRadius: 10, padding: '11px 14px', marginBottom: 6,
            animation: 'tdd-pop 0.3s ease',
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(0,0,0,0.55)' }}>
              {DIFFICULTY_LABELS[cat.difficulty]}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 900, color: '#000' }}>{cat.label}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(0,0,0,0.55)' }}>
              {cat.items.join('  ·  ')}
            </p>
          </div>
        ))}

        {/* Instruction */}
        {!gameOver && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#ffffff44', margin: '10px 0 10px' }}>
            Group four · {MAX_WRONG - wrongGuesses} guess{MAX_WRONG - wrongGuesses !== 1 ? 'es' : ''} remaining
          </p>
        )}

        {/* Item grid */}
        {!gameOver && (
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
              animation: shaking ? 'tdd-shake 0.45s ease' : undefined,
              marginBottom: 14,
            }}
          >
            {unsolvedItems.map(item => {
              const isSelected = selected.includes(item.text);
              return (
                <button
                  key={item.text}
                  className="tdd-item"
                  onClick={() => toggleItem(item.text)}
                  style={{
                    background: isSelected ? SKY_BLUE : '#ffffff12',
                    border: `2px solid ${isSelected ? '#5BB3FF' : 'transparent'}`,
                    borderRadius: 8, padding: '10px 3px',
                    color: '#fff', fontWeight: 800, fontSize: 11,
                    cursor: 'pointer', textAlign: 'center', minHeight: 54,
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    lineHeight: 1.2,
                  }}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Controls */}
        {!gameOver && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => setItems(i => shuffle(i))}
              style={ctrlBtn()}
            >
              Shuffle
            </button>
            <button
              onClick={() => setSelected([])}
              disabled={selected.length === 0}
              style={ctrlBtn(selected.length === 0)}
            >
              Deselect
            </button>
            <button
              onClick={submitGuess}
              disabled={selected.length !== 4}
              style={{
                ...ctrlBtn(selected.length !== 4),
                flex: 2,
                background: selected.length === 4 ? SKY_BLUE : '#ffffff10',
                fontWeight: 900, fontSize: 14,
              }}
            >
              Submit ▶
            </button>
          </div>
        )}

        {/* Wrong guess dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
          {Array.from({ length: MAX_WRONG }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < wrongGuesses ? SKY_RED : '#ffffff20',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ── Streak Freeze shop ── */}
        {!gameOver && (
          <div style={{
            background: '#ffffff08', borderRadius: 12,
            padding: '12px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>🛡️ Streak Freeze</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#ffffff44' }}>
                {freezes > 0
                  ? `${freezes} active — absorbs one wrong guess`
                  : 'Protect your streak from a wrong guess'}
              </p>
            </div>
            {freezes === 0 ? (
              <button
                onClick={buyFreeze}
                style={{
                  background: coins >= FREEZE_COST ? '#FFD700' : '#ffffff15',
                  border: 'none', borderRadius: 8,
                  color: coins >= FREEZE_COST ? '#000' : '#ffffff33',
                  padding: '8px 12px', fontWeight: 900, fontSize: 12,
                  cursor: coins >= FREEZE_COST ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                🪙 {FREEZE_COST}
              </button>
            ) : (
              <div style={{
                background: '#00A65122', border: '1px solid #00A651',
                borderRadius: 8, padding: '5px 10px',
                fontSize: 12, color: '#00A651', fontWeight: 700,
              }}>
                ✓ Active
              </div>
            )}
          </div>
        )}

        {/* ── Difficulty key ── */}
        {!gameOver && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {DIFFICULTY_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: DIFFICULTY_COLOURS[i] }} />
                <span style={{ fontSize: 10, color: '#ffffff44' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── End state ── */}
        {gameOver && (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            background: '#ffffff08', borderRadius: 16,
            animation: 'tdd-pop 0.4s ease',
          }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>
              {won ? '🏆' : wrongGuesses >= MAX_WRONG ? '📋' : '⏱️'}
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900 }}>
              {won ? 'Full Time!' : wrongGuesses >= MAX_WRONG ? 'Game Over' : 'Time Up!'}
            </h2>
            <p style={{ color: '#ffffff66', fontSize: 13, margin: '0 0 18px' }}>
              {won
                ? `Solved in ${fmtTime(TIMER_SECONDS - timeLeft)} · 🔥 Streak: ${streak}`
                : `You got ${solved.length} of ${DAILY_PUZZLE.categories.length} groups`}
            </p>

            {/* Reveal unsolved categories */}
            {unsolvedCats.length > 0 && (
              <>
                <p style={{ fontSize: 11, color: '#ffffff44', marginBottom: 8 }}>The answers were:</p>
                {unsolvedCats.map(cat => (
                  <div key={cat.id} style={{
                    background: DIFFICULTY_COLOURS[cat.difficulty] + '22',
                    border: `1px solid ${DIFFICULTY_COLOURS[cat.difficulty]}55`,
                    borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                    textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: DIFFICULTY_COLOURS[cat.difficulty] }}>
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#ffffff44', marginLeft: 8 }}>
                      {cat.items.join(', ')}
                    </span>
                  </div>
                ))}
              </>
            )}

            <p style={{ fontSize: 12, color: '#ffffff44', margin: '14px 0 6px' }}>
              Next puzzle resets at midnight
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 8, background: SKY_BLUE, border: 'none',
                borderRadius: 12, padding: '14px', color: '#fff',
                fontWeight: 900, fontSize: 15, cursor: 'pointer', width: '100%',
              }}
            >
              Play Again
            </button>
            <a href="/game" style={{ display: 'block', marginTop: 10, color: '#ffffff44', fontSize: 12, textDecoration: 'none' }}>
              ← Back to games
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ─────────────────────────────────────────────────────────
function StatCell({ label, value, valueStyle, badge }: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  badge?: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#ffffff44', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center', ...valueStyle }}>
        {value}
        {badge && <span style={{ fontSize: 12, color: '#FFD700' }}>{badge}</span>}
      </div>
    </div>
  );
}

function ctrlBtn(disabled = false): React.CSSProperties {
  return {
    flex: 1, padding: '12px 6px',
    background: '#ffffff10',
    border: '1px solid #ffffff18',
    borderRadius: 10,
    color: disabled ? '#ffffff33' : '#fff',
    fontWeight: 700, fontSize: 13,
    cursor: disabled ? 'default' : 'pointer',
  };
}
