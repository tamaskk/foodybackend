import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import SocialPost from '@/models/SocialPost';
import { authenticateAdmin } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Total users all time and last 24 hours
    const totalUsers = await User.countDocuments();
    const usersLast24h = await User.countDocuments({ 
      createdAt: { $gte: last24Hours } 
    });

    // Total recipes all time and last 24 hours
    const totalRecipes = await Recipe.countDocuments();
    const recipesLast24h = await Recipe.countDocuments({ 
      createdAt: { $gte: last24Hours } 
    });

    // Total posts all time and last 24 hours
    const totalPosts = await SocialPost.countDocuments();
    const postsLast24h = await SocialPost.countDocuments({ 
      createdAt: { $gte: last24Hours } 
    });

    // Subscription stats (users with subscriptionTier not 'free')
    const totalSubscribers = await User.countDocuments({
      subscriptionTier: { $ne: 'free' }
    });
    const subscribersLast24h = await User.countDocuments({
      subscriptionTier: { $ne: 'free' },
      createdAt: { $gte: last24Hours }
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        last24h: usersLast24h,
      },
      recipes: {
        total: totalRecipes,
        last24h: recipesLast24h,
      },
      posts: {
        total: totalPosts,
        last24h: postsLast24h,
      },
      subscribers: {
        total: totalSubscribers,
        last24h: subscribersLast24h,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
