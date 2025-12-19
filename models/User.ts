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
  followers: number;
  following: number;
  recipeBackgrounds: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    drink: string;
  };
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
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },
    recipeBackgrounds: {
      type: {
        breakfast: { type: String, default: '#FFF3D9', required: true },
        lunch: { type: String, default: '#DDF6FF', required: true },
        dinner: { type: String, default: '#FFE5F3', required: true },
        snack: { type: String, default: '#F6F4F0', required: true },
        drink: { type: String, default: '#E8F6F5', required: true },
      },
      default: () => ({
        breakfast: '#FFF3D9',
        lunch: '#DDF6FF',
        dinner: '#FFE5F3',
        snack: '#F6F4F0',
        drink: '#E8F6F5',
      }),
      required: true,
      _id: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation during development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

