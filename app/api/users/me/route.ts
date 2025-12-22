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

    const likesCount = user.likes ?? totalLikes ?? 0;
    const recipesCount = recipes.length;

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        country: user.country,
        avatarUrl: user.avatarUrl || null,
        subscriptionTier: user.subscriptionTier,
        isPrivate: user.isPrivate ?? false,
        subscriptionEndDate: user.subscriptionEndDate,
        likes: likesCount,
        recipes: recipesCount,
        xp: user.xp ?? 0,
        level: user.level ?? 1,
        followers: user.followers || 0,
        following: user.following || 0,
        streak: user.streak || 0,
        bio: user.bio || 'Home cook sharing quick, cozy recipes.',
        recipeBackgrounds: user.recipeBackgrounds || {
          breakfast: '#FFF3D9',
          lunch: '#DDF6FF',
          dinner: '#FFE5F3',
          snack: '#F6F4F0',
          drink: '#E8F6F5',
        },
        notifications: user.notifications || {
          like: true,
          comment: true,
          save: true,
          follow: true,
          achievements: true,
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

// PATCH /api/users/me - Update current user's profile
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;
    const body = await req.json();

    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.username !== undefined) {
      const trimmedUsername = body.username.trim();
      // Remove @ if user added it
      const cleanUsername = trimmedUsername.startsWith('@') ? trimmedUsername.substring(1) : trimmedUsername;
      updateFields.username = cleanUsername;
    }
    if (body.bio !== undefined) updateFields.bio = body.bio.trim();
    if (body.avatarUrl !== undefined) updateFields.avatarUrl = body.avatarUrl;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: '-password' }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl || null,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      // Duplicate key error (username already exists)
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
