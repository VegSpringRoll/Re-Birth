import mongoose from 'mongoose';

const UserSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global_user_settings', unique: true },
    activeProvider: { type: String, default: 'openrouter' },
    apiKeys: { type: Map, of: String, default: {} },
    models: { type: Map, of: String, default: {} },
    customProxyUrl: { type: String, default: 'http://localhost:11434/v1' },
    samplers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    summaryConfig: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    apiProfiles: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        provider: { type: String, required: true },
        model: { type: String, default: '' },
        apiKey: { type: String, default: '' },
        customBaseUrl: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activeProfileId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);
