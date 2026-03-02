import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Paysafe credentials — set these in .env.local + Vercel environment variables
//
//   PAYSAFE_API_KEY        from the Paysafe merchant portal (API Key tab)
//   PAYSAFE_API_SECRET     paired secret for the API key
//   PAYSAFE_ACCOUNT_ID     card account ID from your merchant account
//   PAYSAFE_API_BASE       https://api.test.paysafe.com  (sandbox)
//                          https://api.paysafe.com        (production)
// ---------------------------------------------------------------------------

const PAYSAFE_API_BASE   = process.env.PAYSAFE_API_BASE   ?? 'https://api.test.paysafe.com';
const PAYSAFE_API_KEY    = process.env.PAYSAFE_API_KEY    ?? '';
const PAYSAFE_API_SECRET = process.env.PAYSAFE_API_SECRET ?? '';
const PAYSAFE_ACCOUNT_ID = process.env.PAYSAFE_ACCOUNT_ID ?? '';

const COIN_PACKS: Record<string, { coins: number; amount: number; label: string }> = {
  starter: { coins: 500,  amount: 99,  label: 'Starter Pack' },
  fan:     { coins: 1500, amount: 249, label: 'Fan Pack'      },
  season:  { coins: 5000, amount: 499, label: 'Season Pass'   },
};

function basicAuth() {
  return 'Basic ' + Buffer.from(`${PAYSAFE_API_KEY}:${PAYSAFE_API_SECRET}`).toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const { packId, clientId, returnPath } = await req.json() as {
      packId: string;
      clientId?: string;
      returnPath?: string;
    };

    const pack = COIN_PACKS[packId];
    if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });

    const host   = req.headers.get('host') ?? 'localhost:3000';
    const proto  = host.includes('localhost') ? 'http' : 'https';
    const origin = `${proto}://${host}`;

    // Unique order reference — passed through to success page, then used
    // by /api/checkout/verify to look up the payment status server-side
    const merchantRefNum = `cc-${packId}-${Date.now()}`;

    const body = {
      merchantRefNum,
      transactionType: 'PAYMENT',
      paymentType:     'CARD',
      amount:          pack.amount,   // minor units (pence for GBP)
      currencyCode:    'GBP',
      card: {
        accountId: PAYSAFE_ACCOUNT_ID,
      },
      returnLinks: [
        {
          rel:    'on_completed',
          href:   `${origin}/topup/success?merchant_ref=${merchantRefNum}&client=${clientId ?? ''}`,
          method: 'GET',
        },
        {
          rel:    'on_failed',
          href:   `${origin}${returnPath ?? '/'}?paysafe=failed`,
          method: 'GET',
        },
        {
          rel:    'on_cancelled',
          href:   `${origin}${returnPath ?? '/'}`,
          method: 'GET',
        },
      ],
    };

    const headers: Record<string, string> = {
      'Authorization': basicAuth(),
      'Content-Type':  'application/json',
    };

    // Sandbox only: instructs Paysafe to simulate external card network responses
    if (PAYSAFE_API_BASE.includes('test')) {
      headers['Simulator'] = 'EXTERNAL';
    }

    const res = await fetch(`${PAYSAFE_API_BASE}/paymenthub/v1/paymenthandles`, {
      method:  'POST',
      headers,
      body:    JSON.stringify(body),
    });

    const data = await res.json() as {
      id?:                 string;
      paymentHandleToken?: string;
      status?:             string;
      links?:              { rel: string; href: string }[];
      error?:              { code: string; message: string };
    };

    if (!res.ok) {
      console.error('Paysafe error:', data);
      return NextResponse.json(
        { error: data.error?.message ?? 'Paysafe checkout error' },
        { status: 500 },
      );
    }

    // Paysafe returns the hosted payment page URL in links[] with rel "hosted_payment"
    const redirectLink = data.links?.find(
      l => l.rel === 'hosted_payment' || l.rel === 'redirect',
    );

    if (!redirectLink?.href) {
      console.error('No redirect link in Paysafe response:', data);
      return NextResponse.json({ error: 'No redirect URL from Paysafe' }, { status: 500 });
    }

    return NextResponse.json({ url: redirectLink.href });
  } catch (err) {
    console.error('Paysafe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
