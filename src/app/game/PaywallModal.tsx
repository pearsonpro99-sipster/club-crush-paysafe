'use client';

import { ClubTheme } from '@/lib/game/themes';

interface PaywallModalProps {
  theme: ClubTheme;
  coins: number;
  score: number;
  onBuyMoves: (moveCost: number, coinCost: number) => void;
  onEndLevel: () => void;
}

const MOVE_PACKS = [
  { moves: 5,  coins: 50,  label: 'Quick Boost' },
  { moves: 10, coins: 90,  label: 'Power Pack',  badge: 'BEST VALUE' },
  { moves: 15, coins: 120, label: 'Full Tank' },
];

export default function PaywallModal({ theme, coins, score, onBuyMoves, onEndLevel }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: theme.backgroundColour, border: `2px solid ${theme.primaryColour}` }}>

        {/* Header */}
        <div className="p-5 text-center" style={{ background: theme.primaryColour }}>
          <div className="text-4xl mb-1">😬</div>
          <h2 className="text-white text-xl font-black uppercase tracking-wide">So Close!</h2>
          <p className="text-white/80 text-sm mt-1">You're just a few moves away from completing this match</p>
        </div>

        {/* Score */}
        <div className="px-5 py-3 text-center border-b border-white/10">
          <p className="text-white/60 text-xs uppercase tracking-widest">Current Score</p>
          <p className="text-white text-3xl font-black">{score.toLocaleString()}</p>
        </div>

        {/* Coin balance */}
        <div className="px-5 py-3 flex items-center justify-center gap-2">
          <span className="text-2xl">🪙</span>
          <span className="text-white font-bold text-lg">{coins} coins</span>
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

        {/* Buy coins CTA */}
        <div className="px-4 pb-3">
          <button
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider"
            style={{ background: theme.accentColour, color: '#000' }}
            onClick={() => alert('Stripe coin purchase coming tomorrow — connect Stripe here')}
          >
            💳 Buy More Coins
          </button>
        </div>

        {/* Quit */}
        <div className="px-4 pb-5">
          <button
            onClick={onEndLevel}
            className="w-full py-2 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            End this match →
          </button>
        </div>
      </div>
    </div>
  );
}
