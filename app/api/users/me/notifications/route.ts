import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
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

// GET /api/users/me/notifications - Get current user's notifications
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    // Build query - get notifications sent to this user
    const query: any = {
      userId: userId,
    };

    if (unreadOnly) {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: userId, read: false }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        invitationId: n.invitationId ? n.invitationId.toString() : undefined,
        invitationStatus: n.invitationStatus,
        householdId: n.householdId ? n.householdId.toString() : undefined,
        householdName: n.householdName,
        invitedByUserId: n.invitedByUserId ? n.invitedByUserId.toString() : undefined,
        invitedByUserName: n.invitedByUserName,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get user notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const userId = auth.user!.userId;
    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user's notifications as read
      await Notification.updateMany(
        {
          userId: userId,
          read: false,
        },
        { $set: { read: true } }
      );
      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId: userId,
        },
        { $set: { read: true } }
      );
      return NextResponse.json({ message: 'Notifications marked as read' });
    } else {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Mark notifications as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
