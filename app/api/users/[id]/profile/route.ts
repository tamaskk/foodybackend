import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import SocialPost from '@/models/SocialPost';
import FollowRequest from '@/models/FollowRequest';
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

// GET /api/users/[id]/profile - target user's profile with recipes and total likes on their posts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;
    const userObjId = new mongoose.Types.ObjectId(id);

    const user = await User.findById(userObjId, { password: 0 }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipes = await Recipe.find({ userId: userObjId })
      .select({ title: 1, description: 1, type: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    const agg = await SocialPost.aggregate([
      { $match: { userId: userObjId } },
      { $project: { likesCount: { $size: { $ifNull: ['$likedUserIds', []] } } } },
      { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
    ]);
    const totalLikes = agg.length > 0 ? agg[0].totalLikes : 0;

    // Check if viewer is following this user (if private account)
    const currentUserId = auth.user!.userId;
    const isOwnProfile = currentUserId === id;
    const isPrivate = user.isPrivate ?? false;
    let canViewContent = !isPrivate || isOwnProfile;

    // If private and not own profile, check if following
    if (isPrivate && !isOwnProfile) {
      const followRequest = await FollowRequest.findOne({
        fromUserId: new mongoose.Types.ObjectId(currentUserId),
        toUserId: userObjId,
        status: 'accepted',
      });
      canViewContent = !!followRequest;
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        isPrivate: isPrivate,
        subscriptionEndDate: user.subscriptionEndDate,
        likes: totalLikes,
        followers: user.followers || 0,
        following: user.following || 0,
        streak: user.streak || 0,
        bio: 'Home cook sharing quick, cozy recipes.',
        recipeBackgrounds: user.recipeBackgrounds || {
          breakfast: '#FFF3D9',
          lunch: '#DDF6FF',
          dinner: '#FFE5F3',
          snack: '#F6F4F0',
          drink: '#E8F6F5',
        },
      },
      recipes: canViewContent ? recipes.map((r: any) => ({
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        type: r.type,
      })) : [],
      canViewContent,
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
