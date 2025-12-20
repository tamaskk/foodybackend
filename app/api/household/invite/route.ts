import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import User from '@/models/User';
import HouseholdInvitation from '@/models/HouseholdInvitation';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/jwt';
import AchievementService from '@/services/achievement.service';

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

    if (!user.householdId) {
      return NextResponse.json({ error: 'You are not in a household' }, { status: 400 });
    }

    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const inviteEmail = email.trim().toLowerCase();

    // Validate email format (simple but strict enough to block obvious invalid addresses)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Check if user is inviting themselves
    if (inviteEmail === user.email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    const household = await Household.findById(user.householdId);
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Find the invited user by email (must exist in the system)
    const invitedUser = await User.findOne({ email: inviteEmail });
    if (!invitedUser) {
      return NextResponse.json({ error: 'No user found with this email' }, { status: 404 });
    }

    // Check if invited user is already in a household
    if (invitedUser.householdId) {
      if (invitedUser.householdId.toString() === household._id.toString()) {
        return NextResponse.json({ error: 'This user is already in your household' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'This user is already in another household' }, { status: 400 });
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await HouseholdInvitation.findOne({
      householdId: household._id,
      invitedUserEmail: inviteEmail,
      status: 'pending',
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation has already been sent to this user' }, { status: 400 });
    }

    // Create invitation
    const invitation = new HouseholdInvitation({
      householdId: household._id,
      invitedByUserId: userId,
      invitedUserEmail: inviteEmail,
      invitedUserId: invitedUser._id,
      status: 'pending',
    });

    await invitation.save();

    // Track achievement (async, don't wait for it)
    AchievementService.trackAndCheck(userId, 'household_actions').catch(err => 
      console.error('Achievement tracking error:', err)
    );

    // Create notification for the invited user (align with Notification schema)
    const notification = new Notification({
      userId: invitedUser._id,
      title: 'Household invitation',
      message: `${user.name} invited you to join household "${household.name}"`,
      type: 'info',
      read: false,
      sentBy: user.email || 'system',
      invitationId: invitation._id,
      invitationStatus: 'pending',
      householdId: household._id,
      householdName: household.name,
      invitedByUserId: user._id,
      invitedByUserName: user.name,
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.invitedUserEmail,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invitation' }, { status: 500 });
  }
}

