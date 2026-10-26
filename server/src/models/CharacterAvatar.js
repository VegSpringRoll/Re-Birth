import mongoose from 'mongoose';

const CharacterAvatarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    universe: {
      type: String,
      default: 'General Anime',
      trim: true,
      index: true
    },
    avatarUrl: {
      type: String,
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index for quick lookups per universe and normalized name
CharacterAvatarSchema.index({ name: 1, universe: 1 });

export const CharacterAvatar = mongoose.model('CharacterAvatar', CharacterAvatarSchema);
