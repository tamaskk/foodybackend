import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
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
    if (!decoded) {
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

    // Check if user is already in a household
    if (user.householdId) {
      return NextResponse.json({ error: 'You are already in a household. Leave your current household first.' }, { status: 400 });
    }

    // Get the household
    const household = await Household.findById(invitation.householdId);
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Add user to household
    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!household.members.includes(userObjectId)) {
      household.members.push(userObjectId);
      await household.save();
    }

    // Update user's household reference using updateOne to bypass Mongoose schema cache issues
    await User.updateOne(
      { _id: userId },
      { $set: { householdId: household._id } }
    );

    // Update invitation status
    invitation.status = 'accepted';
    invitation.invitedUserId = userObjectId;
    await invitation.save();

    // Create notification for the person who sent the invitation
    const invitedByUser = await User.findById(invitation.invitedByUserId);
    if (invitedByUser) {
      const notification = new Notification({
        userId: invitation.invitedByUserId,
        title: 'Household invitation accepted',
        message: `${user.name} accepted your household invitation`,
        type: 'success',
        read: false,
        sentBy: user.email || 'system',
        invitationId: invitation._id,
        invitationStatus: 'accepted',
        householdId: household._id,
        householdName: household.name,
        invitedByUserId: invitation.invitedByUserId,
        invitedByUserName: invitedByUser.name,
      });

      await notification.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined household',
      household: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
      },
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept invitation' }, { status: 500 });
  }
}

