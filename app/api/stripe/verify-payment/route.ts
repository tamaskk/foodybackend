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

    // 2. Get session_id from request body
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 3. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 4. Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        success: false,
        message: 'Payment not yet completed',
        paymentStatus: session.payment_status 
      });
    }

    await connectDB();

    // 5. Update the Bill
    const subscriptionId = session.subscription as string;
    const bill = await Bill.findOneAndUpdate(
      { stripeSessionId: sessionId },
      { 
        status: 'paid',
        stripeSubscriptionId: subscriptionId
      },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // 6. Upgrade the User
    if (session.client_reference_id === userId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const endDate = new Date(subscription.current_period_end * 1000);

      await User.findByIdAndUpdate(userId, {
        subscriptionTier: 'pro',
        subscriptionEndDate: endDate,
      });

      console.log(`User ${userId} upgraded to Pro until ${endDate}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and account upgraded to Pro!',
        subscriptionTier: 'pro',
        subscriptionEndDate: endDate
      });
    } else {
      return NextResponse.json({ 
        error: 'Session does not belong to this user' 
      }, { status: 403 });
    }

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to verify payment' 
    }, { status: 500 });
  }
}





