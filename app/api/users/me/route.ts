import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
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

// GET /api/users/me - current user's profile with recipes and total likes on their posts
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userObjId, { password: 0 }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Recipes for this user
    const recipes = await Recipe.find({ userId: userObjId })
      .select({ title: 1, description: 1, type: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    // Total likes across this user's posts (sum of likedUserIds length)
    const agg = await SocialPost.aggregate([
      { $match: { userId: userObjId } },
      { $project: { likesCount: { $size: { $ifNull: ['$likedUserIds', []] } } } },
      { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
    ]);
    const totalLikes = agg.length > 0 ? agg[0].totalLikes : 0;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        isPrivate: user.isPrivate ?? false,
        subscriptionEndDate: user.subscriptionEndDate,
        likes: totalLikes,
        followers: user.followers || 0,
        following: user.following || 0,
        bio: 'Home cook sharing quick, cozy recipes.',
        recipeBackgrounds: user.recipeBackgrounds || {
          breakfast: '#FFF3D9',
          lunch: '#DDF6FF',
          dinner: '#FFE5F3',
          snack: '#F6F4F0',
          drink: '#E8F6F5',
        },
      },
      recipes: recipes.map((r: any) => ({
        id: r._id.toString(),
        title: r.title,
        description: r.description,
        type: r.type,
      })),
    });
  } catch (error: any) {
    console.error('Get current user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

