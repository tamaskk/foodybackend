import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return { error: NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// PUT /api/users/notifications - update notification settings
export async function PUT(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;
    const userObjId = new mongoose.Types.ObjectId(userId);
    
    const body = await req.json();
    const { like, comment, save, follow, achievements } = body;

    // Validate that we have at least one field to update
    if (
      typeof like !== 'boolean' &&
      typeof comment !== 'boolean' &&
      typeof save !== 'boolean' &&
      typeof follow !== 'boolean' &&
      typeof achievements !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'At least one notification setting must be provided' },
        { status: 400 }
      );
    }

    // Build update object with only the fields provided
    const updateFields: any = {};
    if (typeof like === 'boolean') updateFields['notifications.like'] = like;
    if (typeof comment === 'boolean') updateFields['notifications.comment'] = comment;
    if (typeof save === 'boolean') updateFields['notifications.save'] = save;
    if (typeof follow === 'boolean') updateFields['notifications.follow'] = follow;
    if (typeof achievements === 'boolean') updateFields['notifications.achievements'] = achievements;

    const user = await User.findByIdAndUpdate(
      userObjId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select({ password: 0 });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      notifications: user.notifications,
    });
  } catch (error: any) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

