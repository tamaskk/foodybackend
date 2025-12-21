import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import UserAchievement from '@/models/UserAchievement';
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

// GET /api/leaderboard/achievements - Get global achievements leaderboard
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const currentUserId = auth.user!.userId;
    const currentUserObjId = new mongoose.Types.ObjectId(currentUserId);

    // Get achievementId from query params (optional filter)
    const { searchParams } = new URL(req.url);
    const achievementId = searchParams.get('achievementId');

    let achievementCounts;

    if (achievementId) {
      // Filter by specific achievement - count documents for that achievement
      achievementCounts = await UserAchievement.aggregate([
        { $match: { achievementId } },
        {
          $group: {
            _id: '$userId',
            totalAchievements: { $sum: 1 } // Count number of tiers unlocked
          }
        },
        { $sort: { totalAchievements: -1 } },
        { $limit: 50 }
      ]);
    } else {
      // Count all achievements per user
      achievementCounts = await UserAchievement.aggregate([
        {
          $group: {
            _id: '$userId',
            totalAchievements: { $sum: 1 } // Count all achievement documents
          }
        },
        { $sort: { totalAchievements: -1 } },
        { $limit: 50 }
      ]);
    }

    // Get user details for top 50
    const userIds = achievementCounts.map(ac => ac._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name username')
      .lean();

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Format leaderboard
    const leaderboard = achievementCounts.map((ac, index) => {
      const user = userMap.get(ac._id.toString());
      return {
        rank: index + 1,
        id: ac._id.toString(),
        name: user?.name || 'Unknown',
        username: user?.username || '@unknown',
        achievements: ac.totalAchievements,
        isCurrentUser: ac._id.toString() === currentUserId,
      };
    });

    // Check if current user is in top 50
    const isInTop50 = leaderboard.some(u => u.isCurrentUser);

    let currentUserData = null;

    if (!isInTop50) {
      // Get current user's achievement count
      let achievementCount = 0;
      
      if (achievementId) {
        // Count documents for specific achievement
        achievementCount = await UserAchievement.countDocuments({
          userId: currentUserObjId,
          achievementId
        });
      } else {
        // Count all achievement documents for user
        achievementCount = await UserAchievement.countDocuments({
          userId: currentUserObjId
        });
      }

      // Count how many users have more achievements
      let rank;
      if (achievementId) {
        const rankResult = await UserAchievement.aggregate([
          { $match: { achievementId } },
          {
            $group: {
              _id: '$userId',
              totalAchievements: { $sum: 1 }
            }
          },
          {
            $match: {
              $or: [
                { totalAchievements: { $gt: achievementCount } },
                {
                  totalAchievements: achievementCount,
                  _id: { $lt: currentUserObjId }
                }
              ]
            }
          },
          { $count: 'rank' }
        ]);
        rank = rankResult.length > 0 ? rankResult[0].rank + 1 : 1;
      } else {
        const rankResult = await UserAchievement.aggregate([
          {
            $group: {
              _id: '$userId',
              totalAchievements: { $sum: 1 }
            }
          },
          {
            $match: {
              $or: [
                { totalAchievements: { $gt: achievementCount } },
                {
                  totalAchievements: achievementCount,
                  _id: { $lt: currentUserObjId }
                }
              ]
            }
          },
          { $count: 'rank' }
        ]);
        rank = rankResult.length > 0 ? rankResult[0].rank + 1 : 1;
      }

      const userRank = rank;

      const currentUser = await User.findById(currentUserObjId).select('name username').lean();

      currentUserData = {
        rank: userRank,
        id: currentUserId,
        name: currentUser?.name || 'Unknown',
        username: currentUser?.username || '@unknown',
        achievements: achievementCount,
        isCurrentUser: true,
      };
    }

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserData,
      achievementId: achievementId || null,
    });
  } catch (error: any) {
    console.error('Achievements leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

