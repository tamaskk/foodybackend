import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // User who receives the notification
  title: string; // Notification title
  message: string; // Notification message
  type: 'info' | 'warning' | 'success' | 'error' | 'follow_request' | 'follow_accepted' | 'post_like' | 'post_comment' | 'achievement';
  sentBy?: string; // Email/name of sender (for admin notifications)
  fromUserId?: mongoose.Types.ObjectId; // User who triggered the notification (for social notifications)
  relatedId?: string; // ID of related entity (post, follow request, etc.)
  metadata?: Record<string, any>; // Additional metadata (e.g., for achievement notifications)
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error', 'follow_request', 'follow_accepted', 'post_like', 'post_comment', 'achievement'],
      required: true,
    },
    sentBy: {
      type: String,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
