import express from 'express';
import { UserSettings } from '../models/UserSettings.js';

const router = express.Router();

const DUMMY_PROFILE_PREFIXES = ['profile-groq-', 'profile-mistral-', 'profile-openrouter-', 'profile-gemini-', 'profile-openai-', 'profile-custom-'];

function isDummyProfile(profile) {
  if (!profile || !profile.id) return true;
  // If it's one of the built-in template placeholders without an API key
  const isDefaultTemplate = DUMMY_PROFILE_PREFIXES.some((pre) => profile.id.startsWith(pre));
  return isDefaultTemplate && !profile.apiKey;
}

// GET /api/settings/byok - Load cloud-persisted BYOK & API profiles
router.get('/byok', async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ key: 'global_user_settings' });
    if (!settings) {
      settings = await UserSettings.create({
        key: 'global_user_settings',
        activeProvider: 'openrouter',
        apiKeys: {},
        models: {},
        apiProfiles: [],
        activeProfileId: '',
      });
    }

    // Clean out dummy profiles if any exist
    const cleanProfiles = (settings.apiProfiles || []).filter((p) => !isDummyProfile(p));

    res.json({
      success: true,
      activeProvider: settings.activeProvider || 'openrouter',
      apiKeys: Object.fromEntries(settings.apiKeys || new Map()),
      models: Object.fromEntries(settings.models || new Map()),
      customProxyUrl: settings.customProxyUrl || 'http://localhost:11434/v1',
      samplers: Object.fromEntries(settings.samplers || new Map()),
      summaryConfig: Object.fromEntries(settings.summaryConfig || new Map()),
      apiProfiles: cleanProfiles,
      activeProfileId: settings.activeProfileId || '',
    });
  } catch (err) {
    console.error('[Settings] Failed to fetch BYOK settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings/byok - Save / update cloud-persisted BYOK & API profiles
router.put('/byok', async (req, res) => {
  try {
    const {
      activeProvider,
      apiKeys,
      models,
      customProxyUrl,
      samplers,
      summaryConfig,
      apiProfiles,
      activeProfileId,
    } = req.body;

    const cleanProfiles = Array.isArray(apiProfiles)
      ? apiProfiles.filter((p) => !isDummyProfile(p))
      : [];

    const updateData = {};
    if (activeProvider !== undefined) updateData.activeProvider = activeProvider;
    if (apiKeys !== undefined) updateData.apiKeys = apiKeys;
    if (models !== undefined) updateData.models = models;
    if (customProxyUrl !== undefined) updateData.customProxyUrl = customProxyUrl;
    if (samplers !== undefined) updateData.samplers = samplers;
    if (summaryConfig !== undefined) updateData.summaryConfig = summaryConfig;
    if (apiProfiles !== undefined) updateData.apiProfiles = cleanProfiles;
    if (activeProfileId !== undefined) updateData.activeProfileId = activeProfileId;

    const settings = await UserSettings.findOneAndUpdate(
      { key: 'global_user_settings' },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'BYOK settings & API profiles saved to MongoDB',
      activeProvider: settings.activeProvider,
      apiProfiles: settings.apiProfiles,
    });
  } catch (err) {
    console.error('[Settings] Failed to save BYOK settings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/clean-dummy - Delete all unnecessary dummy BYOK profiles
router.post('/clean-dummy', async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ key: 'global_user_settings' });
    if (!settings) {
      return res.json({ success: true, apiProfiles: [] });
    }

    const cleanProfiles = (settings.apiProfiles || []).filter((p) => !isDummyProfile(p));
    settings.apiProfiles = cleanProfiles;
    await settings.save();

    res.json({
      success: true,
      message: 'Dummy BYOK profiles purged',
      apiProfiles: cleanProfiles,
    });
  } catch (err) {
    console.error('[Settings] Clean dummy profiles error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
