import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Looks up a Paysafe payment handle by merchantRefNum and confirms it paid.
// Called by /topup/success after Paysafe redirects back on_completed.
// ---------------------------------------------------------------------------

const PAYSAFE_API_BASE   = process.env.PAYSAFE_API_BASE   ?? 'https://api.test.paysafe.com';
const PAYSAFE_API_KEY    = process.env.PAYSAFE_API_KEY    ?? '';
const PAYSAFE_API_SECRET = process.env.PAYSAFE_API_SECRET ?? '';

const COIN_PACKS: Record<string, number> = {
  starter: 500,
  fan:     1500,
  season:  5000,
};

function basicAuth() {
  return 'Basic ' + Buffer.from(`${PAYSAFE_API_KEY}:${PAYSAFE_API_SECRET}`).toString('base64');
}

export async function GET(req: NextRequest) {
  const merchantRef = req.nextUrl.searchParams.get('merchant_ref');
  if (!merchantRef) {
    return NextResponse.json({ error: 'Missing merchant_ref' }, { status: 400 });
  }

  // Extract packId from merchantRefNum format: cc-{packId}-{timestamp}
  const packId = merchantRef.split('-')[1] ?? '';
  const coins  = COIN_PACKS[packId] ?? 0;

  try {
    // Search for the payment handle by merchant reference
    const res = await fetch(
      `${PAYSAFE_API_BASE}/paymenthub/v1/paymenthandles?merchantRefNum=${encodeURIComponent(merchantRef)}`,
      {
        headers: {
          'Authorization': basicAuth(),
          'Content-Type':  'application/json',
        },
      },
    );

    const data = await res.json() as {
      paymentHandles?: { status: string; merchantRefNum: string }[];
      error?: { code: string; message: string };
    };

    if (!res.ok) {
      console.error('Paysafe verify error:', data);
      return NextResponse.json({ error: data.error?.message ?? 'Verification failed' }, { status: 500 });
    }

    // Find the matching handle and confirm it reached PAYABLE / COMPLETED status
    const handle = data.paymentHandles?.find(h => h.merchantRefNum === merchantRef);
    const paid   = handle?.status === 'PAYABLE' || handle?.status === 'COMPLETED';

    if (!paid) {
      return NextResponse.json(
        { error: 'Payment not completed', status: handle?.status ?? 'UNKNOWN' },
        { status: 402 },
      );
    }

    return NextResponse.json({ paid: true, coins, packId });
  } catch (err) {
    console.error('Paysafe verify error:', err);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
