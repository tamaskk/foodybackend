import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FollowRequest from '@/models/FollowRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/jwt';

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), user: null };
  }

  return { error: null, user: payload };
}

// POST /api/social/follow-requests - Send a follow request
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const body = await req.json();
    const { toUserId } = body;

    if (!toUserId || !mongoose.Types.ObjectId.isValid(toUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (userId === toUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if account is private
    const isPrivate = targetUser.isPrivate ?? false;

    // Check if request already exists (any status)
    const existing = await FollowRequest.findOne({
      fromUserId: userId,
      toUserId,
    });

    if (existing) {
      // If pending or accepted, return error
      if (existing.status === 'pending' || existing.status === 'accepted') {
        return NextResponse.json({ error: 'Follow request already exists' }, { status: 400 });
      }
      
      // If rejected, update it to pending/accepted based on privacy
      if (existing.status === 'rejected') {
        existing.status = isPrivate ? 'pending' : 'accepted';
        await existing.save();
        
        // Get sender user info
        const fromUser = await User.findById(userId);
        
        if (isPrivate) {
          // Create notification for private account
          await Notification.create({
            userId: toUserId,
            title: 'New Follow Request',
            message: `${fromUser?.name || 'Someone'} wants to follow you`,
            type: 'follow_request',
            fromUserId: userId,
            relatedId: existing._id.toString(),
            read: false,
          });
        } else {
          // For public account, update follower counts immediately
          await User.findByIdAndUpdate(toUserId, { $inc: { followers: 1 } });
          await User.findByIdAndUpdate(userId, { $inc: { following: 1 } });
          
          // Create notification for public account
          await Notification.create({
            userId: toUserId,
            title: 'New Follower',
            message: `${fromUser?.name || 'Someone'} started following you`,
            type: 'follow_accepted',
            fromUserId: userId,
            read: false,
          });
        }
        
        return NextResponse.json({
          success: true,
          followRequest: {
            id: existing._id.toString(),
            status: existing.status,
          },
        });
      }
    }

    // Create follow request with status based on privacy
    const followRequest = await FollowRequest.create({
      fromUserId: userId,
      toUserId,
      status: isPrivate ? 'pending' : 'accepted',
    });

    // Get sender user info for notification
    const fromUser = await User.findById(userId);

    if (isPrivate) {
      // Create notification for private account (pending request)
      await Notification.create({
        userId: toUserId,
        title: 'New Follow Request',
        message: `${fromUser?.name || 'Someone'} wants to follow you`,
        type: 'follow_request',
        fromUserId: userId,
        relatedId: followRequest._id.toString(),
        read: false,
      });
    } else {
      // For public account, update follower counts immediately
      await User.findByIdAndUpdate(toUserId, { $inc: { followers: 1 } });
      await User.findByIdAndUpdate(userId, { $inc: { following: 1 } });
      
      // Create notification for public account (new follower)
      await Notification.create({
        userId: toUserId,
        title: 'New Follower',
        message: `${fromUser?.name || 'Someone'} started following you`,
        type: 'follow_accepted',
        fromUserId: userId,
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      followRequest: {
        id: followRequest._id.toString(),
        status: followRequest.status,
      },
    });
  } catch (error: any) {
    console.error('Send follow request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/social/follow-requests - Get follow requests (incoming and outgoing)
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const userId = auth.user!.userId;
    const type = req.nextUrl.searchParams.get('type'); // 'incoming' or 'outgoing'

    let query: any = {};
    if (type === 'incoming') {
      query = { toUserId: userId, status: 'pending' };
    } else if (type === 'outgoing') {
      query = { fromUserId: userId, status: 'pending' };
    } else {
      // Get both incoming and outgoing
      query = {
        $or: [
          { fromUserId: userId, status: 'pending' },
          { toUserId: userId, status: 'pending' },
        ],
      };
    }

    const requests = await FollowRequest.find(query)
      .populate('fromUserId', 'name username')
      .populate('toUserId', 'name username')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = requests.map((req: any) => ({
      id: req._id.toString(),
      fromUser: {
        id: req.fromUserId._id.toString(),
        name: req.fromUserId.name,
        username: req.fromUserId.username,
      },
      toUser: {
        id: req.toUserId._id.toString(),
        name: req.toUserId.name,
        username: req.toUserId.username,
      },
      status: req.status,
      createdAt: req.createdAt,
    }));

    return NextResponse.json({ followRequests: enriched });
  } catch (error: any) {
    console.error('Get follow requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

