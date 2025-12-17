import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
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

// GET /api/users/[id]/likes - total likes across this user's posts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id: userId } = await params;
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Sum the lengths of likedUserIds arrays across all posts by this user
    const agg = await SocialPost.aggregate([
      { $match: { userId: userObjId } },
      { $project: { likesCount: { $size: { $ifNull: ['$likedUserIds', []] } } } },
      { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
    ]);

    const totalLikes = agg.length > 0 ? agg[0].totalLikes : 0;

    return NextResponse.json({ userId, totalLikes });
  } catch (error: any) {
    console.error('Get user likes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

