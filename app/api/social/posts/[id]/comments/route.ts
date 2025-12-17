import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

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

// GET /api/social/posts/[id]/comments - Get comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id: postId } = await params;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await SocialPost.findById(postId).lean();
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get comments from embedded array
    const comments = (post.comments || []).slice().reverse(); // Reverse to get newest first
    
    // Apply pagination
    const paginatedComments = comments.slice(skip, skip + limit);
    
    // Fetch user info separately
    const userIds = [...new Set(paginatedComments.map((c: any) => c.userId?.toString()).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const enrichedComments = paginatedComments.map((comment: any, index: number) => {
      const user = userMap.get(comment.userId?.toString());
      const likedUserIds = comment.likedUserIds || [];

      return {
        id: `comment-${postId}-${index}-${comment.createdAt?.getTime() || Date.now()}`, // Generate ID from index
        user: user?.name || 'Unknown',
        handle: `@${user?.username || 'unknown'}`,
        text: comment.text,
        likes: likedUserIds.length,
        liked: likedUserIds.some((id: any) => id.toString() === userId),
        createdAt: comment.createdAt || new Date(),
      };
    });

    const totalComments = comments.length;
    const hasMore = skip + limit < totalComments;

    return NextResponse.json({
      comments: enrichedComments,
      pagination: {
        page,
        limit,
        hasMore,
        total: totalComments,
      },
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
