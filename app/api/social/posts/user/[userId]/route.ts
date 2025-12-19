import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
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
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// GET /api/social/posts/user/:userId - Get posts by specific user
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

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Check if user exists
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if viewer can see this user's posts
    const isOwnProfile = currentUserId === targetUserId;
    const isPrivate = targetUser.isPrivate ?? false;
    let canViewContent = !isPrivate || isOwnProfile;

    if (isPrivate && !isOwnProfile) {
      const followRequest = await FollowRequest.findOne({
        fromUserId: new mongoose.Types.ObjectId(currentUserId),
        toUserId: new mongoose.Types.ObjectId(targetUserId),
        status: 'accepted',
      });
      canViewContent = !!followRequest;
    }

    if (!canViewContent) {
      return NextResponse.json({ posts: [], pagination: { page, limit, hasMore: false, total: 0 } });
    }

    // Get user's posts
    const postDocs = await SocialPost.find({ userId: new mongoose.Types.ObjectId(targetUserId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    const posts = postDocs.map((p) => p.toObject());

    // Fetch recipe info
    const recipeIds = [...new Set(posts.map((p: any) => p.recipeId?.toString()).filter(Boolean))];
    const recipes = recipeIds.length > 0 ? await Recipe.find({ _id: { $in: recipeIds } }).lean() : [];
    const recipeMap = new Map(recipes.map((r: any) => [r._id.toString(), r]));

    const enrichedPosts = posts.map((post: any) => {
      const postId = post._id.toString();
      const recipe = post.recipeId ? recipeMap.get(post.recipeId.toString()) : null;
      const isOwnPost = post.userId?.toString() === currentUserId;

      const likedUserIds = Array.isArray(post.likedUserIds) ? post.likedUserIds : [];
      const savedUserIds = Array.isArray(post.savedUserIds) ? post.savedUserIds : [];
      const comments = Array.isArray(post.comments) ? post.comments : [];

      return {
        id: postId,
        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          handle: `@${targetUser.username}`,
          avatarColor: '#E0E0E0',
          isPrivate: targetUser.isPrivate ?? false,
        },
        title: post.title,
        body: post.body,
        imageColor: post.imageColor || '#FFF3D0',
        imageUrl: post.imageUrl || null,
        imageUrls: post.imageUrls || [],
        isPoll: post.isPoll || false,
        pollOptions: post.pollOptions || [],
        likes: likedUserIds.length,
        saves: savedUserIds.length,
        comments: comments.length,
        liked: likedUserIds.some((id: any) => id.toString() === currentUserId),
        saved: savedUserIds.some((id: any) => id.toString() === currentUserId),
        isOwnPost: isOwnPost,
        recipe: recipe ? {
          id: recipe._id.toString(),
          title: recipe.title,
          description: recipe.description,
          picture: recipe.picture,
          type: recipe.type,
          code: recipe.code,
        } : null,
        createdAt: post.createdAt,
      };
    });

    const totalPosts = await SocialPost.countDocuments({ userId: new mongoose.Types.ObjectId(targetUserId) });
    const hasMore = skip + limit < totalPosts;

    return NextResponse.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        hasMore,
        total: totalPosts,
      },
    });
  } catch (error: any) {
    console.error('Get user posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

