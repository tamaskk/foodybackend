import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import { calculateLevelFromXp } from '@/lib/level-system';

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

// POST /api/users/recalculate-level - Recalculate user level based on current XP
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;

    const user = await User.findById(userId).select('xp level');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentXp = user.xp || 0;
    const correctLevel = calculateLevelFromXp(currentXp);
    const oldLevel = user.level || 1;

    // Update level if it's different
    if (correctLevel !== oldLevel) {
      user.level = correctLevel;
      await user.save();

      return NextResponse.json({
        message: 'Level recalculated successfully',
        oldLevel,
        newLevel: correctLevel,
        xp: currentXp,
        updated: true,
      });
    }

    return NextResponse.json({
      message: 'Level is already correct',
      level: correctLevel,
      xp: currentXp,
      updated: false,
    });
  } catch (error: any) {
    console.error('Recalculate level error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

