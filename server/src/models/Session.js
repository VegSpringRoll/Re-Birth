import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    rawContent: {
      type: String,
      required: true
    },
    swipes: {
      type: [String],
      default: []
    },
    swipeIndex: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const SessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'The Astral Convergence - Episode 1'
    },
    universe: {
      type: String,
      default: 'Tensura (Slime) / Multiverse'
    },
    rollingSummary: {
      type: String,
      default: ''
    },
    lastSummarizedIndex: {
      type: Number,
      default: 0
    },
    pinnedMemories: {
      type: [String],
      default: []
    },
    systemInstructions: {
      type: String,
      default: `You are the Master Storyteller and Game Director for an ultra-immersive, high-stakes anime roleplay experience.
Direct the scene with cinematic prose, vivid sensory depth, tactical precision, and reactive NPC dialogue.

CRITICAL FORMATTING RULES:
1. ALWAYS enclose environmental prose, descriptions, choreography, internal monologues, and third-person narration inside <narration>...</narration> blocks.
2. ALWAYS enclose spoken dialogue and direct character speech inside <say speaker="Character Name">...</say> blocks. Each spoken line by a character must have its own say block with their exact name.
3. NEVER mix raw untagged dialogue outside of <say> blocks.
4. At the very end of EVERY assistant response, you MUST output a single valid JSON block enclosed in <state_update>...</state_update> containing any updates to the world state:
<state_update>
{
  "universe": "string (current universe)",
  "currentEra": "string (current era or arc)",
  "inGameDate": "string (current in-game date)",
  "timeOfDay": "string (e.g. Dawn, Noon, Dusk, Midnight)",
  "currentLocation": "string (precise location)",
  "weather": "string (environmental conditions / atmosphere)",
  "sceneMood": "string (The musical atmosphere and emotional tone of this scene, e.g. 'epic battle', 'peaceful tavern', 'melancholy rain', 'tense standoff', 'comedic banter', 'mystic exploration', 'dark dungeon')",
  "musicTrackQuery": "string (1-3 search keywords for the scene soundtrack, e.g. 'epic orchestral battle', 'lofi chill', 'sad emotional piano', 'dark tension', 'acoustic warm', 'comedy quirky')",
  "knownNPCs": [
    { "name": "Character Name", "relation": "Relationship description", "status": "Current activity or condition" }
  ]
}
</state_update>
`
    },
    userProfile: {
      name: { type: String, default: 'Kaelen Valerius' },
      avatar: { type: String, default: '' },
      gender: { type: String, default: 'Male' },
      physique: { type: String, default: 'Athletic, silver-threaded dark hair, indigo eyes with shifting starlight pupils, wears void-woven shadow coat and obsidian armored vambraces' },
      traits: { type: String, default: 'Stoic yet fiercely protective, tactical genius, attuned to primordial null-space harmonics, sovereign calm under cataclysmic pressure' },
      details: { type: String, default: 'Wielder of the Astral Convergence Core. Originating from the outer dimensional boundary.' }
    },
    movesetKnowledge: {
      type: String,
      default: `[Base Gauntlet Techniques]
- Null-Pulse Strike: Concentrated gravitational repulsor burst fired from palm gauntlets; shatters barriers and creates acoustic shockwaves.
- Obsidian Weave Aegis: Phase-shifts incoming kinetic and elemental energy into harmless astral static.
- Starlight Dash: Micro-warp displacement across 20 meters leaving an afterimage of razor starlight.

[Awakened / Triggered Moves: Blade of End & Veldanava Resonance]
- Star Dragon Roar: Channeling Veldanava's primordial dragon breath through the right gauntlet; disintegrates demonic barriers and reshapes the terrain.
- Blade of the End - Form Zero: The void blade materializes from the singularity core; bypasses conventional space-time to sever causality and immortal regeneration.
- Cosmic Genesis Overdrive: Complete release of astral limits; envelops the battlefield in a stellar domain where all allied attacks deal primordial true damage.`
    },
    messages: {
      type: [MessageSchema],
      default: []
    }
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', SessionSchema);
