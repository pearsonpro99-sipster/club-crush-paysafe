'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addCoins, getCoins } from '@/lib/coins';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const sessionId    = searchParams.get('session_id') ?? '';
  const clientId     = searchParams.get('client')     ?? '';

  const [status, setStatus]           = useState<'loading' | 'success' | 'error'>('loading');
  const [coinsAdded, setCoinsAdded]   = useState(0);
  const [totalCoins, setTotalCoins]   = useState(0);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    // Idempotency guard — prevents double-crediting on back/refresh
    const idempotencyKey = `stripe_done_${sessionId}`;
    if (localStorage.getItem(idempotencyKey)) {
      setCoinsAdded(0);
      setTotalCoins(getCoins());
      setStatus('success');
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then(r => r.json())
      .then((data: { paid?: boolean; coins?: number; error?: string }) => {
        if (!data.paid) { setStatus('error'); return; }
        const total = addCoins(data.coins ?? 0);
        localStorage.setItem(idempotencyKey, '1');
        setCoinsAdded(data.coins ?? 0);
        setTotalCoins(total);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  const backPath = clientId ? `/client/${clientId}` : '/';

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <p style={{ color: '#ffffff66', fontSize: 14, margin: 0 }}>Confirming payment…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ fontSize: 48 }}>❌</div>
        <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0, textAlign: 'center' }}>Payment not confirmed</h2>
        <p style={{ color: '#ffffff66', fontSize: 14, textAlign: 'center', maxWidth: 300, margin: 0, lineHeight: 1.5 }}>
          Your payment may still be processing. Check your email for a receipt from Stripe, or try again.
        </p>
        <button
          onClick={() => router.push(backPath)}
          style={{ background: '#FFD700', color: '#000', border: 'none', borderRadius: 14, padding: '14px 28px', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}
        >
          Return to Fan Games
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#111118', border: '2px solid #FFD70050', borderRadius: 24, overflow: 'hidden' }}>

        <div style={{ background: 'linear-gradient(135deg, #1a1200 0%, #111118 100%)', padding: '36px 24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🪙</div>
          <h1 style={{ color: '#FFD700', fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
            {coinsAdded > 0 ? `+${coinsAdded.toLocaleString()} Coins!` : 'Coins Ready!'}
          </h1>
          <p style={{ color: '#ffffff55', fontSize: 13, margin: 0 }}>Payment confirmed — your coins are loaded</p>
        </div>

        <div style={{ padding: '20px 24px 28px', textAlign: 'center' }}>
          <div style={{ background: '#FFD70012', border: '1px solid #FFD70035', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
            <p style={{ color: '#ffffff44', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 4px' }}>Your balance</p>
            <p style={{ color: '#FFD700', fontSize: 32, fontWeight: 900, margin: 0 }}>🪙 {totalCoins.toLocaleString()}</p>
          </div>

          <button
            onClick={() => router.push(backPath)}
            style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#FFD700', border: 'none', color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.3 }}
          >
            Back to Fan Games ›
          </button>

          <p style={{ color: '#ffffff20', fontSize: 10, marginTop: 14 }}>A receipt has been sent to your email by Stripe</p>
        </div>
      </div>
    </div>
  );
}

export default function TopupSuccessPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0f', minHeight: '100vh' }} />}>
      <SuccessContent />
    </Suspense>
  );
}
