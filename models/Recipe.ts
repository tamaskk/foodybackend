import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  owning: boolean;
  code: string;
  time: string; // e.g., "30 min"
  kcal: string; // e.g., "250 kcal"
  picture: {
    type: 'emoji' | 'color' | 'image';
    value: string; // emoji character, color hex code, or image URL
  };
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
  ingredients: string[];
  steps: string[];
  links: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owning: {
      type: Boolean,
      default: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{5}$/,
    },
    time: {
      type: String,
      default: '',
      trim: true,
    },
    kcal: {
      type: String,
      default: '',
      trim: true,
    },
    picture: {
      type: {
        type: String,
        enum: ['emoji', 'color', 'image'],
        default: 'emoji',
      },
      value: {
        type: String,
        default: '🍽️',
      },
    },
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink'],
      required: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    steps: {
      type: [String],
      default: [],
    },
    links: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
RecipeSchema.index({ userId: 1, createdAt: -1 });
RecipeSchema.index({ code: 1 }, { unique: true });

const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;
