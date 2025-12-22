import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { authenticateAdmin } from '@/lib/admin';
import mongoose from 'mongoose';

// GET /api/admin/users/[id] - Get single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        subscriptionEndDate: user.subscriptionEndDate,
        isPrivate: user.isPrivate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
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
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.email !== undefined) updateFields.email = body.email;
    if (body.username !== undefined) updateFields.username = body.username;
    if (body.country !== undefined) updateFields.country = body.country;
    if (body.bio !== undefined) updateFields.bio = body.bio;
    if (body.avatarUrl !== undefined) updateFields.avatarUrl = body.avatarUrl;
    if (body.subscriptionTier !== undefined) updateFields.subscriptionTier = body.subscriptionTier;
    if (body.subscriptionEndDate !== undefined) updateFields.subscriptionEndDate = body.subscriptionEndDate;
    if (body.isPrivate !== undefined) updateFields.isPrivate = body.isPrivate;
    if (body.level !== undefined) updateFields.level = body.level;
    if (body.xp !== undefined) updateFields.xp = body.xp;
    if (body.followers !== undefined) updateFields.followers = body.followers;
    if (body.following !== undefined) updateFields.following = body.following;
    if (body.streak !== undefined) updateFields.streak = body.streak;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, select: '-password' }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        country: user.country,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        subscriptionEndDate: user.subscriptionEndDate,
        isPrivate: user.isPrivate,
        level: user.level,
        xp: user.xp,
        followers: user.followers,
        following: user.following,
        streak: user.streak,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
