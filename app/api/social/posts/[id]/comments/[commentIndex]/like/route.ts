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

// POST /api/social/posts/[id]/comments/[commentIndex]/like - Toggle like on a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentIndex: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id: postId, commentIndex } = await params;
    const commentIdx = parseInt(commentIndex);
    const userIdObj = new mongoose.Types.ObjectId(userId);

    if (isNaN(commentIdx) || commentIdx < 0) {
      return NextResponse.json(
        { error: 'Invalid comment index' },
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

    const comments = post.comments || [];
    
    // Comments are stored newest last, so we need to reverse to get the correct index
    // When fetching, we reverse to show newest first, so index 0 in UI = last in array
    const reversedComments = [...comments].reverse();
    
    if (commentIdx >= reversedComments.length) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get the actual comment from the reversed array
    const comment = reversedComments[commentIdx];
    const actualIndex = comments.length - 1 - commentIdx; // Convert UI index to actual array index
    
    const likedUserIds = comment.likedUserIds || [];
    const userLikedIndex = likedUserIds.findIndex((id: mongoose.Types.ObjectId) => id.toString() === userId);

    if (userLikedIndex !== -1) {
      // Unlike: remove the user ID from the array
      likedUserIds.splice(userLikedIndex, 1);
    } else {
      // Like: add the user ID to the array
      likedUserIds.push(userIdObj);
    }

    // Update the comment in the array
    comments[actualIndex] = {
      ...comment,
      likedUserIds,
      likes: likedUserIds.length,
    };

    await SocialPost.updateOne(
      { _id: postId },
      { $set: { comments } }
    );

    return NextResponse.json({
      liked: userLikedIndex === -1,
      likes: likedUserIds.length,
    });
  } catch (error: any) {
    console.error('Toggle comment like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
