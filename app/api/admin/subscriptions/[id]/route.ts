import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailSubscription from '@/models/EmailSubscription';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Not an admin' }, { status: 403 });
    }

    const { id } = params;

    const subscription = await EmailSubscription.findByIdAndDelete(id).lean();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete subscription' }, { status: 500 });
  }
}
