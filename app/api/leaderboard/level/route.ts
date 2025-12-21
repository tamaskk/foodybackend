import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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

// GET /api/leaderboard/level - Get global level leaderboard
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const currentUserId = auth.user!.userId;

    // Get top 50 users sorted by level (desc) then xp (desc)
    const topUsers = await User.find()
      .select('name username level xp')
      .sort({ level: -1, xp: -1 })
      .limit(50)
      .lean();

    // Get current user's rank
    const currentUser = await User.findById(currentUserId).select('name username level xp').lean();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count how many users have higher level/xp than current user
    const rank = await User.countDocuments({
      $or: [
        { level: { $gt: currentUser.level } },
        { 
          level: currentUser.level,
          xp: { $gt: currentUser.xp }
        },
        {
          level: currentUser.level,
          xp: currentUser.xp,
          _id: { $lt: currentUser._id } // tie-breaker
        }
      ]
    }) + 1;

    // Format leaderboard
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      level: user.level,
      xp: user.xp,
      isCurrentUser: user._id.toString() === currentUserId,
    }));

    // Check if current user is in top 50
    const isInTop50 = leaderboard.some(u => u.isCurrentUser);

    // If not in top 50, add current user data
    const currentUserData = isInTop50 ? null : {
      rank,
      id: currentUser._id.toString(),
      name: currentUser.name,
      username: currentUser.username,
      level: currentUser.level,
      xp: currentUser.xp,
      isCurrentUser: true,
    };

    return NextResponse.json({
      leaderboard,
      currentUser: currentUserData,
    });
  } catch (error: any) {
    console.error('Level leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

