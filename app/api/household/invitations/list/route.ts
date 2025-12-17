import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import HouseholdInvitation from '@/models/HouseholdInvitation';
import Household from '@/models/Household';
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

    // Get pending invitations sent to this user's email
    const invitations = await HouseholdInvitation.find({
      invitedUserEmail: user.email,
      status: 'pending',
    })
      .populate('householdId', 'name')
      .populate('invitedByUserId', 'name username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      invitations: invitations.map((inv: any) => ({
        id: inv._id.toString(),
        household: {
          id: inv.householdId?._id?.toString(),
          name: inv.householdId?.name,
        },
        invitedBy: {
          id: inv.invitedByUserId?._id?.toString(),
          name: inv.invitedByUserId?.name,
          username: inv.invitedByUserId?.username,
        },
        createdAt: inv.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ error: error.message || 'Failed to list invitations' }, { status: 500 });
  }
}

