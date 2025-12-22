import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SocialPost from '@/models/SocialPost';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/posts/[id] - Get single post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const post = await SocialPost.findById(id)
      .populate('userId', 'name username avatarUrl')
      .populate('comments.userId', 'name username avatarUrl')
      .populate('likedUserIds', 'name username avatarUrl')
      .lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      post: {
        id: post._id.toString(),
        title: post.title,
        body: post.body,
        imageColor: post.imageColor,
        imageUrl: post.imageUrl,
        imageUrls: post.imageUrls || [],
        isPoll: post.isPoll || false,
        pollOptions: post.pollOptions || [],
        likesCount: post.likedUserIds?.length || 0,
        commentsCount: post.comments?.length || 0,
        savesCount: post.savedUserIds?.length || 0,
        userId: post.userId.toString(),
        user: post.userId,
        likedUsers: (post.likedUserIds as any[])?.map((user: any) => ({
          id: user._id?.toString(),
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
        })) || [],
        comments: post.comments?.map((comment: any) => ({
          id: comment._id?.toString(),
          text: comment.text,
          likes: comment.likedUserIds?.length || 0,
          user: comment.userId,
          createdAt: comment.createdAt,
        })) || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/posts/[id] - Update post
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
    if (body.body !== undefined) updateFields.body = body.body;
    if (body.imageColor !== undefined) updateFields.imageColor = body.imageColor;
    if (body.imageUrl !== undefined) updateFields.imageUrl = body.imageUrl;
    if (body.imageUrls !== undefined) updateFields.imageUrls = body.imageUrls;
    if (body.isPoll !== undefined) updateFields.isPoll = body.isPoll;
    if (body.pollOptions !== undefined) updateFields.pollOptions = body.pollOptions;

    const post = await SocialPost.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Post updated successfully',
      post: {
        id: post._id.toString(),
        title: post.title,
        body: post.body,
        imageColor: post.imageColor,
        imageUrl: post.imageUrl,
        imageUrls: post.imageUrls || [],
        isPoll: post.isPoll || false,
        pollOptions: post.pollOptions || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Admin update post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/posts/[id] - Delete post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const post = await SocialPost.findByIdAndDelete(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
