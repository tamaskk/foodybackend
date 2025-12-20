import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';
import AchievementService from '@/services/achievement.service';

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

// POST /api/social/posts/[id]/like - Toggle like on a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id: postId } = await params;
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check if post exists
    const post = await SocialPost.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const likedUserIds = post.likedUserIds || [];
    const userLikedIndex = likedUserIds.findIndex((id: mongoose.Types.ObjectId) => id.toString() === userId);

    if (userLikedIndex !== -1) {
      // Unlike: remove the user ID from the array
      likedUserIds.splice(userLikedIndex, 1);
      await SocialPost.updateOne(
        { _id: postId },
        { $set: { likedUserIds } }
      );
      return NextResponse.json({
        liked: false,
        likes: likedUserIds.length,
      });
    } else {
      // Like: add the user ID to the array
      likedUserIds.push(userIdObj);
      await SocialPost.updateOne(
        { _id: postId },
        { $set: { likedUserIds } }
      );
      
      // Track achievement (async, don't wait for it)
      AchievementService.trackAndCheck(userId, 'likes_given').catch(err => 
        console.error('Achievement tracking error:', err)
      );
      
      return NextResponse.json({
        liked: true,
        likes: likedUserIds.length,
      });
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
