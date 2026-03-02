'use client';

import { ClubTheme } from '@/lib/game/themes';

interface LevelCompleteProps {
  theme: ClubTheme;
  score: number;
  coinsEarned: number;
  level: number;
  movesLeft: number;
  onNextLevel: () => void;
}

function Stars({ movesLeft, startingMoves }: { movesLeft: number; startingMoves: number }) {
  const ratio = movesLeft / Math.max(startingMoves, 1);
  const filled = ratio > 0.5 ? 3 : ratio > 0.2 ? 2 : 1;
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '8px 0 4px' }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ fontSize: 32, filter: i <= filled ? 'none' : 'grayscale(1) opacity(0.25)' }}>⭐</span>
      ))}
    </div>
  );
}

export default function LevelComplete({ theme, score, coinsEarned, level, movesLeft, onNextLevel }: LevelCompleteProps) {
  // Rough starting moves from the same tier table (matches ClubCrushScene)
  const tier = Math.min(Math.floor((level - 1) / 5), 5);
  const movesArr = [22, 20, 18, 16, 15, 14];
  const startingMoves = movesArr[tier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl text-center"
        style={{ background: theme.backgroundColour, border: `2px solid ${theme.accentColour}` }}>

        <div className="p-6" style={{ background: theme.primaryColour }}>
          <div className="text-5xl mb-1">🏆</div>
          <h2 className="text-white text-2xl font-black uppercase tracking-wide">{theme.levelLabel} Complete!</h2>
          <p className="text-white/70 text-sm mt-1">{theme.levelLabel} {level} of {theme.totalLevels}</p>
          <Stars movesLeft={movesLeft} startingMoves={startingMoves} />
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-white/50 text-xs uppercase tracking-widest">Final Score</p>
            <p className="text-white text-4xl font-black">{score.toLocaleString()}</p>
            {movesLeft > 0 && (
              <p className="text-white/40 text-xs mt-1">{movesLeft} moves to spare</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 py-3 rounded-xl"
            style={{ background: theme.primaryColour + '33' }}>
            <span className="text-3xl">🪙</span>
            <div>
              <p className="text-white font-black text-2xl">+{coinsEarned}</p>
              <p className="text-white/60 text-xs">coins earned</p>
            </div>
          </div>

          <button
            onClick={onNextLevel}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-transform active:scale-95"
            style={{ background: theme.primaryColour, color: '#fff' }}
          >
            Next {theme.levelLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
