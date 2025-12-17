import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Bill from '@/models/Bill';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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

    // 2. Check if user is on Pro plan
    if (user.subscriptionTier !== 'pro') {
      return NextResponse.json({ error: 'You are not on a Pro plan' }, { status: 400 });
    }

    // 3. Find the user's active subscription from their latest paid bill
    const latestBill = await Bill.findOne({ 
      userId: userId, 
      status: 'paid',
      stripeSubscriptionId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });

    if (!latestBill || !latestBill.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // 4. Cancel the subscription in Stripe IMMEDIATELY (not at period end)
    console.log(`Canceling Stripe subscription IMMEDIATELY: ${latestBill.stripeSubscriptionId} for user ${userId}`);
    let canceledSubscription;
    try {
      // Using del() instead of cancel() for immediate cancellation
      // or cancel() with prorate and invoice_now options
      canceledSubscription = await stripe.subscriptions.cancel(latestBill.stripeSubscriptionId);
      console.log(`✅ Stripe subscription canceled IMMEDIATELY. Status: ${canceledSubscription.status}`);
    } catch (stripeError: any) {
      console.error('❌ Stripe cancellation error:', stripeError);
      return NextResponse.json({ error: `Failed to cancel subscription in Stripe: ${stripeError.message}` }, { status: 500 });
    }

    // 5. Update user to free tier in database
    await User.findByIdAndUpdate(userId, {
      subscriptionTier: 'free',
      subscriptionEndDate: null,
    });
    console.log(`✅ User ${userId} downgraded to Free tier in database`);

    return NextResponse.json({ 
      message: 'Subscription cancelled successfully in Stripe and database',
      subscriptionTier: 'free',
      stripeStatus: canceledSubscription.status
    });
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}

