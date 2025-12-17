import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import Bill from '@/models/Bill';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    await connectDB();
    
    // Fetch all bills for this user, sorted by newest first
    const bills = await Bill.find({ userId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bills });
  } catch (error: any) {
    console.error('Get bills error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch bills' }, { status: 500 });
  }
}

