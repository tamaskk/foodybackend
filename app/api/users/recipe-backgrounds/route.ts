import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      ),
      user: null,
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      ),
      user: null,
    };
  }

  return { error: null, user: payload };
}

// PUT /api/users/recipe-backgrounds
export async function PUT(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userObjId = new mongoose.Types.ObjectId(auth.user!.userId);
    const { recipeBackgrounds } = await req.json();

    if (!recipeBackgrounds || typeof recipeBackgrounds !== 'object') {
      return NextResponse.json(
        { error: 'Invalid recipe backgrounds data' },
        { status: 400 }
      );
    }

    const requiredTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    for (const type of requiredTypes) {
      if (
        !recipeBackgrounds[type] ||
        !hexColorRegex.test(recipeBackgrounds[type])
      ) {
        return NextResponse.json(
          { error: `Invalid or missing color for ${type}` },
          { status: 400 }
        );
      }
    }

    // 🔥 IMPORTANT FIX: replace entire object
    const updatedUser = await User.findByIdAndUpdate(
      userObjId,
      {
        $set: {
          recipeBackgrounds,
        },
      },
      {
        new: true,
        runValidators: true,
        select: '-password',
      }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Updated recipeBackgrounds:', updatedUser.recipeBackgrounds);

    return NextResponse.json(
      {
        success: true,
        recipeBackgrounds: updatedUser.recipeBackgrounds || recipeBackgrounds,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    console.error('Update recipe backgrounds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
