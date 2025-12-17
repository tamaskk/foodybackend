import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { emailOrUsername, password } = body;

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase().trim() },
        { username: emailOrUsername.toLowerCase().trim() },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    // Return user data (without password) and token
    return NextResponse.json(
      {
        message: 'Login successful',
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

