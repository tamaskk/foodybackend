import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBill extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  planName: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema: Schema = new Schema<IBill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeSubscriptionId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    planName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;

