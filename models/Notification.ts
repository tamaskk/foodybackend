import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // User who receives this notification
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  sentBy: string; // admin email or user email
  invitationId?: mongoose.Types.ObjectId;
  invitationStatus?: 'pending' | 'accepted' | 'declined' | 'expired';
  householdId?: mongoose.Types.ObjectId;
  householdName?: string;
  invitedByUserId?: mongoose.Types.ObjectId;
  invitedByUserName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentBy: {
      type: String,
      required: true,
    },
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: 'HouseholdInvitation',
    },
    invitationStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
    },
    householdName: {
      type: String,
      trim: true,
    },
    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedByUserName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
