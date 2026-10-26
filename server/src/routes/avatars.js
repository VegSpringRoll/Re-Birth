import express from 'express';
import { getOrFetchAvatar } from '../services/avatarService.js';
import { CharacterAvatar } from '../models/CharacterAvatar.js';

const router = express.Router();

/**
 * GET /api/avatars/:name?universe=...
 * Dynamic Avatar Service:
 * 1. Checks MongoDB collection CharacterAvatar
 * 2. If missing, queries DuckDuckGo / SerpApi for "${name} ${universe} anime icon official"
 * 3. Saves thumbnail URL to MongoDB and returns it.
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { universe } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    const avatarUrl = await getOrFetchAvatar(name, universe);
    return res.json({
      name,
      universe: universe || 'General Anime',
      avatarUrl
    });
  } catch (error) {
    console.error('[AvatarRoute] Error fetching avatar:', error);
    res.status(500).json({ error: 'Failed to fetch avatar', details: error.message });
  }
});

/**
 * GET /api/avatars (list all cached avatars)
 */
router.get('/', async (req, res) => {
  try {
    const avatars = await CharacterAvatar.find().sort({ lastUpdated: -1 }).limit(100);
    res.json(avatars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
