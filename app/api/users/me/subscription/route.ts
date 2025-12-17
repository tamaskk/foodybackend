import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Household from '@/models/Household';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('subscriptionTier subscriptionEndDate householdId');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default to user's personal subscription
    let effectiveTier = user.subscriptionTier;
    let effectiveEndDate = user.subscriptionEndDate;
    let source = 'personal';

    // Check if user is in a household and if the owner has Pro
    if (user.householdId) {
      const household = await Household.findById(user.householdId).populate('createdBy', 'subscriptionTier subscriptionEndDate');
      if (household) {
        const owner = household.createdBy as any;
        if (owner && owner.subscriptionTier === 'pro') {
          // Inherit Pro benefits from household owner
          effectiveTier = 'pro';
          effectiveEndDate = owner.subscriptionEndDate;
          source = 'household';
        }
      }
    }

    return NextResponse.json({
      subscriptionTier: effectiveTier,
      subscriptionEndDate: effectiveEndDate,
      personalTier: user.subscriptionTier,
      source: source, // 'personal' or 'household'
    });
  } catch (error: any) {
    console.error('Get subscription status error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
