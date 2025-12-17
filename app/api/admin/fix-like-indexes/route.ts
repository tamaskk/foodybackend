import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
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

// POST /api/admin/fix-like-indexes - Fix Like model indexes
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const collection = db.collection('likes');

    const results: string[] = [];

    // Drop old indexes if they exist
    try {
      await collection.dropIndex('postId_1_userId_1');
      results.push('Dropped index: postId_1_userId_1');
    } catch (e: any) {
      if (e.code === 27) {
        results.push('Index postId_1_userId_1 not found (already dropped or never existed)');
      } else {
        results.push(`Error dropping postId_1_userId_1: ${e.message}`);
      }
    }

    try {
      await collection.dropIndex('commentId_1_userId_1');
      results.push('Dropped index: commentId_1_userId_1');
    } catch (e: any) {
      if (e.code === 27) {
        results.push('Index commentId_1_userId_1 not found (already dropped or never existed)');
      } else {
        results.push(`Error dropping commentId_1_userId_1: ${e.message}`);
      }
    }

    // Create new partial indexes
    try {
      await collection.createIndex(
        { postId: 1, userId: 1 },
        { 
          unique: true, 
          partialFilterExpression: { postId: { $exists: true, $ne: null } },
          name: 'postId_1_userId_1'
        }
      );
      results.push('Created index: postId_1_userId_1 (partial)');
    } catch (e: any) {
      results.push(`Error creating postId_1_userId_1: ${e.message}`);
    }

    try {
      await collection.createIndex(
        { commentId: 1, userId: 1 },
        { 
          unique: true, 
          partialFilterExpression: { commentId: { $exists: true, $ne: null } },
          name: 'commentId_1_userId_1'
        }
      );
      results.push('Created index: commentId_1_userId_1 (partial)');
    } catch (e: any) {
      results.push(`Error creating commentId_1_userId_1: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Index migration completed',
      results,
    });
  } catch (error: any) {
    console.error('Error fixing indexes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
