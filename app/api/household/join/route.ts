import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import User from '@/models/User';
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
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.householdId) {
      return NextResponse.json({ error: 'You are already in a household. Leave your current household first.' }, { status: 400 });
    }

    const { inviteCode } = await req.json();

    if (!inviteCode || inviteCode.trim().length === 0) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find household by invite code
    const household = await Household.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!household) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
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

    // Track achievement (async, don't wait for it)
    AchievementService.trackAndCheck(userId!, 'household_actions').catch(err => 
      console.error('Achievement tracking error:', err)
    );

    return NextResponse.json({
      success: true,
      household: {
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
        members: household.members,
        createdBy: household.createdBy,
      },
    });
  } catch (error: any) {
    console.error('Error joining household:', error);
    return NextResponse.json({ error: error.message || 'Failed to join household' }, { status: 500 });
  }
}

