import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FollowRequest from '@/models/FollowRequest';
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
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// POST /api/social/unfollow/:userId - Unfollow a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const currentUserId = auth.user!.userId;
    const { userId: targetUserId } = await params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
    }

    // Find the accepted follow request
    const followRequest = await FollowRequest.findOne({
      fromUserId: currentUserId,
      toUserId: targetUserId,
      status: 'accepted',
    });

    if (!followRequest) {
      return NextResponse.json({ error: 'You are not following this user' }, { status: 404 });
    }

    // Delete the follow request
    await FollowRequest.findByIdAndDelete(followRequest._id);

    // Update follower/following counts
    await User.findByIdAndUpdate(targetUserId, { $inc: { followers: -1 } });
    await User.findByIdAndUpdate(currentUserId, { $inc: { following: -1 } });

    return NextResponse.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


