/**
 * Thematic Anime Backgrounds
 * Maps active universe to cinematic atmospheric backdrops,
 * defaulting to the Re-Birth Gothic Citadel from the concept art.
 */

export function getUniverseBackground(universeName) {
  const lower = (universeName || '').toLowerCase();

  if (lower.includes('frieren')) {
    // Snowy Northern Plateau with glowing blue mana auroras
    return {
      gradient: 'radial-gradient(circle at 50% 20%, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.95) 70%)',
      overlay: 'from-slate-950/90 via-slate-900/80 to-cyan-950/90',
      accent: 'border-cyan-500/30 shadow-cyan-950/50',
    };
  }

  if (lower.includes('jujutsu') || lower.includes('jjk')) {
    // Tokyo Shibuya Midnight Cursed Curtain
    return {
      gradient: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.18) 0%, rgba(10, 10, 20, 0.97) 75%)',
      overlay: 'from-slate-950/95 via-purple-950/80 to-slate-950/95',
      accent: 'border-purple-500/30 shadow-purple-950/50',
    };
  }

  if (lower.includes('solo leveling')) {
    // S-Rank Frost & Shadow Gate Caverns
    return {
      gradient: 'radial-gradient(circle at 50% 25%, rgba(99, 102, 241, 0.18) 0%, rgba(7, 9, 22, 0.96) 75%)',
      overlay: 'from-slate-950/90 via-indigo-950/85 to-slate-950/95',
      accent: 'border-indigo-500/30 shadow-indigo-950/50',
    };
  }

  if (lower.includes('bleach')) {
    // Seireitei Sokyoku Hill Reishi Blood Sky
    return {
      gradient: 'radial-gradient(circle at 50% 25%, rgba(244, 63, 94, 0.15) 0%, rgba(10, 8, 20, 0.96) 75%)',
      overlay: 'from-slate-950/90 via-rose-950/80 to-slate-950/95',
      accent: 'border-rose-500/30 shadow-rose-950/50',
    };
  }

  if (lower.includes('fate')) {
    // Ryuudou Temple Full Moon Leylines
    return {
      gradient: 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.15) 0%, rgba(8, 12, 28, 0.96) 75%)',
      overlay: 'from-slate-950/90 via-emerald-950/80 to-slate-950/95',
      accent: 'border-emerald-500/30 shadow-emerald-950/50',
    };
  }

  if (lower.includes('cyberpunk')) {
    // Night City Acid Drizzle Neon Smog
    return {
      gradient: 'radial-gradient(circle at 50% 30%, rgba(236, 72, 153, 0.18) 0%, rgba(6, 182, 212, 0.12) 40%, rgba(7, 9, 20, 0.97) 80%)',
      overlay: 'from-slate-950/95 via-pink-950/75 to-cyan-950/85',
      accent: 'border-pink-500/30 shadow-pink-950/50',
    };
  }

  if (lower.includes('lord of the mysteries')) {
    // Victorian Backlund Gaslight Crimson Moon
    return {
      gradient: 'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.15) 0%, rgba(225, 29, 72, 0.12) 45%, rgba(10, 9, 18, 0.97) 80%)',
      overlay: 'from-slate-950/95 via-amber-950/75 to-slate-950/95',
      accent: 'border-amber-500/30 shadow-amber-950/50',
    };
  }

  // Default: Gothic Anime Astral Citadel from Concept Image
  return {
    gradient: 'radial-gradient(circle at 50% 35%, rgba(139, 92, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(7, 9, 21, 0.98) 85%)',
    overlay: 'from-slate-950/90 via-slate-900/80 to-slate-950/95',
    accent: 'border-purple-500/25 shadow-purple-950/40',
  };
}
