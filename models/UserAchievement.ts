import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: string; // References achievement-definitions.ts
  tier: string; // Current unlocked tier
  unlockedAt: Date;
  notified: boolean; // Track if user was notified
}

const UserAchievementSchema: Schema = new Schema<IUserAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
      index: true,
    },
    tier: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one achievement per user
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Prevent re-compilation during development
const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement || mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default UserAchievement;

