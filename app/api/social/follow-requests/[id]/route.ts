import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FollowRequest from '@/models/FollowRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/jwt';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// DELETE /api/social/follow-requests/:id - Cancel a follow request
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Find and delete the follow request (only if sender)
    const followRequest = await FollowRequest.findOneAndDelete({
      _id: id,
      fromUserId: userId,
      status: 'pending',
    });

    if (!followRequest) {
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 });
    }

    // Remove the notification
    await Notification.deleteMany({
      relatedId: id,
      type: 'follow_request',
    });

    return NextResponse.json({ success: true, message: 'Follow request cancelled' });
  } catch (error: any) {
    console.error('Cancel follow request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

