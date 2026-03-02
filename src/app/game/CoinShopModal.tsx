'use client';

interface CoinShopModalProps {
  onClose: () => void;
  onBuy: (amount: number) => void;
}

const PACKS = [
  { coins: 500,  price: '£0.99', label: 'Starter Pack',   badge: '' },
  { coins: 1500, price: '£2.49', label: 'Fan Pack',        badge: 'MOST POPULAR' },
  { coins: 5000, price: '£4.99', label: 'Season Pass',     badge: 'BEST VALUE' },
];

export default function CoinShopModal({ onClose, onBuy }: CoinShopModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#111118', border: '2px solid #FFD70050' }}>

        {/* Header */}
        <div className="p-5 text-center" style={{ background: 'linear-gradient(135deg, #1a1200 0%, #111118 100%)' }}>
          <div className="text-5xl mb-2">🪙</div>
          <h2 className="text-white text-xl font-black uppercase tracking-wide">Coin Shop</h2>
          <p className="text-white/60 text-sm mt-1">Top up to keep playing</p>
        </div>

        {/* Packs */}
        <div className="p-4 flex flex-col gap-3">
          {PACKS.map(pack => (
            <button
              key={pack.coins}
              onClick={() => { onBuy(pack.coins); onClose(); }}
              className="relative w-full rounded-xl p-4 flex items-center justify-between transition-all active:scale-95"
              style={{ background: '#1a1a2a', border: '1px solid #FFD70030', cursor: 'pointer' }}
            >
              {pack.badge && (
                <span className="absolute -top-2 right-3 text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#FFD700', color: '#000' }}>
                  {pack.badge}
                </span>
              )}
              <div className="text-left">
                <p className="text-white font-black text-base">{pack.label}</p>
                <p className="text-yellow-400 font-bold text-sm">🪙 {pack.coins.toLocaleString()} coins</p>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-lg">{pack.price}</p>
                <p className="text-white/40 text-xs">one-time</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-5 text-center">
          <p className="text-white/25 text-xs mb-3">Coins are used to continue levels. No subscription.</p>
          <button onClick={onClose} className="text-white/40 text-sm hover:text-white/70 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
