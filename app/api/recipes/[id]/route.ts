import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import mongoose from 'mongoose';
import User from '@/models/User';
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

// GET /api/recipes/:id - Get a single recipe
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: 400 }
      );
    }

    // Allow fetching any recipe by ID (not just user's own recipes)
    // This enables viewing recipes shared on social media
    const recipeDoc = await Recipe.findOne({ _id: id }).lean();

    if (!recipeDoc) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Check if recipe belongs to user for ownership flag
    const recipe = recipeDoc as any;
    const isOwn = recipe.userId.toString() === userId;

    // Generate code if missing (same as GET /api/recipes)
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
        owning: isOwn,
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
  } catch (error: any) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/:id - Update a recipe
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id } = await params;
    const body = await req.json();
    const { title, description, time, kcal, picture, type, ingredients, steps, links } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: 400 }
      );
    }

    // Check if recipe exists and belongs to user
    const existingRecipe = await Recipe.findOne({ _id: id, userId });

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Update recipe
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (time !== undefined) updateData.time = time?.trim() || '';
    if (kcal !== undefined) updateData.kcal = kcal?.trim() || '';
    if (picture !== undefined) updateData.picture = picture;
    if (type !== undefined) {
      if (!['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid recipe type' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }
    if (ingredients !== undefined) updateData.ingredients = Array.isArray(ingredients) ? ingredients : [];
    if (steps !== undefined) updateData.steps = Array.isArray(steps) ? steps : [];
    if (links !== undefined) updateData.links = Array.isArray(links) ? links : [];

    const recipeDoc = await Recipe.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    const recipe = recipeDoc as any;

    return NextResponse.json({
      message: 'Recipe updated successfully',
      recipe: {
        id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description,
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
  } catch (error: any) {
    console.error('Update recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/:id - Delete a recipe
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: 400 }
      );
    }

    const recipe = await Recipe.findOneAndDelete({ _id: id, userId });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Decrement current recipe count for the user (floor at 0)
    await User.findByIdAndUpdate(userId, { $inc: { recipes: -1 } });
    await User.updateOne({ _id: userId, recipes: { $lt: 0 } }, { $set: { recipes: 0 } });

    return NextResponse.json({
      message: 'Recipe deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
