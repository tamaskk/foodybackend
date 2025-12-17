import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { authenticateAdmin } from '@/lib/admin';

// GET /api/admin/notifications - List all notifications
export async function GET(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (type) {
      query.type = type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('userId', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        userId: n.userId._id.toString(),
        user: {
          id: n.userId._id.toString(),
          name: n.userId.name,
          email: n.userId.email,
          username: n.userId.username,
        },
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        sentBy: n.sentBy,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin notifications list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications - Send notification
export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const body = await req.json();
    const { title, message, type, targetType, userIds } = body;

    // Validation
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notifications = [];

    if (targetType === 'all') {
      // Send to all users - create individual notification for each user
      const allUsers = await User.find({}).select('_id').lean();
      
      // Batch create notifications for all users
      const notificationDocs = allUsers.map((user: any) => ({
        userId: user._id,
        title,
        message,
        type: type || 'info',
        read: false,
        sentBy: auth.admin!.adminEmail,
      }));

      const createdNotifications = await Notification.insertMany(notificationDocs);
      notifications.push(...createdNotifications);
    } else if (targetType === 'specific' && userIds && userIds.length > 0) {
      // Send to specific users
      const notificationDocs = userIds.map((userId: string) => ({
        userId,
        title,
        message,
        type: type || 'info',
        read: false,
        sentBy: auth.admin!.adminEmail,
      }));

      const createdNotifications = await Notification.insertMany(notificationDocs);
      notifications.push(...createdNotifications);
    } else {
      return NextResponse.json(
        { error: 'Invalid target type or user IDs' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Notifications sent successfully',
      count: notifications.length,
      usersNotified: notifications.length,
    });
  } catch (error: any) {
    console.error('Admin send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
