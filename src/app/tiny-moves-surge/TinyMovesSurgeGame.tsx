'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TOTAL_DISTANCE   = 5000;  // metres (display)
const MAX_LIVES        = 5;
const SPRINT_WINDOW_MS = 820;   // ms to react before a miss
const SPRINT_GAP_MIN   = 2200;  // ms minimum between sprints
const SPRINT_GAP_MAX   = 4300;  // ms maximum between sprints
const PASSIVE_SPEED    = 40;    // m/s base accumulation
const SPEED_MAX        = 55;    // m/s cap

const TM_BLUE   = '#4FC3F7';
const TM_ACCENT = '#0288D1';
const TM_DARK   = '#060e18';

type Phase        = 'splash' | 'playing' | 'dead';
type FeedbackType = 'perfect' | 'good' | 'ok' | 'missed' | null;

interface UIState {
  distance:     number;
  lives:        number;
  sprintActive: boolean;
  sprintKey:    number;     // increments each sprint → forces CSS animation restart
  compOffsets:  number[];   // px relative to player (negative = behind)
  feedback:     FeedbackType;
  feedbackKey:  number;
}

const initUI: UIState = {
  distance: 0, lives: MAX_LIVES, sprintActive: false,
  sprintKey: 0, compOffsets: [-110, -195],
  feedback: null, feedbackKey: 0,
};

