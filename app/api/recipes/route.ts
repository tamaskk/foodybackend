import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import User from '@/models/User';
import Household from '@/models/Household';
import { verifyToken } from '@/lib/jwt';

async function generateUniqueCode(): Promise<string> {
  // 5-digit zero-padded numeric code
  const attempt = async () => {
    const code = (Math.floor(Math.random() * 90000) + 10000).toString(); // 10000-99999
    const exists = await Recipe.exists({ code });
    if (exists) return null;
    return code;
  };

  for (let i = 0; i < 10; i++) {
    const result = await attempt();
    if (result) return result;
  }
  throw new Error('Unable to generate unique code');
}

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

// GET /api/recipes - Get all recipes for the authenticated user
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const codeQuery = req.nextUrl.searchParams.get('code');

    // Lookup by code (cross-user) when code query is present
    if (codeQuery) {
      const recipeDoc = await Recipe.findOne({ code: codeQuery.trim() }).lean();
      if (!recipeDoc) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }
      const recipe = recipeDoc as any; // Type assertion after null check
      let code = recipe.code;
      if (!code || code === '' || code === null || code === undefined) {
        code = await generateUniqueCode();
        await Recipe.updateOne({ _id: recipe._id }, { $set: { code } });
      }
      return NextResponse.json({
        recipe: {
          id: recipe._id.toString(),
          title: recipe.title,
          description: recipe.description,
          owning: recipe.owning ?? true,
          code,
          time: recipe.time,
          kcal: recipe.kcal,
          picture: recipe.picture,
          type: recipe.type,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          links: recipe.links,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        },
      });
    }

    // Get user to check for household
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine which user IDs to include in recipe query
    let userIds = [userId];
    
    // If user is in a household, include all household members
    if (user.householdId) {
      const household = await Household.findById(user.householdId).lean();
      if (household && household.members && household.members.length > 0) {
        userIds = household.members.map((memberId: any) => memberId.toString());
      }
    }

    // Fetch recipes for user and household members
    const recipes = await Recipe.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    console.log('Recipes:', recipes);

    const enriched = await Promise.all(
      recipes.map(async (recipe: any) => {
        let code = recipe.code;
        if (!code || code === '' || code === null || code === undefined) {
          code = await generateUniqueCode();
          await Recipe.updateOne({ _id: recipe._id }, { $set: { code } });
        }
        return {
          id: recipe._id.toString(),
          title: recipe.title,
          description: recipe.description,
          owning: recipe.owning ?? true,
          code,
          time: recipe.time,
          kcal: recipe.kcal,
          picture: recipe.picture,
          type: recipe.type,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          links: recipe.links,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        };
      })
    );

    console.log('Enriched recipes:', enriched);

    return NextResponse.json({ recipes: enriched });
  } catch (error: any) {
    console.error('Get recipes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const body = await req.json();
    const { title, description, time, kcal, picture, type, ingredients, steps, links, owning } = body;

    // Validation
    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    if (!['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid recipe type' },
        { status: 400 }
      );
    }

    const code = await generateUniqueCode();
    console.log('Generated code for new recipe:', code);

    // Create recipe
    const recipe = await Recipe.create({
      userId,
      title: title.trim(),
      description: description?.trim() || '',
      owning: owning === false ? false : true,
      code,
      time: time?.trim() || '',
      kcal: kcal?.trim() || '',
      picture: picture || { type: 'emoji', value: '🍽️' },
      type,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      links: Array.isArray(links) ? links : [],
    });

    console.log('Created recipe with code:', recipe.code, 'ID:', recipe._id);

    return NextResponse.json(
      {
        message: 'Recipe created successfully',
        recipe: {
          id: recipe._id.toString(),
          title: recipe.title,
          description: recipe.description,
          owning: recipe.owning ?? true,
          code: recipe.code,
          time: recipe.time,
          kcal: recipe.kcal,
          picture: recipe.picture,
          type: recipe.type,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          links: recipe.links,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
