'use client';

import { useState } from 'react';

interface CoinShopModalProps {
  onClose: () => void;
  clientId: string;
  returnPath?: string;
}

const PACKS = [
  { id: 'starter', coins: 500,  price: '\u00a30.99', label: 'Starter Pack',  badge: '' },
  { id: 'fan',     coins: 1500, price: '\u00a32.49', label: 'Fan Pack',       badge: 'POPULAR' },
  { id: 'season',  coins: 5000, price: '\u00a34.99', label: 'Season Pass',    badge: 'BEST VALUE' },
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
          packId, clientId,
          returnPath: returnPath ?? (clientId ? `/client/${clientId}` : '/'),
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Could not start checkout \u2014 try again.');
        setLoading(null);
      }
    } catch {
      setError('Something went wrong \u2014 try again.');
      setLoading(null);
    }
  };

  return (
    /* Backdrop — click anywhere outside card to close */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360, borderRadius: 22,
          background: '#1a0a22', border: '2px solid #8E11FF55',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8E11FF 0%, #630CB3 100%)',
          padding: '16px 18px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>\uD83E\uDE99</span>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>Get Coins</span>
            </div>
            <p style={{ color: '#ffffff88', fontSize: 12, margin: '2px 0 0' }}>
              Extra moves \u00b7 level skips \u00b7 score boosts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: 32, height: 32,
              color: '#fff', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            \u2715
          </button>
        </div>

        {/* Packs */}
        <div style={{ padding: '14px 14px 4px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {PACKS.map(pack => (
            <button
              key={pack.id}
              onClick={() => handleBuy(pack.id)}
              disabled={loading !== null}
              style={{
                position: 'relative',
                width: '100%', borderRadius: 14,
                padding: '12px 14px',
                background: loading === pack.id ? '#8E11FF22' : '#ffffff0a',
                border: `1.5px solid ${loading === pack.id ? '#8E11FF80' : pack.badge === 'POPULAR' ? '#8E11FF44' : '#ffffff15'}`,
                cursor: loading !== null ? 'default' : 'pointer',
                opacity: loading !== null && loading !== pack.id ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              {pack.badge && (
                <span style={{
                  position: 'absolute', top: -8, right: 10,
                  fontSize: 8, fontWeight: 900, letterSpacing: 0.8,
                  padding: '2px 7px', borderRadius: 20,
                  background: pack.badge === 'POPULAR' ? '#8E11FF' : '#DFF86C',
                  color: pack.badge === 'POPULAR' ? '#fff' : '#000',
                }}>
                  {pack.badge}
                </span>
              )}
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>{pack.label}</p>
                <p style={{ color: '#DFF86C', fontWeight: 700, fontSize: 12, margin: '2px 0 0' }}>
                  \uD83E\uDE99 {pack.coins.toLocaleString()} coins
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {loading === pack.id ? (
                  <p style={{ color: '#ffffff60', fontSize: 12 }}>\u2026</p>
                ) : (
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0 }}>{pack.price}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: '#ff6b6b', fontSize: 12, textAlign: 'center', margin: '6px 14px 0' }}>{error}</p>
        )}

        {/* Footer */}
        <div style={{ padding: '10px 14px 16px', textAlign: 'center' }}>
          <p style={{ color: '#ffffff20', fontSize: 10, margin: '0 0 10px' }}>
            Secure payment \u00b7 Coins are game credits
          </p>
          {/* Always enabled — user must be able to dismiss at any time */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#ffffff55', fontSize: 13, cursor: 'pointer', padding: '6px 16px',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
