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

    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const household = await Household.findById(user.householdId);
    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Only the household creator can remove members
    if (household.createdBy.toString() !== userId.toString()) {
      return NextResponse.json({ error: 'Only the household creator can remove members' }, { status: 403 });
    }

    // Cannot remove yourself using this endpoint
    if (memberId === userId.toString()) {
      return NextResponse.json({ error: 'Use the leave endpoint to remove yourself' }, { status: 400 });
    }

    // Remove member from household
    household.members = household.members.filter((id) => id.toString() !== memberId);
    await household.save();

    // Remove household reference from the removed user using updateOne
    await User.updateOne(
      { _id: memberId },
      { $set: { householdId: null } }
    );

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove member' }, { status: 500 });
  }
}

