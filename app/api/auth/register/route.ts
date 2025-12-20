import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, username, password } = body;

    // Validation
    if (!name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      subscriptionTier: 'free',
      subscriptionEndDate: null,
      isPrivate: false,
      householdId: null,
      followers: 0,
      following: 0,
      streak: 0,
      lastActiveDate: null,
      progress: {
        recipes_created: 0,
        recipes_saved: 0,
        photos_analyzed: 0,
        recipes_imported: 0,
        ai_recipes_generated: 0,
        posts_created: 0,
        likes_given: 0,
        comments_created: 0,
        followers_count: 0,
        household_actions: 0,
      },
      recipeBackgrounds: {
        breakfast: '#FFF3D9',
        lunch: '#DDF6FF',
        dinner: '#FFE5F3',
        snack: '#F6F4F0',
        drink: '#E8F6F5',
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    console.log('user', user);
    const response = {
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionEndDate: user.subscriptionEndDate,
        isPrivate: user.isPrivate ?? false,
        followers: user.followers,
        following: user.following,
        recipeBackgrounds: user.recipeBackgrounds,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        householdId: user.householdId,
        streak: user.streak,
        lastActiveDate: user.lastActiveDate,
        progress: user.progress,
      },
      userObject: user,
    };
    console.log('response', response);
    // Return user data (without password) and token
    return NextResponse.json(
      response,
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

