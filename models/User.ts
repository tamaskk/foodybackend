import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  subscriptionEndDate: Date | null;
  isPrivate: boolean;
  householdId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

