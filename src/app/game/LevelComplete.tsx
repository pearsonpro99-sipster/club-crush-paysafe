'use client';

import { ClubTheme } from '@/lib/game/themes';

interface LevelCompleteProps {
  theme: ClubTheme;
  score: number;
  coinsEarned: number;
  level: number;
  onNextLevel: () => void;
}

export default function LevelComplete({ theme, score, coinsEarned, level, onNextLevel }: LevelCompleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl text-center"
        style={{ background: theme.backgroundColour, border: `2px solid ${theme.accentColour}` }}>

        <div className="p-6" style={{ background: theme.primaryColour }}>
          <div className="text-6xl mb-2">🏆</div>
          <h2 className="text-white text-2xl font-black uppercase">Match Complete!</h2>
          <p className="text-white/80 text-sm mt-1">{theme.levelLabel} {level} of {theme.totalLevels}</p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-white/50 text-xs uppercase tracking-widest">Final Score</p>
            <p className="text-white text-4xl font-black">{score.toLocaleString()}</p>
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
