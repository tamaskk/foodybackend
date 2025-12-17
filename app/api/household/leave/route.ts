import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
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

    if (!user.householdId) {
      return NextResponse.json({ error: 'You are not in a household' }, { status: 400 });
    }

    const household = await Household.findById(user.householdId);
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Remove user from household members
    household.members = household.members.filter((memberId) => memberId.toString() !== userId.toString());

    // If household is empty, delete it
    if (household.members.length === 0) {
      await Household.findByIdAndDelete(household._id);
    } else {
      // If the creator is leaving, assign a new creator
      if (household.createdBy.toString() === userId.toString()) {
        household.createdBy = household.members[0];
      }
      await household.save();
    }

    // Remove household reference from user using updateOne to bypass Mongoose schema cache issues
    await User.updateOne(
      { _id: userId },
      { $set: { householdId: null } }
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully left household',
    });
  } catch (error: any) {
    console.error('Error leaving household:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave household' }, { status: 500 });
  }
}

