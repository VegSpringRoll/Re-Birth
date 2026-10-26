import { CharacterAvatar } from '../models/CharacterAvatar.js';

/**
 * High-quality anime character vector avatar using DiceBear Lorelei as a guaranteed CDN fallback
 */
function getDicebearAnimeAvatar(name) {
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || 'Anime')}&backgroundColor=0f172a,1e1b4b,18181b`;
}

/**
 * Generate a reliable stylized anime-themed SVG avatar data URI as an offline local fallback
 */
function generateFallbackAvatar(name, universe) {
  const colors = [
    ['#8B5CF6', '#EC4899'], // Purple -> Pink
    ['#3B82F6', '#06B6D4'], // Blue -> Cyan
    ['#10B981', '#3B82F6'], // Emerald -> Blue
    ['#F59E0B', '#EF4444'], // Amber -> Red
    ['#6366F1', '#A855F7'], // Indigo -> Purple
  ];
  
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorPair = colors[Math.abs(hash) % colors.length];
  const initials = (name || 'RP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorPair[0]}" />
        <stop offset="100%" stop-color="${colorPair[1]}" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="128" height="128" rx="28" fill="#0f172a" />
    <circle cx="64" cy="64" r="54" fill="url(#grad)" opacity="0.85" filter="url(#glow)"/>
    <circle cx="64" cy="64" r="48" fill="#1e1b4b" opacity="0.6"/>
    <text x="50%" y="54%" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials || 'RP'}
    </text>
    <text x="50%" y="82%" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="600" font-size="10" fill="#93c5fd" text-anchor="middle" opacity="0.9">
      ${(universe || 'ANIME').slice(0, 14).toUpperCase()}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Fetch official anime character art from AniList GraphQL API with universe title matching
 */
async function fetchAniListAvatar(characterName, universe) {
  try {
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 6) {
          characters(search: $search) {
            name {
              full
            }
            image {
              large
              medium
            }
            media(page: 1, perPage: 4) {
              nodes {
                title {
                  romaji
                  english
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimeRP/1.0',
      },
      body: JSON.stringify({
        query,
        variables: { search: characterName },
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const characters = json?.data?.Page?.characters || [];
    if (characters.length === 0) return null;

    // If universe name is provided, find character whose anime media title matches universe
    if (universe && typeof universe === 'string' && universe.trim()) {
      const uClean = universe.toLowerCase().trim();
      const matched = characters.find((c) => {
        const mediaNodes = c.media?.nodes || [];
        return mediaNodes.some((m) => {
          const r = (m.title?.romaji || '').toLowerCase();
          const e = (m.title?.english || '').toLowerCase();
          return (
            (r && (r.includes(uClean) || uClean.includes(r))) ||
            (e && (e.includes(uClean) || uClean.includes(e)))
          );
        });
      });
      if (matched?.image?.large || matched?.image?.medium) {
        return matched.image.large || matched.image.medium;
      }
    }

    // Otherwise, find exact name match or first character
    const exactName = characters.find(
      (c) => c.name?.full?.toLowerCase() === characterName.toLowerCase()
    );
    const chosen = exactName || characters[0];
    return chosen?.image?.large || chosen?.image?.medium || null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch official anime character art from Jikan (MyAnimeList open API)
 */
async function fetchJikanAvatar(characterName) {
  try {
    const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(characterName)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      const char = json.data[0];
      const imageUrl = char.images?.webp?.image_url || char.images?.jpg?.image_url;
      if (imageUrl && !imageUrl.includes('apple-touch-icon') && !imageUrl.includes('questionmark')) {
        return imageUrl;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch anime character art from Kitsu API
 */
async function fetchKitsuAvatar(characterName) {
  try {
    const url = `https://kitsu.io/api/edge/characters?filter[name]=${encodeURIComponent(characterName)}&page[limit]=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.api+json' },
      signal: AbortSignal.timeout(2500)
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      const char = json.data[0];
      const img = char.attributes?.image?.original || char.attributes?.image?.medium;
      if (img) return img;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Search DuckDuckGo Images for character icon as an auxiliary search
 */
async function searchDuckDuckGoImage(query) {
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(2000)
    });
    const html = await searchRes.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/) || html.match(/vqd=['"]?([^&'"]+)/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];

    const jsonUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const jsonRes = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/',
      },
      signal: AbortSignal.timeout(2000)
    });

    if (!jsonRes.ok) return null;
    const data = await jsonRes.json();
    if (data.results && data.results.length > 0) {
      const best = data.results[0];
      return best.thumbnail || best.image || null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Search SerpApi if an API key is available
 */
async function searchSerpApiImage(query, apiKey) {
  if (!apiKey) return null;
  try {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.images_results && json.images_results.length > 0) {
      return json.images_results[0].thumbnail || json.images_results[0].original;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch or generate avatar for a character name and universe
 * Reliable multi-tier pipeline:
 * 1. MongoDB cache
 * 2. Jikan official MyAnimeList character API
 * 3. Kitsu anime character API
 * 4. DuckDuckGo / SerpApi
 * 5. DiceBear Lorelei anime illustrated character CDN (100% reliable)
 * 6. Local procedural vector SVG fallback
 */
export async function getOrFetchAvatar(name, universe = 'General Anime') {
  if (!name || !name.trim()) {
    return generateFallbackAvatar('Unknown', universe);
  }

  const cleanName = name.trim();
  const cleanUniverse = (universe || 'General Anime').trim();

  // 1. Check MongoDB cache
  try {
    const existing = await CharacterAvatar.findOne({
      name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      universe: { $regex: new RegExp(`^${cleanUniverse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    // Check if cached image is valid and not a known mismatched/broken URL
    if (existing && existing.avatarUrl && !existing.avatarUrl.includes('kitsu.app/characters/images/70596')) {
      return existing.avatarUrl;
    }
  } catch (dbErr) {
    console.warn('[AvatarService] Database find error:', dbErr.message);
  }

  let avatarUrl = null;

  // 2. Try AniList GraphQL API first (gold-standard anime character database with universe matching)
  try {
    avatarUrl = await fetchAniListAvatar(cleanName, cleanUniverse);
  } catch (e) {}

  // 3. Try Jikan API (authentic official anime character art)
  if (!avatarUrl) {
    try {
      avatarUrl = await fetchJikanAvatar(cleanName);
    } catch (e) {}
  }

  // 4. Try Kitsu API if not found
  if (!avatarUrl) {
    try {
      avatarUrl = await fetchKitsuAvatar(cleanName);
    } catch (e) {}
  }

  // 4. Try SerpApi / DuckDuckGo
  if (!avatarUrl) {
    try {
      const searchQuery = `${cleanName} ${cleanUniverse} anime icon official`;
      if (process.env.SERPAPI_API_KEY) {
        avatarUrl = await searchSerpApiImage(searchQuery, process.env.SERPAPI_API_KEY);
      }
      if (!avatarUrl) {
        avatarUrl = await searchDuckDuckGoImage(searchQuery);
      }
    } catch (e) {}
  }

  // 5. High-reliability Anime Character CDN (DiceBear Lorelei anime character portraits)
  if (!avatarUrl) {
    avatarUrl = getDicebearAnimeAvatar(cleanName);
  }

  // 6. Save to MongoDB
  try {
    await CharacterAvatar.findOneAndUpdate(
      { name: cleanName, universe: cleanUniverse },
      {
        name: cleanName,
        universe: cleanUniverse,
        avatarUrl,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (saveErr) {
    console.warn('[AvatarService] Database save error:', saveErr.message);
  }

  return avatarUrl;
}
