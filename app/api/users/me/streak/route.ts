import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

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

// POST /api/users/me/streak - Update user streak when app opens
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
    }

    let newStreak = user.streak || 0;

    if (!lastActive) {
      // First time opening app
      newStreak = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day, no change
        newStreak = user.streak;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        newStreak = (user.streak || 0) + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    }

    user.streak = newStreak;
    user.lastActiveDate = new Date();
    await user.save();

    return NextResponse.json({
      streak: newStreak,
      lastActiveDate: user.lastActiveDate,
    });
  } catch (error: any) {
    console.error('Update streak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

