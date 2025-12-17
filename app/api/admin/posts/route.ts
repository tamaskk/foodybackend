import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import User from '@/models/User';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/posts - List all posts with search and pagination
export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const [posts, total] = await Promise.all([
      SocialPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SocialPost.countDocuments(query),
    ]);

    // Get user details for posts
    const userIds = [...new Set(posts.map((p: any) => p.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name username')
      .lean();
    
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    return NextResponse.json({
      posts: posts.map((p: any) => {
        const user = userMap.get(p.userId.toString());
        return {
          id: p._id.toString(),
          title: p.title,
          body: p.body,
          imageColor: p.imageColor,
          imageUrls: p.imageUrls || [],
          isPoll: p.isPoll || false,
          pollOptions: p.pollOptions || [],
          likesCount: p.likedUserIds?.length || 0,
          commentsCount: p.comments?.length || 0,
          savesCount: p.savedUserIds?.length || 0,
          user: user ? {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
          } : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin posts list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
