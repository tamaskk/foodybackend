import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowRequest extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const FollowRequestSchema = new Schema<IFollowRequest>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests
FollowRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.models.FollowRequest || mongoose.model<IFollowRequest>('FollowRequest', FollowRequestSchema);

