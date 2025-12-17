import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_PRO;
const appUrl = process.env.APP_URL || 'http://localhost:3000';

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Validate price/product ID and get details for the bill
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PRICE_PRO is not configured' }, { status: 400 });
    }

    let resolvedPriceId = priceId;
    let amount = 0;
    let currency = 'usd';
    let planName = 'Pro Plan';

    try {
      if (priceId.startsWith('prod_')) {
        const product = await stripe.products.retrieve(priceId);
        planName = product.name;
        
        let price: Stripe.Price;
        if (product.default_price) {
          const priceIdToGet = typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id;
          price = await stripe.prices.retrieve(priceIdToGet);
        } else {
          const prices = await stripe.prices.list({ product: priceId, active: true, limit: 1 });
          if (prices.data.length > 0) {
            price = prices.data[0];
          } else {
            return NextResponse.json({ error: 'This product has no active prices' }, { status: 400 });
          }
        }
        resolvedPriceId = price.id;
        amount = (price.unit_amount || 0) / 100;
        currency = price.currency;
      } else {
        const price = await stripe.prices.retrieve(priceId);
        resolvedPriceId = price.id;
        amount = (price.unit_amount || 0) / 100;
        currency = price.currency;
        const product = await stripe.products.retrieve(price.product as string);
        planName = product.name;
      }
    } catch (err: any) {
      return NextResponse.json({ error: `Stripe error: ${err.message}` }, { status: 400 });
    }

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      customer_email: user.email,
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    // 4. Save a "pending" Bill record (the "before" part)
    await Bill.create({
      userId: userId,
      stripeSessionId: session.id,
      amount: amount,
      currency: currency,
      planName: planName,
      status: 'pending',
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}


