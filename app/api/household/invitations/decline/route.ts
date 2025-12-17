import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import HouseholdInvitation from '@/models/HouseholdInvitation';
import Notification from '@/models/Notification';
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

    // Find the invitation
    const invitation = await HouseholdInvitation.findById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify invitation is for this user
    if (invitation.invitedUserEmail !== user.email) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation is no longer valid' }, { status: 400 });
    }

    // Update invitation status
    invitation.status = 'declined';
    invitation.invitedUserId = new mongoose.Types.ObjectId(userId);
    await invitation.save();

    // Notify inviter that invitation was declined
    const inviter = await User.findById(invitation.invitedByUserId);
    if (inviter) {
      const notification = new Notification({
        userId: invitation.invitedByUserId,
        title: 'Household invitation declined',
        message: `${user.name} declined your household invitation`,
        type: 'warning',
        read: false,
        sentBy: user.email || 'system',
        invitationId: invitation._id,
        invitationStatus: 'declined',
        householdId: invitation.householdId,
        invitedByUserId: invitation.invitedByUserId,
        invitedByUserName: inviter.name,
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error: any) {
    console.error('Error declining invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to decline invitation' }, { status: 500 });
  }
}

