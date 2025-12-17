import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHousehold extends Document {
  name: string;
  members: mongoose.Types.ObjectId[]; // Array of user IDs
  createdBy: mongoose.Types.ObjectId;
  inviteCode: string; // Unique code for joining household
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdSchema: Schema = new Schema<IHousehold>(
  {
    name: {
      type: String,
      required: [true, 'Household name is required'],
      trim: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
HouseholdSchema.index({ inviteCode: 1 }, { unique: true });
HouseholdSchema.index({ members: 1 });

// Prevent re-compilation during development
const Household: Model<IHousehold> = mongoose.models.Household || mongoose.model<IHousehold>('Household', HouseholdSchema);

export default Household;

