import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import AchievementService from '@/services/achievement.service';

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

    // Check if user already has a household
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.householdId) {
      return NextResponse.json({ error: 'You are already in a household. Leave your current household first.' }, { status: 400 });
    }

    const { name } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await Household.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Household.findOne({ inviteCode });
    }

    // Create household
    const household = new Household({
      name: name.trim(),
      members: [userId],
      createdBy: userId,
      inviteCode,
    });

    await household.save();
    console.log('Household created:', { id: household._id, name: household.name });

    // Update user's household reference using updateOne to bypass Mongoose schema cache issues
    await User.updateOne(
      { _id: userId },
      { $set: { householdId: household._id } }
    );
    
    // Verify it was saved
    const updatedUser = await User.findById(userId);
    console.log('User updated with householdId:', { userId, householdId: updatedUser?.householdId });

    // Track achievement (async, don't wait for it)
    AchievementService.trackAndCheck(userId!, 'household_actions').catch(err => 
      console.error('Achievement tracking error:', err)
    );

    // Populate members for response
    const populatedHousehold = await Household.findById(household._id).populate('members', 'name email username');

    return NextResponse.json({
      success: true,
      household: {
        id: populatedHousehold!._id,
        name: populatedHousehold!.name,
        inviteCode: populatedHousehold!.inviteCode,
        members: populatedHousehold!.members,
        createdBy: populatedHousehold!.createdBy,
      },
    });
  } catch (error: any) {
    console.error('Error creating household:', error);
    return NextResponse.json({ error: error.message || 'Failed to create household' }, { status: 500 });
  }
}

