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

// GET /api/users - Get all users (basic profile info, no passwords)
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    // Fetch all users, exclude password field
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    const result = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      username: u.username,
      subscriptionTier: u.subscriptionTier,
      subscriptionEndDate: u.subscriptionEndDate,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({ users: result });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

