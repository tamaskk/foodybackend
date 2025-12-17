import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

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

// PATCH /api/users/me/privacy  { isPrivate: boolean }
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;
    const body = await req.json();
    const { isPrivate } = body;

    if (typeof isPrivate !== 'boolean') {
      return NextResponse.json(
        { error: 'isPrivate must be a boolean' },
        { status: 400 }
      );
    }

    await User.updateOne({ _id: userId }, { $set: { isPrivate } });
    return NextResponse.json({ success: true, isPrivate });
  } catch (error: any) {
    console.error('Update privacy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
