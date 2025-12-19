import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FollowRequest from '@/models/FollowRequest';
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

// GET /api/social/follow-status/:userId - Check follow status with a user
export async function GET(
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

    // Check if there's a follow request
    const followRequest = await FollowRequest.findOne({
      fromUserId: currentUserId,
      toUserId: targetUserId,
      status: { $in: ['pending', 'accepted'] },
    }).lean();

    if (!followRequest) {
      return NextResponse.json({
        following: false,
        requested: false,
        requestId: null,
      });
    }

    return NextResponse.json({
      following: followRequest.status === 'accepted',
      requested: followRequest.status === 'pending',
      requestId: followRequest._id.toString(),
    });
  } catch (error: any) {
    console.error('Get follow status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

