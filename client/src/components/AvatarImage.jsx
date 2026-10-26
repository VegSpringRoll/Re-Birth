import React, { useState, useEffect } from 'react';

// In-memory cache for avatar URLs across renders
const avatarCache = new Map();

export default function AvatarImage({ src, speaker, universe = 'General Anime', size = 'md', className = '' }) {
  const [avatarUrl, setAvatarUrl] = useState(() => src || avatarCache.get(`${speaker}_${universe}`) || null);
  const [loading, setLoading] = useState(!src && !avatarUrl);
  const [fallbackSrc, setFallbackSrc] = useState(null);

  useEffect(() => {
    if (src) {
      setAvatarUrl(src);
      setLoading(false);
      return;
    }
    if (!speaker) return;
    const cacheKey = `${speaker}_${universe}`;
    if (avatarCache.has(cacheKey)) {
      setAvatarUrl(avatarCache.get(cacheKey));
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
          avatarCache.set(cacheKey, url);
          setAvatarUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Avatar fetch error:', err);
        if (isMounted) {
          const fallback = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(speaker)}&backgroundColor=0f172a,1e1b4b`;
          setAvatarUrl(fallback);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [speaker, universe]);

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
