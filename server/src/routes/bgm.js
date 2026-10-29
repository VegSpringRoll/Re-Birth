import express from 'express';

const router = express.Router();

// In-memory cache for FreeToUse query responses (1 hour TTL)
const trackCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Maps scene moods to diverse FreeToUse music search queries
 */
const MOOD_QUERY_MAP = {
  combat: ['action', 'epic', 'battle', 'cinematic', 'intense', 'power'],
  peaceful: ['chill', 'lofi', 'peaceful', 'ambient', 'relaxing', 'calm'],
  mystic: ['fantasy', 'ambient', 'mystical', 'cinematic', 'ethereal', 'piano'],
  dungeon: ['dark', 'tension', 'suspense', 'orchestral', 'mystery', 'cinematic'],
  rain: ['melancholy', 'sad', 'rain', 'lofi', 'emotional', 'ambient'],
  campfire: ['acoustic', 'folk', 'cozy', 'warm', 'guitar', 'peaceful'],
  auto: ['cinematic', 'soundtrack', 'ambient', 'lofi', 'epic'],
};

/**
 * GET /api/bgm/search?query=...&mood=...&limit=...
 * Connects to FreeToUse API (https://freetouse.com/api) to stream copyright-safe BGM
 */
router.get('/search', async (req, res) => {
  const mood = (req.query.mood || 'auto').toLowerCase();
  let query = (req.query.query || '').trim();
  const limit = Math.min(25, Math.max(1, parseInt(req.query.limit, 10) || 12));

  // If no query was passed, pick a relevant term from the mood mapping
  if (!query) {
    const termList = MOOD_QUERY_MAP[mood] || MOOD_QUERY_MAP.auto;
    query = termList[Math.floor(Math.random() * termList.length)];
  }

  const cacheKey = `${mood}_${query.toLowerCase()}_${limit}`;
  const cached = trackCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL && cached.tracks.length > 0) {
    return res.json({
      success: true,
      source: 'freetouse-cache',
      query,
      mood,
      tracks: cached.tracks,
    });
  }

  try {
    const apiUrl = `https://api.freetouse.com/v3/music/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&order=random`;
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ReBirth-Anime-RP/1.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`FreeToUse API responded with status ${response.status}`);
    }

    const json = await response.json();
    const rawList = Array.isArray(json?.data) ? json.data : [];

    const tracks = rawList
      .filter((t) => t && t.files && t.files.mp3)
      .map((t) => {
        const artistName =
          t.artists?.[0]?.[1]?.name ||
          t.artists?.[0]?.name ||
          'Free To Use Artist';
        const categoryName =
          t.categories?.[0]?.[1]?.name ||
          t.genre ||
          'Atmospheric Soundtrack';

        return {
          id: t.id,
          title: t.title || 'Scene Soundtrack',
          artist: artistName,
          genre: t.genre || 'Cinematic',
          category: categoryName,
          duration: t.duration ? Math.round(t.duration) : 120,
          thumbnail: t.thumbnails?.sm || t.thumbnails?.md || '',
          audioUrl: t.files.mp3,
        };
      });

    // Cache the result
    if (tracks.length > 0) {
      trackCache.set(cacheKey, { tracks, timestamp: Date.now() });
    }

    res.json({
      success: true,
      source: 'freetouse.com/api',
      query,
      mood,
      tracks,
    });
  } catch (err) {
    console.warn('[BGM] FreeToUse API fetch warning:', err.message);

    // If search had an issue or timed out, try fallback endpoint /music/tracks/all
    try {
      const fallbackUrl = `https://api.freetouse.com/v3/music/tracks/all?limit=${limit}&order=random`;
      const fbRes = await fetch(fallbackUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        const fbTracks = (fbJson?.data || [])
          .filter((t) => t && t.files && t.files.mp3)
          .map((t) => ({
            id: t.id,
            title: t.title || 'Atmospheric BGM',
            artist: t.artists?.[0]?.[1]?.name || 'Free To Use Music',
            genre: t.genre || 'Cinematic',
            category: t.categories?.[0]?.[1]?.name || 'Soundtrack',
            duration: t.duration ? Math.round(t.duration) : 120,
            thumbnail: t.thumbnails?.sm || t.thumbnails?.md || '',
            audioUrl: t.files.mp3,
          }));

        if (fbTracks.length > 0) {
          return res.json({
            success: true,
            source: 'freetouse-all-fallback',
            query,
            mood,
            tracks: fbTracks,
          });
        }
      }
    } catch (fbErr) {
      console.warn('[BGM] FreeToUse fallback error:', fbErr.message);
    }

    res.status(500).json({
      success: false,
      error: err.message,
      tracks: [],
    });
  }
});

export default router;
