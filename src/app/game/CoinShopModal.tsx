'use client';

import { useState } from 'react';

interface CoinShopModalProps {
  onClose: () => void;
  clientId: string;
  /** Where Stripe should redirect on cancel (defaults to /client/[clientId]) */
  returnPath?: string;
}

const PACKS = [
  { id: 'starter', coins: 500,  price: '£0.99', label: 'Starter Pack',  badge: ''            },
  { id: 'fan',     coins: 1500, price: '£2.49', label: 'Fan Pack',       badge: 'MOST POPULAR' },
  { id: 'season',  coins: 5000, price: '£4.99', label: 'Season Pass',    badge: 'BEST VALUE'   },
];

export default function CoinShopModal({ onClose, clientId, returnPath }: CoinShopModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState('');

  const handleBuy = async (packId: string) => {
    setLoading(packId);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          clientId,
          returnPath: returnPath ?? (clientId ? `/client/${clientId}` : '/'),
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url; // full external redirect to Stripe
      } else {
        setError('Could not start checkout. Please try again.');
        setLoading(null);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(null);
    }
  };

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
              key={pack.id}
              onClick={() => handleBuy(pack.id)}
              disabled={loading !== null}
              className="relative w-full rounded-xl p-4 flex items-center justify-between transition-all active:scale-95"
              style={{
                background:  '#1a1a2a',
                border:      `1px solid ${loading === pack.id ? '#FFD700' : '#FFD70030'}`,
                cursor:       loading !== null ? 'default' : 'pointer',
                opacity:      loading !== null && loading !== pack.id ? 0.5 : 1,
              }}
            >
              {pack.badge && (
                <span className="absolute -top-2 right-3 text-xs font-black px-2 py-0.5 rounded-full" style={{ background: '#FFD700', color: '#000' }}>
                  {pack.badge}
                </span>
              )}
              <div className="text-left">
                <p className="text-white font-black text-base">{pack.label}</p>
                <p className="text-yellow-400 font-bold text-sm">🪙 {pack.coins.toLocaleString()} coins</p>
              </div>
              <div className="text-right min-w-[56px]">
                {loading === pack.id ? (
                  <p className="text-white/60 text-sm">…</p>
                ) : (
                  <>
                    <p className="text-white font-black text-lg">{pack.price}</p>
                    <p className="text-white/40 text-xs">one-time</p>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', fontSize: 12, textAlign: 'center', margin: '-4px 16px 8px' }}>{error}</p>
        )}

        <div className="px-4 pb-5 text-center">
          <p className="text-white/25 text-xs mb-3">Secure payment via Stripe. Coins are game credits — no cash value.</p>
          <button onClick={onClose} disabled={loading !== null} className="text-white/40 text-sm hover:text-white/70 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
