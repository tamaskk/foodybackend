import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User household check:', { userId, householdId: user.householdId });

    if (!user.householdId) {
      console.log('User has no household');
      return NextResponse.json({
        success: true,
        household: null,
      });
    }

    const household = await Household.findById(user.householdId).populate('members', 'name email username');
    console.log('Household found:', household ? { id: household._id, name: household.name, membersCount: household.members?.length } : 'null');
    
    if (!household) {
      // User has householdId but household doesn't exist, clear it
      await User.updateOne(
        { _id: userId },
        { $set: { householdId: null } }
      );
      return NextResponse.json({
        success: true,
        household: null,
      });
    }

    return NextResponse.json({
      success: true,
      household: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
        members: household.members,
        createdBy: household.createdBy,
        createdAt: household.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting household:', error);
    return NextResponse.json({ error: error.message || 'Failed to get household' }, { status: 500 });
  }
}

