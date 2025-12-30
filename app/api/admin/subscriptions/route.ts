import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailSubscription from '@/models/EmailSubscription';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const total = await EmailSubscription.countDocuments();
    const subscriptions = await EmailSubscription.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub._id.toString(),
      name: sub.name,
      email: sub.email,
      createdAt: sub.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      subscriptions: formattedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
