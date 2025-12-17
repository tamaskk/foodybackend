import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import HouseholdInvitation from '@/models/HouseholdInvitation';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
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

    const { invitationId } = await req.json();
    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    const invitation = await HouseholdInvitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Ensure user is owner of the household of this invitation
    const household = await Household.findById(invitation.householdId);
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    if (household.createdBy.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Only the household owner can cancel invitations' }, { status: 403 });
    }

    invitation.status = 'declined';
    await invitation.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel invitation' }, { status: 500 });
  }
}


