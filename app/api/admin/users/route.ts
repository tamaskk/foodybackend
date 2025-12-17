import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/users - List all users with search and pagination
export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const subscriptionTier = searchParams.get('subscriptionTier') || '';
    const isPrivate = searchParams.get('isPrivate') || '';

    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (subscriptionTier) {
      query.subscriptionTier = subscriptionTier;
    }
    if (isPrivate) {
      query.isPrivate = isPrivate === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        username: u.username,
        subscriptionTier: u.subscriptionTier,
        subscriptionEndDate: u.subscriptionEndDate,
        isPrivate: u.isPrivate,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
