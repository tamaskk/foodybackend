import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import Recipe from '@/models/Recipe';
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

// GET /api/social/posts - Get posts with pagination
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get posts with user and recipe info.
    // Use full documents (no lean) so embedded arrays like comments are preserved reliably,
    // then convert to plain objects.
    const postDocs = await SocialPost.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    const posts = postDocs.map((p) => p.toObject());

    // Debug: log basic info for the first post to verify embedded arrays
    if (posts.length > 0) {
      const sample = posts[0];
      console.log('[posts GET] sample', {
        id: sample._id?.toString?.() ?? sample._id,
        commentsType: typeof sample.comments,
        isArray: Array.isArray(sample.comments),
        commentsLen: Array.isArray(sample.comments) ? sample.comments.length : 'n/a',
        likedLen: Array.isArray(sample.likedUserIds) ? sample.likedUserIds.length : 'n/a',
        savedLen: Array.isArray(sample.savedUserIds) ? sample.savedUserIds.length : 'n/a',
      });
    }

    // Fetch user and recipe info separately to avoid populate issues
    const userIds = [...new Set(posts.map((p: any) => p.userId?.toString()).filter(Boolean))];
    const recipeIds = [...new Set(posts.map((p: any) => p.recipeId?.toString()).filter(Boolean))];
    
    const [users, recipes] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      recipeIds.length > 0 ? Recipe.find({ _id: { $in: recipeIds } }).lean() : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
    const recipeMap = new Map(recipes.map((r: any) => [r._id.toString(), r]));

    const enrichedPosts = posts.map((post: any) => {
      const postId = post._id.toString();
      const user = userMap.get(post.userId?.toString());
      const recipe = post.recipeId ? recipeMap.get(post.recipeId.toString()) : null;
      const isOwnPost = post.userId?.toString() === userId;

      const likedUserIds = Array.isArray(post.likedUserIds) ? post.likedUserIds : [];
      const savedUserIds = Array.isArray(post.savedUserIds) ? post.savedUserIds : [];
      const comments = Array.isArray(post.comments) ? post.comments : [];

      console.log(`[posts GET] post ${postId}`, {
        commentsLen: comments.length,
        hasComments: !!post.comments,
        commentsIsArray: Array.isArray(post.comments),
        likedLen: likedUserIds.length,
        savedLen: savedUserIds.length,
      });

      return {
        id: postId,
        user: {
          id: user?._id?.toString() || '',
          name: user?.name || 'Unknown',
          handle: `@${user?.username || 'unknown'}`,
          avatarColor: '#E0E0E0', // Default color, can be enhanced later
          isPrivate: user?.isPrivate ?? false,
        },
        title: post.title,
        body: post.body,
        imageColor: post.imageColor || '#FFF3D0',
        imageUrl: post.imageUrl || null,
        imageUrls: post.imageUrls || [],
        isPoll: post.isPoll || false,
        pollOptions: post.pollOptions || [],
        likes: likedUserIds.length,
        saves: savedUserIds.length,
        comments: comments.length,
        liked: likedUserIds.some((id: any) => id.toString() === userId),
        saved: savedUserIds.some((id: any) => id.toString() === userId),
        isOwnPost: isOwnPost,
        recipe: recipe ? {
          id: recipe._id.toString(),
          title: recipe.title,
          description: recipe.description,
          picture: recipe.picture,
          type: recipe.type,
        } : null,
        createdAt: post.createdAt,
      };
    });

    // Check if there are more posts
    const totalPosts = await SocialPost.countDocuments();
    const hasMore = skip + limit < totalPosts;

    return NextResponse.json({
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        hasMore,
        total: totalPosts,
      },
    });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/social/posts - Create a new post
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const body = await req.json();
    const { title, body: postBody, imageColor, imageUrls, isPoll, pollOptions, recipeId } = body;

    if (!title || !postBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Validate recipeId if provided
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return NextResponse.json(
          { error: 'Recipe not found' },
          { status: 404 }
        );
      }
    }

    const imageUrlsArray = imageUrls && Array.isArray(imageUrls) ? imageUrls : [];
    const firstImageUrl = imageUrlsArray.length > 0 ? imageUrlsArray[0] : null;

    const post = await SocialPost.create({
      userId,
      recipeId: recipeId || undefined,
      title: title.trim(),
      body: postBody.trim(),
      imageColor: imageColor || '#FFF3D0',
      imageUrl: firstImageUrl,
      imageUrls: imageUrlsArray,
      isPoll: isPoll || false,
      pollOptions: pollOptions || [],
      likedUserIds: [],
      savedUserIds: [],
      comments: [],
    });

    // Fetch user and recipe info separately to avoid populate issues
    const user = await User.findById(userId).lean();
    let recipe: any = null;
    if (recipeId) {
      const recipeDoc = await Recipe.findById(recipeId).lean();
      recipe = recipeDoc as any; // Type assertion for lean() result
    }

    return NextResponse.json(
      {
        message: 'Post created successfully',
        post: {
          id: post._id.toString(),
          user: {
            id: user?._id?.toString() || '',
            name: user?.name || 'Unknown',
            handle: `@${user?.username || 'unknown'}`,
            avatarColor: '#E0E0E0',
          },
          title: post.title,
          body: post.body,
          imageColor: post.imageColor,
          imageUrl: post.imageUrl || null,
          imageUrls: post.imageUrls || [],
          isPoll: post.isPoll,
          pollOptions: post.pollOptions,
          likes: (post.likedUserIds || []).length,
          saves: (post.savedUserIds || []).length,
          comments: (post.comments || []).length,
          liked: false,
          saved: false,
          isOwnPost: true, // Newly created post is always own post
          recipe: recipe ? {
            id: recipe._id.toString(),
            title: recipe.title,
            description: recipe.description,
            picture: recipe.picture,
            type: recipe.type,
          } : null,
          createdAt: post.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