const FB_LABEL: Record<NonNullable<FeedbackType>, string> = {
  perfect: '⚡ PERFECT!', good: '✓ GOOD RUN', ok: 'JUST IN TIME', missed: '✗ MISSED!',
};
const FB_COLOR: Record<NonNullable<FeedbackType>, string> = {
  perfect: '#00C853', good: '#FFD740', ok: '#FF9100', missed: '#FF5252',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function TinyMovesSurgeGame() {
  const [phase,     setPhase]     = useState<Phase>('splash');
  const [ui,        setUI]        = useState<UIState>(initUI);
  const [bestDist,  setBestDist]  = useState(0);
  const [finalDist, setFinalDist] = useState(0);
  const [gameKey,   setGameKey]   = useState(0);

  // Stable refs (avoid stale closures in timers)
  const tapRef   = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>('splash');

  // Load persisted best
  useEffect(() => {
    const s = localStorage.getItem('tm_surge_best');
    if (s) setBestDist(parseInt(s));
  }, []);

  // ─── GAME LOOP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    // All mutable game state lives as closure vars — no stale closures needed
    let dist      = 0;
    let lives     = MAX_LIVES;
    let sprintOn  = false;
    let sprintStart = 0;
    let sprintKey = 0;
    let compOff   = [-110, -195];
    let done      = false;
    let fbKey     = 0;
    let mounted   = true;

    const push = (partial: Partial<UIState>) =>
      setUI(prev => ({ ...prev, ...partial }));

    const showFb = (type: FeedbackType) => {
      fbKey++;
      push({ feedback: type, feedbackKey: fbKey });
      setTimeout(() => { if (!done) push({ feedback: null }); }, 750);
    };

    let missTimer:   ReturnType<typeof setTimeout>;
    let sprintTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(tick);
      clearTimeout(sprintTimer);
      clearTimeout(missTimer);
      const best = Math.max(Math.round(dist), parseInt(localStorage.getItem('tm_surge_best') || '0'));
      localStorage.setItem('tm_surge_best', best.toString());
      if (mounted) {
        setBestDist(best);
        setFinalDist(Math.round(dist));
        push({ sprintActive: false, distance: Math.round(dist) });
        setTimeout(() => { if (mounted) { phaseRef.current = 'dead'; setPhase('dead'); } }, 380);
      }
    };

    const schedNext = () => {
      if (done) return;
      const gap = SPRINT_GAP_MIN + Math.random() * (SPRINT_GAP_MAX - SPRINT_GAP_MIN);
      sprintTimer = setTimeout(() => {
        if (done) return;
        sprintOn = true;
        sprintStart = Date.now();
        sprintKey++;
        push({ sprintActive: true, sprintKey });

        missTimer = setTimeout(() => {
          if (!sprintOn || done) return;
          sprintOn = false;
          lives = Math.max(0, lives - 1);
          compOff = compOff.map(o => Math.min(o + 48, -15));
          push({ sprintActive: false, lives, compOffsets: [...compOff] });
          showFb('missed');
          if (lives <= 0) { finish(); return; }
          schedNext();
        }, SPRINT_WINDOW_MS);
      }, gap);
    };

    // Expose tap handler into ref so React event handler can call into the closure
    tapRef.current = () => {
      if (!sprintOn || done) return;
      const elapsed = Date.now() - sprintStart;
      const ratio   = Math.max(0, 1 - elapsed / SPRINT_WINDOW_MS);
      clearTimeout(missTimer);
      sprintOn = false;

      let bonus: number;
      let fb: FeedbackType;
      if      (ratio > 0.66) { bonus = 80;  fb = 'perfect'; }
      else if (ratio > 0.33) { bonus = 45;  fb = 'good';    }
      else                   { bonus = 15;  fb = 'ok';      }

      dist    = Math.min(dist + bonus, TOTAL_DISTANCE);
      compOff = compOff.map(o => o - bonus * 0.45);
      push({ sprintActive: false, distance: Math.round(dist), compOffsets: [...compOff] });
      showFb(fb);
      if (dist >= TOTAL_DISTANCE) { finish(); return; }
      schedNext();
    };

    // Passive distance + competitor closing (100ms tick)
    const tick = setInterval(() => {
      if (done) return;
      const dt    = 0.1;
      const speed = Math.min(PASSIVE_SPEED + (dist / TOTAL_DISTANCE) * (SPEED_MAX - PASSIVE_SPEED), SPEED_MAX);
      dist = Math.min(dist + speed * dt, TOTAL_DISTANCE);
      const close = 10 + (MAX_LIVES - lives) * 5;
      compOff = compOff.map(o => Math.min(o + close * dt, -15));
      push({ distance: Math.round(dist), compOffsets: [...compOff] });
      if (dist >= TOTAL_DISTANCE) finish();
    }, 100);

    schedNext();

    return () => {
      mounted = false;
      done    = true;
      clearInterval(tick);
      clearTimeout(sprintTimer);
      clearTimeout(missTimer);
      tapRef.current = null;
    };
  }, [phase, gameKey]);

  // ─── TAP HANDLER ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phaseRef.current === 'splash') {
      phaseRef.current = 'playing';
      setPhase('playing');
      setUI(initUI);
      return;
    }
    if (phaseRef.current === 'playing') tapRef.current?.();
  }, []);

  const restart = () => {
    phaseRef.current = 'splash';
    setPhase('splash');
    setUI(initUI);
    setFinalDist(0);
    setGameKey(k => k + 1);
  };

  const sprint      = ui.sprintActive;
  const progressPct = Math.min(100, (ui.distance / TOTAL_DISTANCE) * 100);
  const distStr     = ui.distance < 1000 ? `${ui.distance}m` : `${(ui.distance / 1000).toFixed(2)}km`;

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (phase === 'splash') {
    const bStr = bestDist < 1000 ? `${bestDist}m` : `${(bestDist / 1000).toFixed(2)}km`;
    return (
      <div onClick={handleTap} style={{
        minHeight: '100vh', background: TM_DARK, cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <style>{`
          @keyframes tm-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
          @keyframes tm-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        `}</style>

        <div style={{ fontSize: 76, animation: 'tm-bob 1.3s ease-in-out infinite', marginBottom: 16 }}>🏃</div>
        <h1 style={{ color: TM_BLUE, fontSize: 34, fontWeight: 900, margin: '0 0 4px', letterSpacing: 1 }}>5K SURGE</h1>
        <p style={{ color: TM_ACCENT, fontSize: 15, fontWeight: 700, margin: '0 0 28px' }}>Tiny Moves Run Club</p>

        <div style={{
          background: '#ffffff08', border: `1px solid ${TM_BLUE}22`,
          borderRadius: 16, padding: '18px 20px', maxWidth: 320, width: '100%', marginBottom: 28,
        }}>
          <p style={{ color: '#ffffff77', fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
            When <strong style={{ color: '#00C853' }}>⚡ SPRINT</strong> flashes, tap fast!<br />
            The quicker you react, the further you run.
          </p>
          <p style={{ color: '#ffffff44', fontSize: 12, margin: 0 }}>
            Miss {MAX_LIVES} sprint signals and your race is over.
          </p>
        </div>

        {bestDist > 0 && (
          <p style={{ color: '#ffffff33', fontSize: 12, marginBottom: 16 }}>🏆 Best: {bStr}</p>
        )}

        <div style={{
          background: TM_ACCENT, borderRadius: 14, padding: '16px 52px',
          fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 1,
          animation: 'tm-pulse 1.4s ease-in-out infinite',
        }}>▶ TAP TO RACE</div>

        <p style={{ color: '#ffffff22', fontSize: 11, marginTop: 14 }}>Tap anywhere to begin</p>
      </div>
    );
  }

  // ── DEAD ───────────────────────────────────────────────────────────────────
  if (phase === 'dead') {
    const d       = finalDist;
    const pct     = Math.round((d / TOTAL_DISTANCE) * 100);
    const finished = d >= TOTAL_DISTANCE - 5;
    const medal   = finished ? '🏆' : pct >= 80 ? '🥇' : pct >= 50 ? '🏃' : '🍕';
    const title   = finished ? 'You smashed the 5K!' : pct >= 80 ? 'So close!' : pct >= 50 ? 'Solid run!' : 'Keep training!';
    const dStr2   = d < 1000 ? `${d}m` : `${(d / 1000).toFixed(2)}km`;
    const bStr2   = bestDist < 1000 ? `${bestDist}m` : `${(bestDist / 1000).toFixed(2)}km`;

    return (
      <div style={{
        minHeight: '100vh', background: `linear-gradient(180deg, ${TM_DARK} 0%, #040a12 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <style>{`@keyframes tm-popin { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }`}</style>

        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'tm-popin 0.4s ease' }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>{medal}</div>
          <h1 style={{ color: TM_BLUE, fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: 1 }}>{title}</h1>
          <p style={{ color: '#ffffff44', fontSize: 13, margin: '4px 0 0' }}>5K Surge · Tiny Moves Run Club 🏃</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, width: '100%', maxWidth: 320 }}>
          <div style={{ flex: 1, background: TM_ACCENT, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ color: '#ffffff88', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>DISTANCE</p>
            <p style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '4px 0 0' }}>{dStr2}</p>
          </div>
          <div style={{ flex: 1, background: '#060e18', border: `2px solid ${TM_BLUE}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ color: `${TM_BLUE}88`, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, margin: 0 }}>BEST</p>
            <p style={{ color: TM_BLUE, fontSize: 28, fontWeight: 900, margin: '4px 0 0' }}>{bStr2}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 320, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: '#ffffff33', fontSize: 10 }}>0km</span>
            <span style={{ color: '#ffffff55', fontSize: 10, fontWeight: 700 }}>{pct}% of 5K</span>
            <span style={{ color: '#ffffff33', fontSize: 10 }}>5km</span>
          </div>
          <div style={{ background: '#ffffff15', borderRadius: 8, height: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8, width: `${pct}%`,
              background: `linear-gradient(90deg, ${TM_ACCENT}, ${TM_BLUE})`,
            }} />
          </div>
        </div>

        <button onClick={restart} style={{
          background: TM_ACCENT, color: '#fff', border: 'none', borderRadius: 14,
          padding: '16px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer',
          width: '100%', maxWidth: 320, marginBottom: 12, letterSpacing: 1,
        }}>🏃 RUN AGAIN</button>

        <button onClick={() => window.location.href = '/client/tiny_moves'} style={{
          background: 'transparent', color: '#ffffff44', border: '1px solid #ffffff15',
          borderRadius: 14, padding: '12px 0', fontSize: 13,
          cursor: 'pointer', width: '100%', maxWidth: 320,
        }}>← Back to Tiny Moves Hub</button>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  return (
    <div onClick={handleTap} style={{
      minHeight: '100vh', background: TM_DARK, cursor: 'pointer',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes tm-drain {
          0%   { width:100%; background-color:#00C853; }
          33%  { width:67%;  background-color:#00C853; }
          34%  { width:66%;  background-color:#FFD740; }
          66%  { width:34%;  background-color:#FFD740; }
          67%  { width:33%;  background-color:#FF5252; }
          100% { width:0%;   background-color:#FF5252; }
        }
        @keyframes tm-sprint-glow {
          0%,100% { box-shadow:0 0 0 0 rgba(0,200,83,0); transform:scale(1); }
          50%     { box-shadow:0 0 20px 4px rgba(0,200,83,0.22); transform:scale(1.025); }
        }
        @keyframes tm-run-fast { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes tm-run-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes tm-fb-pop {
          0%   { opacity:0; transform:translateX(-50%) translateY(0) scale(0.8); }
          20%  { opacity:1; transform:translateX(-50%) translateY(-8px) scale(1.1); }
          80%  { opacity:1; transform:translateX(-50%) translateY(-22px) scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-40px) scale(0.9); }
        }
      `}</style>

      {/* ── HUD ── */}
      <div style={{
        background: 'rgba(6,14,24,0.97)', borderBottom: `2px solid ${TM_BLUE}`,
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', zIndex: 10, flexShrink: 0,
      }}>
        <div>
          <div style={{ color: '#ffffff44', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Distance</div>
          <div style={{ color: TM_BLUE, fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{distStr}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ffffff44', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>5K Surge</div>
          <div style={{ color: '#ffffff77', fontSize: 11, fontWeight: 700 }}>🏃 TINY MOVES</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ffffff44', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Lives</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < ui.lives ? TM_BLUE : '#ffffff18',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ height: 5, background: '#ffffff0a', flexShrink: 0 }}>
        <div style={{
          height: '100%', width: `${progressPct}%`,
          background: `linear-gradient(90deg, ${TM_ACCENT}, ${TM_BLUE})`,
          transition: 'width 0.15s linear',
        }} />
      </div>

      {/* ── Track scene ── */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden', minHeight: 200,
        background: 'linear-gradient(180deg, #0a1a2e 0%, #081828 38%, #AA4422 38%, #8a3518 66%, #111 66%)',
      }}>
        {/* Crowd dots */}
        {Array.from({ length: 38 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 8.3 + 2) % 100}%`,
            top: `${6 + (i * 13) % 28}%`,
            width: 6, height: 6, borderRadius: '50%',
            background: i % 2 === 0 ? TM_BLUE : TM_ACCENT,
            opacity: 0.35,
          }} />
        ))}

        {/* Club name in crowd */}
        <div style={{
          position: 'absolute', top: '13%', left: '50%', transform: 'translateX(-50%)',
          color: TM_BLUE, fontSize: 15, fontWeight: 900, opacity: 0.28,
          letterSpacing: 3, whiteSpace: 'nowrap',
        }}>TINY MOVES RUN CLUB</div>

        {/* Lane lines on track */}
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${38 + i * 9.3}%`, height: i === 0 || i === 3 ? 2 : 1,
            background: `rgba(255,255,255,${i === 0 || i === 3 ? 0.45 : 0.15})`,
          }} />
        ))}

        {/* Runners */}
        <div style={{ position: 'absolute', top: '46%', left: 0, right: 0 }}>
          {/* Competitor 2 — further back */}
          <div style={{
            position: 'absolute',
            left: `calc(40% + ${Math.max(-240, ui.compOffsets[1])}px)`,
            fontSize: 20, opacity: 0.28,
            transition: 'left 0.5s ease',
          }}>🏃</div>

          {/* Competitor 1 */}
          <div style={{
            position: 'absolute',
            left: `calc(40% + ${Math.max(-240, ui.compOffsets[0])}px)`,
            top: 14,
            fontSize: 26, opacity: 0.45,
            transition: 'left 0.5s ease',
          }}>🏃</div>

          {/* Your runner */}
          <div style={{
            position: 'absolute', left: '40%', top: 8,
            fontSize: 40,
            animation: sprint
              ? 'tm-run-fast 0.22s ease-in-out infinite'
              : 'tm-run-slow 0.7s ease-in-out infinite',
          }}>🏃</div>
        </div>

        {/* Feedback popup */}
        {ui.feedback && (
          <div key={ui.feedbackKey} style={{
            position: 'absolute', top: '22%', left: '50%',
            fontSize: 21, fontWeight: 900,
            color: FB_COLOR[ui.feedback],
            animation: 'tm-fb-pop 0.88s ease forwards',
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            {FB_LABEL[ui.feedback]}
          </div>
        )}
      </div>

      {/* ── Sprint zone ── */}
      <div style={{
        background: 'rgba(4,10,18,0.97)', borderTop: `1px solid ${TM_BLUE}18`,
        padding: '14px 16px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {/* Sprint signal */}
        <div style={{
          width: '100%', maxWidth: 360, borderRadius: 16, padding: '14px 16px',
          textAlign: 'center',
          background: sprint ? 'rgba(0,200,83,0.1)' : '#ffffff04',
          border: `2px solid ${sprint ? '#00C853' : '#ffffff10'}`,
          animation: sprint ? 'tm-sprint-glow 0.28s ease-in-out infinite' : undefined,
          transition: 'border-color 0.1s, background 0.1s',
        }}>
          <div style={{
            fontSize: sprint ? 22 : 17, fontWeight: 900, letterSpacing: 2,
            color: sprint ? '#00C853' : '#ffffff1a',
          }}>
            {sprint ? '⚡ SPRINT NOW!' : '● WAITING...'}
          </div>
        </div>

        {/* Timing bar */}
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{
            background: '#ffffff0a', borderRadius: 8,
            height: 14, overflow: 'hidden',
            opacity: sprint ? 1 : 0.25, transition: 'opacity 0.2s',
          }}>
            <div
              key={ui.sprintKey}
              style={{
                height: '100%', borderRadius: 8,
                background: '#00C853',
                animation: sprint ? `tm-drain ${SPRINT_WINDOW_MS}ms linear forwards` : 'none',
                width: sprint ? undefined : '100%',
              }}
            />
          </div>
          {sprint && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4, fontSize: 9, color: '#ffffff33', letterSpacing: 1,
            }}>
              <span>PERFECT</span><span>GOOD</span><span>OK</span>
            </div>
          )}
        </div>

        <p style={{ color: '#ffffff18', fontSize: 10, letterSpacing: 3, margin: 0 }}>
          TAP ANYWHERE TO SPRINT
        </p>
      </div>
    </div>
  );
}
