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

// GET /api/leaderboard/country - Get country-specific level leaderboard
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const currentUserId = auth.user!.userId;

    // Get country from query params (optional)
    const { searchParams } = new URL(req.url);
    const selectedCountry = searchParams.get('country');

    // Get current user's data
    const currentUser = await User.findById(currentUserId).select('name username level xp country').lean();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use selected country or default to user's country
    const targetCountry = selectedCountry || currentUser.country;

    // Get top 50 users from the target country sorted by level (desc) then xp (desc)
    const topUsers = await User.find({ country: targetCountry })
      .select('name username level xp country')
      .sort({ level: -1, xp: -1 })
      .limit(50)
      .lean();

    // Only calculate current user's rank if viewing their own country
    let rank = null;
    let currentUserData = null;

    if (targetCountry === currentUser.country) {
      // Count how many users in the same country have higher level/xp than current user
      rank = await User.countDocuments({
        country: targetCountry,
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
    }

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

    // Check if current user is in top 50 (only for their own country)
    const isInTop50 = leaderboard.some(u => u.isCurrentUser);

    // If not in top 50 and viewing own country, add current user data
    if (!isInTop50 && targetCountry === currentUser.country && rank !== null) {
      currentUserData = {
        rank,
        id: currentUser._id.toString(),
        name: currentUser.name,
        username: currentUser.username,
        level: currentUser.level,
        xp: currentUser.xp,
        isCurrentUser: true,
      };
    }

    // Get list of all countries with users (for dropdown)
    const countries = await User.distinct('country');

    return NextResponse.json({
      country: targetCountry,
      userCountry: currentUser.country,
      countries: countries.sort(),
      leaderboard,
      currentUser: currentUserData,
    });
  } catch (error: any) {
    console.error('Country leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

