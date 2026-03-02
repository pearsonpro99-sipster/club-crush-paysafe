import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 402 }
      );
    }

    return NextResponse.json({
      paid:     true,
      coins:    parseInt(session.metadata?.coins ?? '0', 10),
      clientId: session.metadata?.clientId ?? '',
      packId:   session.metadata?.packId   ?? '',
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
