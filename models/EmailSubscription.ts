import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailSubscription extends Document {
  name: string;
  email: string;
  createdAt: Date;
}

const EmailSubscriptionSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
  createdAt: { type: Date, default: Date.now },
});

// Create index on email to prevent duplicates
EmailSubscriptionSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.EmailSubscription || mongoose.model<IEmailSubscription>('EmailSubscription', EmailSubscriptionSchema);
