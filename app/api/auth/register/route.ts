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
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    // Return user data (without password) and token
    return NextResponse.json(
      {
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
        },
      },
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

