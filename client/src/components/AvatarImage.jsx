import React, { useState, useEffect } from 'react';

// Persistent localStorage key
const LOCAL_STORAGE_AVATAR_KEY = 'rebirth_avatar_cache_v2';

// In-memory cache for ultra-fast synchronous lookup across components
const avatarCache = new Map();

// Initialize in-memory cache from localStorage on script load
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v) {
            avatarCache.set(k, v);
          }
        });
      }
    }
  }
} catch (e) {
  console.warn('[AvatarImage] Could not restore avatar cache from localStorage:', e);
}

function persistAvatarToStorage(key, url) {
  try {
    avatarCache.set(key, url);
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY);
      let parsed = {};
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = {};
        }
      }
      parsed[key] = url;
      // Cap cache at 500 items to keep localStorage light
      const entries = Object.entries(parsed);
      if (entries.length > 500) {
        parsed = Object.fromEntries(entries.slice(entries.length - 500));
      }
      localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, JSON.stringify(parsed));
    }
  } catch (e) {
    console.warn('[AvatarImage] Failed saving avatar to localStorage:', e);
  }
}

export default function AvatarImage({ src, speaker, universe = 'General Anime', size = 'md', className = '' }) {
  const cacheKey = speaker ? `${speaker}_${universe}` : null;
  const initialUrl = src || (cacheKey ? avatarCache.get(cacheKey) : null);

  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(!src && !initialUrl && !!speaker);
  const [fallbackSrc, setFallbackSrc] = useState(null);

  useEffect(() => {
    if (src) {
      setAvatarUrl(src);
      setLoading(false);
      return;
    }
    if (!speaker) {
      setLoading(false);
      return;
    }
    const key = `${speaker}_${universe}`;
    if (avatarCache.has(key)) {
      setAvatarUrl(avatarCache.get(key));
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/avatars/${encodeURIComponent(speaker)}?universe=${encodeURIComponent(universe || '')}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          const url = data.avatarUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(speaker)}&backgroundColor=0f172a,1e1b4b`;
          persistAvatarToStorage(key, url);
          setAvatarUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Avatar fetch error:', err);
        if (isMounted) {
          const fallback = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(speaker)}&backgroundColor=0f172a,1e1b4b`;
          persistAvatarToStorage(key, fallback);
          setAvatarUrl(fallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src, speaker, universe]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
    full: 'w-full h-full',
  }[size] || 'w-11 h-11 text-sm';

  const handleImgError = () => {
    if (!fallbackSrc) {
      setFallbackSrc(`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(speaker || 'Anime')}&backgroundColor=0f172a,1e1b4b`);
    }
  };

  const currentSrc = fallbackSrc || avatarUrl;

  return (
    <div
      className={`relative shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-md shadow-black/40 flex items-center justify-center transition-transform hover:scale-105 ${sizeClasses} ${className}`}
      title={speaker}
    >
      {loading ? (
        <div className="w-full h-full animate-pulse bg-gradient-to-tr from-purple-900/40 via-slate-900 to-slate-800 flex items-center justify-center">
          <span className="text-[10px] font-mono text-purple-300">...</span>
        </div>
      ) : currentSrc ? (
        <img
          src={currentSrc}
          alt={speaker}
          className="w-full h-full object-cover object-top"
          onError={handleImgError}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center font-bold text-white tracking-wider">
          {(speaker || '?').slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-white/10" />
    </div>
  );
}
