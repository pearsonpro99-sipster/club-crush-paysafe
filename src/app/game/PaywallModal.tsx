'use client';

import { ClubTheme } from '@/lib/game/themes';

interface PaywallModalProps {
  theme: ClubTheme;
  coins: number;
  score: number;
  onBuyMoves: (moveCost: number, coinCost: number) => void;
  onEndLevel: () => void;
  onBuyCoins: () => void;
}

const MOVE_PACKS = [
  { moves: 5,  coins: 70,  label: 'Quick Boost' },
  { moves: 10, coins: 120, label: 'Power Pack',  badge: 'BEST VALUE' },
  { moves: 15, coins: 170, label: 'Full Tank' },
];

export default function PaywallModal({ theme, coins, score, onBuyMoves, onEndLevel, onBuyCoins }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: theme.backgroundColour, border: `2px solid ${theme.primaryColour}` }}>

        {/* Header */}
        <div className="p-5 text-center" style={{ background: theme.primaryColour }}>
          <div className="text-4xl mb-1">😬</div>
          <h2 className="text-white text-xl font-black uppercase tracking-wide">Out of Moves!</h2>
          <p className="text-white/80 text-sm mt-1">So close — buy moves to finish this {theme.levelLabel.toLowerCase()}!</p>
        </div>

        {/* Score */}
        <div className="px-5 py-3 text-center border-b border-white/10">
          <p className="text-white/60 text-xs uppercase tracking-widest">Current Score</p>
          <p className="text-white text-3xl font-black">{score.toLocaleString()}</p>
        </div>

        {/* Coin balance + top up */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <span className="text-white font-bold text-lg">{coins} coins</span>
          </div>
          <button
            onClick={onBuyCoins}
            className="text-xs font-black px-3 py-1.5 rounded-full"
            style={{ background: theme.accentColour, color: '#000' }}
          >
            ＋ Top Up
          </button>
        </div>

        {/* Move packs */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          {MOVE_PACKS.map((pack) => {
            const canAfford = coins >= pack.coins;
            return (
              <button
                key={pack.moves}
                onClick={() => canAfford && onBuyMoves(pack.moves, pack.coins)}
                className="relative w-full rounded-xl p-3 flex items-center justify-between transition-all"
                style={{
                  background: canAfford ? theme.primaryColour : '#333',
                  opacity: canAfford ? 1 : 0.5,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                }}
              >
                {pack.badge && (
                  <span className="absolute -top-2 right-3 text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: theme.accentColour, color: '#000' }}>
                    {pack.badge}
                  </span>
                )}
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{pack.label}</p>
                  <p className="text-white/70 text-xs">+{pack.moves} moves</p>
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-lg">
                  <span className="text-lg">🪙</span>
                  <span className="text-white font-black">{pack.coins}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quit */}
        <div className="px-4 pb-5">
          <button
            onClick={onEndLevel}
            className="w-full py-2 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            Give up this {theme.levelLabel.toLowerCase()} →
          </button>
        </div>
      </div>
    </div>
  );
}
