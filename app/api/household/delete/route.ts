import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Household from '@/models/Household';
import User from '@/models/User';
import HouseholdInvitation from '@/models/HouseholdInvitation';
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

    if (!user.householdId) {
      return NextResponse.json({ error: 'You are not in a household' }, { status: 400 });
    }

    const household = await Household.findById(user.householdId);
    if (!household) {
      // Clear dangling reference
      await User.updateOne({ _id: userId }, { $set: { householdId: null } });
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    // Only household creator can delete the household
    if ((household.createdBy as any).toString() !== userId!.toString()) {
      return NextResponse.json({ error: 'Only the household owner can delete the household' }, { status: 403 });
    }

    // Remove householdId from all members
    await User.updateMany(
      { householdId: household._id },
      { $set: { householdId: null } }
    );

    // Expire pending invitations for this household
    await HouseholdInvitation.updateMany(
      { householdId: household._id, status: 'pending' },
      { $set: { status: 'expired' } }
    );

    // Delete household
    await Household.findByIdAndDelete(household._id);

    return NextResponse.json({
      success: true,
      message: 'Household deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting household:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete household' }, { status: 500 });
  }
}


