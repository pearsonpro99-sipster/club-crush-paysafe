import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const COIN_PACKS: Record<string, { coins: number; amount: number; label: string }> = {
  starter: { coins: 500,  amount: 99,  label: 'Starter Pack'  },
  fan:     { coins: 1500, amount: 249, label: 'Fan Pack'       },
  season:  { coins: 5000, amount: 499, label: 'Season Pass'   },
};

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${pack.label} — ${pack.coins.toLocaleString()} coins`,
            description:
              'Game credits for Fan Games. Used to continue levels, skip stages ' +
              'and boost your fan score. Non-refundable.',
          },
          unit_amount: pack.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: {
        coins:    pack.coins.toString(),
        clientId: clientId ?? '',
        packId,
      },
      success_url: `${origin}/topup/success?session_id={CHECKOUT_SESSION_ID}&client=${clientId ?? ''}`,
      cancel_url:  `${origin}${returnPath ?? '/'}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
