import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  userId: mongoose.Types.ObjectId;
  text: string;
  likes: number;
  likedUserIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

export interface ISocialPost extends Document {
  userId: mongoose.Types.ObjectId;
  recipeId?: mongoose.Types.ObjectId; // Optional reference to a recipe
  title: string;
  body: string;
  imageColor?: string; // Hex color for the post image
  imageUrl?: string; // URL for uploaded image
  imageUrls?: string[];
  isPoll: boolean;
  pollOptions?: string[];
  likedUserIds: mongoose.Types.ObjectId[]; // Array of user IDs who liked this post
  savedUserIds: mongoose.Types.ObjectId[]; // Array of user IDs who saved this post
  comments: IComment[]; // Array of embedded comments
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    imageColor: {
      type: String,
      default: '#FFF3D0',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    isPoll: {
      type: Boolean,
      default: false,
    },
    pollOptions: {
      type: [String],
      default: [],
    },
    likedUserIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    savedUserIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    comments: {
      type: [{
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        likes: {
          type: Number,
          default: 0,
        },
        likedUserIds: {
          type: [Schema.Types.ObjectId],
          ref: 'User',
          default: [],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
SocialPostSchema.index({ userId: 1, createdAt: -1 });
SocialPostSchema.index({ createdAt: -1 });

// Delete the model if it exists to avoid schema conflicts
if (mongoose.models.SocialPost) {
  delete mongoose.models.SocialPost;
}

const SocialPost = mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);

export default SocialPost;
