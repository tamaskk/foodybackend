import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret');
    }
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const sessionId = session.id;

        console.log(`Payment successful for session ${sessionId} (user ${userId})`);

        await connectDB();
        
        // 1. Update the Bill (the "after" part)
        const subscriptionId = session.subscription as string;
        await Bill.findOneAndUpdate(
          { stripeSessionId: sessionId },
          { 
            status: 'paid',
            stripeSubscriptionId: subscriptionId
          }
        );

        // 2. Upgrade the User
        if (userId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const endDate = new Date(subscription.current_period_end * 1000);

          await User.findByIdAndUpdate(userId, {
            subscriptionTier: 'pro',
            subscriptionEndDate: endDate,
          });

          console.log(`User ${userId} upgraded to Pro until ${endDate}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
          await connectDB();
          await User.findByIdAndUpdate(userId, {
            subscriptionTier: 'free',
            subscriptionEndDate: null,
          });
          console.log(`User ${userId} subscription cancelled/expired`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

