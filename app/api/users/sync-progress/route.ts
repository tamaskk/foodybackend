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
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// POST /api/users/sync-progress - Sync existing data to progress counters
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    
    const userId = auth.user!.userId;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Count existing data
    const recipesCreated = await Recipe.countDocuments({ userId: userIdObj });
    const postsCreated = await SocialPost.countDocuments({ userId: userIdObj });
    
    // Count saves (posts where user is in savedUserIds)
    const savedRecipes = await SocialPost.countDocuments({
      savedUserIds: userIdObj
    });
    
    // Count likes given
    const likesGiven = await SocialPost.countDocuments({
      likedUserIds: userIdObj
    });
    
    // Count comments (sum of all comments across posts by this user)
    const postsWithComments = await SocialPost.find().select('comments').lean();
    let commentsCreated = 0;
    for (const post of postsWithComments) {
      const userComments = (post.comments || []).filter(
        (c: any) => c.userId.toString() === userId
      );
      commentsCreated += userComments.length;
    }
    
    // Get user for follower count
    const user = await User.findById(userIdObj);
    
    // Update progress field
    const updatedUser = await User.findByIdAndUpdate(
      userIdObj,
      {
        $set: {
          progress: {
            recipes_created: recipesCreated,
            recipes_saved: savedRecipes,
            photos_analyzed: 0, // Can't retroactively count
            recipes_imported: 0, // Can't retroactively count
            ai_recipes_generated: 0, // Can't retroactively count
            posts_created: postsCreated,
            likes_given: likesGiven,
            comments_created: commentsCreated,
            followers_count: user?.followers || 0,
            household_actions: 0, // Can't retroactively count
          }
        }
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Progress synced successfully',
      progress: updatedUser?.progress,
      synced: {
        recipes_created: recipesCreated,
        posts_created: postsCreated,
        recipes_saved: savedRecipes,
        likes_given: likesGiven,
        comments_created: commentsCreated,
        followers_count: user?.followers || 0,
      }
    });
  } catch (error: any) {
    console.error('Sync progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

