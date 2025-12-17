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

    // Check if user is in a household and if ANY member has Pro
    if (user.householdId) {
      const household = await Household.findById(user.householdId).populate('members', 'subscriptionTier subscriptionEndDate');
      if (household && household.members) {
        // Check if any household member has a Pro subscription
        const members = household.members as any[];
        const proMember = members.find((member: any) => member.subscriptionTier === 'pro');
        
        if (proMember) {
          // Inherit Pro benefits from any Pro household member
          effectiveTier = 'pro';
          effectiveEndDate = proMember.subscriptionEndDate;
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
