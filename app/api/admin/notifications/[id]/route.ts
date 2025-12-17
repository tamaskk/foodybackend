import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { authenticateAdmin } from '@/lib/admin';

// DELETE /api/admin/notifications/[id] - Delete notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
