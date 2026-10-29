import mongoose from 'mongoose';

const KnownNPCSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, default: 'Neutral / Acquaintance' },
    status: { type: String, default: 'Active' },
    isPresent: { type: Boolean, default: true },
    affinity: { type: Number, default: 50, min: 0, max: 100 },
    bondTier: { type: String, default: 'Acquaintance' },
  },
  { _id: false }
);

const WorldStateSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true
    },
    universe: {
      type: String,
      default: 'Tensura (That Time I Got Reincarnated as a Slime) / Multiverse'
    },
    currentEra: {
      type: String,
      default: 'Tenma Great War Pre-Dawn'
    },
    inGameDate: {
      type: String,
      default: 'Year 2043 of the Jura Calendar'
    },
    timeOfDay: {
      type: String,
      default: 'Dusk / Twilight'
    },
    currentLocation: {
      type: String,
      default: 'Tempest Central Plaza - Rimuru City Outskirts'
    },
    weather: {
      type: String,
      default: 'Crisp dusk breeze with faint arcane particulate glow'
    },
    sceneMood: {
      type: String,
      default: 'peaceful'
    },
    musicTrackQuery: {
      type: String,
      default: 'peaceful ambient lofi'
    },
    knownNPCs: {
      type: [KnownNPCSchema],
      default: [
        {
          name: 'Rimuru Tempest',
          relation: 'Allied Sovereign / Close Confidant',
          status: 'Resting in administrative tower'
        },
        {
          name: 'Veldanava',
          relation: 'Primordial Dragon Ancestor / Mysterious Resonance',
          status: 'Slumbering beyond reality'
        },
        {
          name: 'Guy Crimson',
          relation: 'Watchful Neutral Lord of Darkness',
          status: 'Observing cosmic anomalies from the North'
        }
      ]
    }
  },
  { timestamps: true }
);

export const WorldState = mongoose.model('WorldState', WorldStateSchema);
