import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
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

// POST /api/social/posts/[id]/comment - Add a comment to a post
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
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await SocialPost.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create comment object
    const newComment = {
      userId: new mongoose.Types.ObjectId(userId),
      text: text.trim(),
      likes: 0,
      likedUserIds: [],
      createdAt: new Date(),
    };

    // Add comment to post's comments array
    const comments = post.comments || [];
    comments.push(newComment);
    await SocialPost.updateOne(
      { _id: postId },
      { $set: { comments } }
    );

    // Get user info
    const user = await User.findById(userId).lean();

    return NextResponse.json({
      comment: {
        id: `temp-${Date.now()}`, // Temporary ID since it's embedded
        user: user?.name || 'Unknown',
        handle: `@${user?.username || 'unknown'}`,
        text: newComment.text,
        likes: 0,
        liked: false,
        createdAt: newComment.createdAt,
      },
      comments: comments.length,
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
