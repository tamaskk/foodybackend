import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  postId?: mongoose.Types.ObjectId;
  commentId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'SocialPost',
      index: true,
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure either postId or commentId is provided
LikeSchema.pre('validate', function(next) {
  if (!this.postId && !this.commentId) {
    next(new Error('Either postId or commentId must be provided'));
  } else {
    next();
  }
});

// Compound index to ensure one like per user per post
// Use partial index to only apply when postId exists
LikeSchema.index(
  { postId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { postId: { $exists: true, $ne: null } } }
);
// Compound index to ensure one like per user per comment
// Use partial index to only apply when commentId exists
LikeSchema.index(
  { commentId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { commentId: { $exists: true, $ne: null } } }
);

const Like = mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);

export default Like;
