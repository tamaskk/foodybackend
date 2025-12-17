import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHouseholdInvitation extends Document {
  householdId: mongoose.Types.ObjectId;
  invitedByUserId: mongoose.Types.ObjectId;
  invitedUserEmail: string;
  invitedUserId?: mongoose.Types.ObjectId; // Set when the email matches a user
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdInvitationSchema: Schema = new Schema<IHouseholdInvitation>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
      index: true,
    },
    invitedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invitedUserEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    invitedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate invitations
HouseholdInvitationSchema.index({ householdId: 1, invitedUserEmail: 1, status: 1 });

// Prevent re-compilation during development
const HouseholdInvitation: Model<IHouseholdInvitation> = 
  mongoose.models.HouseholdInvitation || 
  mongoose.model<IHouseholdInvitation>('HouseholdInvitation', HouseholdInvitationSchema);

export default HouseholdInvitation;

