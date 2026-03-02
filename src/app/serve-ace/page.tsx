'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { recordScore } from '@/lib/fanScore';
import { touchStreak } from '@/lib/streak';

// ── Types ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'ready' | 'tossing' | 'timing' | 'result' | 'gameover';
type Zone  = 'ACE' | 'GOOD' | 'OUT';

interface ServeResult { zone: Zone; pos: number; pts: number; }

const TOTAL_SERVES = 5;
const ZONE_COLORS: Record<Zone, string> = { ACE: '#DFF86C', GOOD: '#FFB347', OUT: '#ff5555' };
const ZONE_PTS: Record<Zone, number>   = { ACE: 200, GOOD: 100, OUT: 0 };
const ZONE_LABELS: Record<Zone, string> = { ACE: 'ACE! \u26a1', GOOD: 'GOOD SERVE \u2705', OUT: 'OUT \u274c' };

function getZone(pos: number): Zone {
  const p = Math.abs(pos - 0.5) / 0.5; // 0 = centre, 1 = edge
  if (p < 0.20) return 'ACE';
  if (p < 0.45) return 'GOOD';
  return 'OUT';
}

// ── Game bar width (fixed reference) ──────────────────────────────────────────
const BAR_W = 280;

export default function ServeAcePage() {
  const [phase, setPhase]         = useState<Phase>('intro');
  const [serveNum, setServeNum]   = useState(0);         // 0-based
  const [totalPts, setTotalPts]   = useState(0);
  const [results, setResults]     = useState<ServeResult[]>([]);
  const [lastResult, setLastResult] = useState<ServeResult | null>(null);
  const [ballY, setBallY]         = useState(0);         // 0 = base, 1 = peak
  const [indicatorX, setIndicatorX] = useState(0);       // 0..1 across bar

  const rafRef   = useRef<number | undefined>(undefined);
  const startRef = useRef(0);
  const tossRef  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { touchStreak(); }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tossRef.current) clearTimeout(tossRef.current);
    if (resultRef.current) clearTimeout(resultRef.current);
  }, []);

  // ── Timing bar oscillation ────────────────────────────────────────────────
  const startTiming = useCallback(() => {
    setPhase('timing');
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      // Oscillate 0→1→0→1 … speed increases slightly each serve
      const freq = 1.2 + serveNum * 0.15;
      const pos = Math.sin(elapsed * Math.PI * freq) * 0.5 + 0.5;
      setIndicatorX(pos);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [serveNum]);

  // ── Toss ball then trigger timing ─────────────────────────────────────────
  const startToss = useCallback(() => {
    setPhase('tossing');
    setBallY(0);
    const start = performance.now();
    const duration = 550;

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setBallY(t < 0.5 ? t * 2 : (1 - t) * 2);  // rise then hang at peak
      if (t < 0.75) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setBallY(1);
        startTiming();
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [startTiming]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase === 'ready') { startToss(); return; }
    if (phase !== 'timing') return;

    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = undefined; }

    const zone = getZone(indicatorX);
    const pts  = ZONE_PTS[zone];
    const result: ServeResult = { zone, pos: indicatorX, pts };

    setLastResult(result);
    setResults(prev => [...prev, result]);
    setTotalPts(prev => prev + pts);
    setPhase('result');

    const nextServe = serveNum + 1;
    resultRef.current = setTimeout(() => {
      if (nextServe >= TOTAL_SERVES) {
        recordScore('volleyverse', 'serve_ace', totalPts + pts);
        setPhase('gameover');
      } else {
        setServeNum(nextServe);
        setPhase('ready');
      }
    }, 1100);
  }, [phase, indicatorX, serveNum, totalPts, startToss]);

  const restart = () => {
    setPhase('ready');
    setServeNum(0);
    setTotalPts(0);
    setResults([]);
    setLastResult(null);
    setBallY(0);
    setIndicatorX(0.5);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalFinal  = results.reduce((s, r) => s + r.pts, 0);
  const aceCount    = results.filter(r => r.zone === 'ACE').length;
  const medalEmoji  = aceCount >= 4 ? '\uD83C\uDFC6' : aceCount >= 3 ? '\uD83E\uDD47' : aceCount >= 1 ? '\uD83E\uDD48' : '\uD83C\uDFD0';
  const medalTitle  = aceCount >= 4 ? 'Serving Legend!' : aceCount >= 3 ? 'Ace Server!' : aceCount >= 1 ? 'Good Effort!' : 'Keep Practising!';

  const BG = '#220C2D';
  const font = "'Helvetica Neue', Arial, sans-serif";

  // ══ INTRO ══════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: font }}>
        <div style={{ background: '#1a0822', borderBottom: '2px solid #8E11FF40', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/client/volleyverse" style={{ color: '#ffffff44', fontSize: 13, textDecoration: 'none' }}>\u2190 Hub</a>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>Serve Ace</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>\uD83C\uDFD0</div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: '0 0 6px' }}>Serve Ace</h1>
          <p style={{ color: '#C385F9', fontSize: 14, margin: '0 0 6px', fontWeight: 600 }}>VolleyVerse Serve Challenge</p>
          <p style={{ color: '#ffffff44', fontSize: 13, margin: '0 0 32px' }}>{TOTAL_SERVES} serves \u00b7 nail the timing \u00b7 earn fan points</p>

          {/* Zone legend */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            {([['ACE', '#DFF86C', '200 pts'], ['GOOD', '#FFB347', '100 pts'], ['OUT', '#ff5555', '0 pts']] as const).map(([label, col, pts]) => (
              <div key={label} style={{ background: col + '22', border: `1px solid ${col}55`, borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                <p style={{ color: col, fontWeight: 900, fontSize: 13, margin: 0 }}>{label}</p>
                <p style={{ color: '#ffffff88', fontSize: 11, margin: '2px 0 0' }}>{pts}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('ready')}
            style={{
              background: '#8E11FF', color: '#fff', border: '2px solid #DFF86C',
              borderRadius: 18, padding: '18px 0', fontSize: 18, fontWeight: 900,
              cursor: 'pointer', width: '100%', maxWidth: 320, display: 'block', margin: '0 auto',
              letterSpacing: 1,
            }}
          >
            Let\u2019s Serve \u25b6
          </button>
        </div>
      </div>
    );
  }

  // ══ GAMEOVER ═══════════════════════════════════════════════════════════════
  if (phase === 'gameover') {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: font }}>
        <div style={{ background: '#1a0822', borderBottom: '2px solid #8E11FF40', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/client/volleyverse" style={{ color: '#ffffff44', fontSize: 13, textDecoration: 'none' }}>\u2190 Hub</a>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>Results</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: '36px 16px', textAlign: 'center', maxWidth: 360, margin: '0 auto' }}>
          <div style={{ fontSize: 64, marginBottom: 10 }}>{medalEmoji}</div>
          <h1 style={{ color: '#C385F9', fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>{medalTitle}</h1>
          <p style={{ color: '#ffffff44', fontSize: 13, margin: '0 0 24px' }}>{aceCount} ace{aceCount !== 1 ? 's' : ''} from {TOTAL_SERVES} serves</p>

          {/* Score row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, background: '#8E11FF22', border: '2px solid #8E11FF', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>FAN PTS</p>
              <p style={{ color: '#DFF86C', fontSize: 30, fontWeight: 900, margin: '4px 0 0' }}>{totalFinal.toLocaleString()}</p>
            </div>
            <div style={{ flex: 1, background: '#ffffff08', border: '1px solid #ffffff15', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <p style={{ color: '#ffffff44', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>ACES</p>
              <p style={{ color: '#DFF86C', fontSize: 30, fontWeight: 900, margin: '4px 0 0' }}>{aceCount}</p>
            </div>
          </div>

          {/* Per-serve breakdown */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: ZONE_COLORS[r.zone] + '22',
                border: `2px solid ${ZONE_COLORS[r.zone]}88`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: ZONE_COLORS[r.zone], fontSize: 9, fontWeight: 900 }}>{r.zone}</span>
                <span style={{ color: '#ffffff88', fontSize: 9 }}>{r.pts}</span>
              </div>
            ))}
          </div>

          <button onClick={restart} style={{ background: '#8E11FF', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', width: '100%', marginBottom: 10 }}>
            \uD83D\uDD04 Serve Again
          </button>
          <button onClick={() => window.location.href = '/leaderboard'} style={{ background: '#DFF86C15', color: '#DFF86C', border: '1px solid #DFF86C33', borderRadius: 14, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', marginBottom: 10 }}>
            \uD83C\uDFC6 Leaderboard
          </button>
          <button onClick={() => window.location.href = '/client/volleyverse'} style={{ background: 'transparent', color: '#ffffff33', border: '1px solid #ffffff10', borderRadius: 14, padding: '10px 0', fontSize: 13, cursor: 'pointer', width: '100%' }}>
            \u2190 Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // ══ GAME SCREEN (ready / tossing / timing / result) ════════════════════════
  const serveLabel  = `Serve ${serveNum + 1} of ${TOTAL_SERVES}`;
  const indicatorPx = indicatorX * BAR_W;

  return (
    <div
      onClick={handleTap}
      style={{
        minHeight: '100vh', background: BG, fontFamily: font,
        display: 'flex', flexDirection: 'column',
        userSelect: 'none', WebkitUserSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* HUD */}
      <div style={{ background: '#1a0822', borderBottom: '2px solid #8E11FF40', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#ffffff40', fontSize: 10, letterSpacing: 2, margin: 0, textTransform: 'uppercase' }}>{serveLabel}</p>
          <p style={{ color: '#DFF86C', fontWeight: 900, fontSize: 18, margin: 0 }}>{totalPts} pts</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: TOTAL_SERVES }).map((_, i) => {
            const done = i < results.length;
            const r    = results[i];
            return (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 7,
                background: done ? ZONE_COLORS[r.zone] + '33' : '#ffffff08',
                border: `1.5px solid ${done ? ZONE_COLORS[r.zone] + '88' : '#ffffff15'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 900, color: done ? ZONE_COLORS[r.zone] : '#ffffff20',
              }}>
                {done ? r.zone.slice(0, 1) : i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Court */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 32px' }}>

        {/* Result flash */}
        {phase === 'result' && lastResult && (
          <div style={{ textAlign: 'center', animation: 'none' }}>
            <p style={{ color: ZONE_COLORS[lastResult.zone], fontSize: 30, fontWeight: 900, margin: '0 0 4px', letterSpacing: 1 }}>
              {ZONE_LABELS[lastResult.zone]}
            </p>
            {lastResult.pts > 0 && (
              <p style={{ color: '#DFF86C', fontSize: 18, fontWeight: 800, margin: 0 }}>+{lastResult.pts} pts</p>
            )}
          </div>
        )}

        {(phase === 'ready' || phase === 'tossing' || phase === 'timing') && (
          <p style={{ color: '#ffffff30', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
            {phase === 'ready' ? 'TAP TO TOSS' : phase === 'tossing' ? '...' : 'TAP NOW!'}
          </p>
        )}

        {/* Court visual */}
        <div style={{ width: '100%', maxWidth: 320, position: 'relative' }}>
          {/* Net */}
          <div style={{ height: 3, background: '#ffffff30', borderRadius: 2, margin: '0 0 12px' }} />
          <div style={{ textAlign: 'center', color: '#ffffff15', fontSize: 10, letterSpacing: 3, marginBottom: 40 }}>NET</div>

          {/* Ball */}
          <div style={{
            textAlign: 'center',
            transform: `translateY(${-ballY * 120}px)`,
            transition: phase === 'tossing' ? 'transform 0.1s linear' : 'none',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: phase === 'timing' ? 42 : 36 }}>\uD83C\uDFD0</span>
          </div>

          {/* Player silhouette */}
          <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 32 }}>\uD83D\uDC4B</div>
        </div>

        {/* Timing bar */}
        <div style={{ width: BAR_W, position: 'relative' }}>
          {phase === 'timing' || phase === 'result' ? (
            <>
              {/* Zone bands */}
              <div style={{ width: BAR_W, height: 20, borderRadius: 10, overflow: 'hidden', display: 'flex', border: '1.5px solid #ffffff20' }}>
                {/* OUT left */}
                <div style={{ flex: '0 0 25%', background: '#ff555533' }} />
                {/* GOOD left */}
                <div style={{ flex: '0 0 15%', background: '#FFB34733' }} />
                {/* ACE center */}
                <div style={{ flex: '0 0 20%', background: '#DFF86C44' }} />
                {/* GOOD right */}
                <div style={{ flex: '0 0 15%', background: '#FFB34733' }} />
                {/* OUT right */}
                <div style={{ flex: '0 0 25%', background: '#ff555533' }} />
              </div>
              {/* Zone labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#ff555566', fontSize: 9 }}>OUT</span>
                <span style={{ color: '#FFB34799', fontSize: 9 }}>GOOD</span>
                <span style={{ color: '#DFF86C99', fontSize: 9, fontWeight: 700 }}>ACE</span>
                <span style={{ color: '#FFB34799', fontSize: 9 }}>GOOD</span>
                <span style={{ color: '#ff555566', fontSize: 9 }}>OUT</span>
              </div>
              {/* Indicator */}
              {phase === 'timing' && (
                <div style={{
                  position: 'absolute', top: -6,
                  left: indicatorPx - 3,
                  width: 6, height: 32,
                  background: '#fff',
                  borderRadius: 3,
                  boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                  pointerEvents: 'none',
                }} />
              )}
              {/* Locked indicator after tap */}
              {phase === 'result' && lastResult && (
                <div style={{
                  position: 'absolute', top: -6,
                  left: lastResult.pos * BAR_W - 3,
                  width: 6, height: 32,
                  background: ZONE_COLORS[lastResult.zone],
                  borderRadius: 3,
                  pointerEvents: 'none',
                }} />
              )}
            </>
          ) : (
            /* Greyed out bar when not active */
            <div style={{ width: BAR_W, height: 20, borderRadius: 10, background: '#ffffff08', border: '1.5px solid #ffffff10' }} />
          )}
        </div>

        {phase === 'ready' && (
          <p style={{ color: '#8E11FF88', fontSize: 12, margin: '16px 0 0', textAlign: 'center' }}>
            Tap to toss, then tap again to serve!
          </p>
        )}
      </div>
    </div>
  );
}
