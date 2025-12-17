import mongoose, { Schema, Document } from 'mongoose';

export interface ISave extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recipeId?: mongoose.Types.ObjectId; // If saving a recipe from a post
  createdAt: Date;
}

const SaveSchema = new Schema<ISave>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'SocialPost',
      required: true,
      index: true,
    },
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
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one save per user per post
SaveSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Save = mongoose.models.Save || mongoose.model<ISave>('Save', SaveSchema);

export default Save;
