import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import HouseholdInvitation from '@/models/HouseholdInvitation';
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
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.householdId) {
      return NextResponse.json({ success: true, invitations: [] });
    }

    const household = await Household.findById(user.householdId);
    if (!household) {
      return NextResponse.json({ success: true, invitations: [] });
    }

    // Only household creator can view outgoing invitations
    if (household.createdBy.toString() !== userId.toString()) {
      return NextResponse.json({ success: true, invitations: [] });
    }

    const invitations = await HouseholdInvitation.find({
      householdId: household._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      invitations: invitations.map((inv: any) => ({
        id: inv._id.toString(),
        household: {
          id: household._id.toString(),
          name: household.name,
        },
        invitedUserEmail: inv.invitedUserEmail,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error listing outgoing invitations:', error);
    return NextResponse.json({ error: error.message || 'Failed to list invitations' }, { status: 500 });
  }
}


