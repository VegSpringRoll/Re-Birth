import express from 'express';
import { detectAndSearchCharacterAction, runYandexSearch } from '../services/characterActionService.js';
import { Session } from '../models/Session.js';

const router = express.Router();

/**
 * POST /api/character-action
 * Analyzes what a character is doing in a scene and scrapes Yandex images (safesearch='off')
 */
router.post('/', async (req, res) => {
  try {
    const {
      character = '',
      universe = '',
      sceneText = '',
      customAction = '',
      searchQuery = '',
      sessionId = '',
      apiConfig = null,
    } = req.body;

    if (!character && !searchQuery) {
      return res.status(400).json({ error: 'Character name or search query is required' });
    }

    // Direct search query mode
    if (searchQuery && searchQuery.trim()) {
      const results = await runYandexSearch(searchQuery.trim(), 10, 'off');
      return res.json({
        character,
        universe,
        action: customAction || 'custom search',
        searchQuery: searchQuery.trim(),
        results,
        count: results.length
      });
    }

    let activeApiConfig = apiConfig;

    // If session ID is provided and no client apiConfig, look up session's configured API settings
    if (!activeApiConfig && sessionId) {
      try {
        const session = await Session.findById(sessionId);
        if (session) {
          activeApiConfig = session.summaryApiConfig?.apiKey
            ? session.summaryApiConfig
            : session.apiConfig;
        }
      } catch (e) {
        // Continue with fallback
      }
    }

    const data = await detectAndSearchCharacterAction({
      character,
      universe,
      sceneText,
      customAction,
      apiConfig: activeApiConfig,
    });

    res.json(data);
  } catch (error) {
    console.error('[CharacterActionRoute] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
