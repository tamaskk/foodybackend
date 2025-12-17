import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import User from '@/models/User';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/recipes - List all recipes with search and pagination
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
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Recipe.countDocuments(query),
    ]);

    // Get user details for recipes
    const userIds = [...new Set(recipes.map((r: any) => r.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name username')
      .lean();
    
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    return NextResponse.json({
      recipes: recipes.map((r: any) => {
        const user = userMap.get(r.userId.toString());
        return {
          id: r._id.toString(),
          title: r.title,
          description: r.description,
          type: r.type,
          time: r.time,
          kcal: r.kcal,
          ingredients: r.ingredients || [],
          steps: r.steps || [],
          links: r.links || [],
          code: r.code,
          user: user ? {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
          } : null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
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
    console.error('Admin recipes list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
