import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FollowRequest from '@/models/FollowRequest';
import Notification from '@/models/Notification';
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

// POST /api/social/follow-requests/:id/reject - Reject a follow request
export async function POST(
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

    // Find and update the follow request (must be for current user and pending)
    const followRequest = await FollowRequest.findOne({
      _id: id,
      toUserId: userId,
      status: 'pending',
    });

    if (!followRequest) {
      return NextResponse.json({ error: 'Follow request not found' }, { status: 404 });
    }

    // Update status to rejected
    followRequest.status = 'rejected';
    await followRequest.save();

    // Mark the notification as read
    await Notification.updateMany(
      {
        relatedId: id,
        type: 'follow_request',
        userId: userId,
      },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true, message: 'Follow request rejected' });
  } catch (error: any) {
    console.error('Reject follow request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

