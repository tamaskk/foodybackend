import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Recipe from '@/models/Recipe';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/recipes/[id] - Get single recipe
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const recipeDoc = await Recipe.findById(id).lean();
    if (!recipeDoc) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeDoc as any;

    return NextResponse.json({
      recipe: {
        id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description,
        type: recipe.type,
        time: recipe.time,
        kcal: recipe.kcal,
        code: recipe.code,
        owning: recipe.owning,
        image: recipe.image,
        picture: recipe.picture,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        links: recipe.links || [],
        userId: recipe.userId.toString(),
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin get recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/recipes/[id] - Update recipe
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updateFields: any = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.type !== undefined) updateFields.type = body.type;
    if (body.time !== undefined) updateFields.time = body.time;
    if (body.kcal !== undefined) updateFields.kcal = body.kcal;
    if (body.code !== undefined) updateFields.code = body.code;
    if (body.owning !== undefined) updateFields.owning = body.owning;
    if (body.image !== undefined) updateFields.image = body.image;
    if (body.picture !== undefined) updateFields.picture = body.picture;
    if (body.ingredients !== undefined) updateFields.ingredients = body.ingredients;
    if (body.steps !== undefined) updateFields.steps = body.steps;
    if (body.links !== undefined) updateFields.links = body.links;

    const recipeDoc = await Recipe.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!recipeDoc) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeDoc as any;

    return NextResponse.json({
      message: 'Recipe updated successfully',
      recipe: {
        id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description,
        type: recipe.type,
        time: recipe.time,
        kcal: recipe.kcal,
        code: recipe.code,
        owning: recipe.owning,
        image: recipe.image,
        picture: recipe.picture,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        links: recipe.links || [],
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin update recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/recipes/[id] - Delete recipe
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const recipe = await Recipe.findByIdAndDelete(id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Recipe deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
