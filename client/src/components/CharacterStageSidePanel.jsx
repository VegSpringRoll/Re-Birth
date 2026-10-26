import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Maximize2,
  X,
  Search,
  ExternalLink,
  RotateCw,
  ArrowLeft,
} from 'lucide-react';
import AvatarImage from './AvatarImage.jsx';

export default function CharacterStageSidePanel({
  inspection = null, // { character, universe, action, searchQuery, results, loading, error }
  onSearchAction,
  onClose,
}) {
  const [lightboxItem, setLightboxItem] = useState(null);
  const [customInput, setCustomInput] = useState('');

  if (!inspection) return null;

  const {
    character = 'Character',
    universe = '',
    action = '',
    searchQuery = '',
    results = [],
    loading = false,
    error = null,
  } = inspection;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    if (onSearchAction) {
      onSearchAction(customInput.trim());
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        className="sm:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm animate-fade-in"
      />

      <aside className="fixed sm:relative inset-y-0 right-0 w-full xs:w-[350px] sm:w-80 xl:w-96 shrink-0 border-l border-white/[0.08] bg-[#070a18]/98 sm:bg-[#070a18]/90 backdrop-blur-2xl p-4 flex flex-col justify-between overflow-hidden select-none animate-fade-in z-50 sm:z-20 shadow-2xl pb-safe">
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Panel Top Header: Character Identity & Close */}
        <div className="relative z-10 pb-3 border-b border-white/[0.07] shrink-0 pt-safe">
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Prominent Back to Roleplay Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-bold shadow-md active:scale-95 touch-manipulation shrink-0"
              title="Return to Roleplay"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to RP</span>
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <div className="min-w-0 text-right">
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 font-display tracking-wide truncate">
                  {character}
                </h4>
                <p className="text-[9.5px] font-mono text-purple-300/70 truncate">
                  {universe || 'Scene Action'}
                </p>
              </div>
              <AvatarImage
                speaker={character}
                universe={universe}
                size="sm"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-cyan-400/50 shadow-md shrink-0"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors touch-manipulation sm:hidden"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Badge & Search Bar */}
          <div className="mt-2.5 space-y-2">
            {action && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Scene Action:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-400/40 text-[10px] font-bold font-mono text-cyan-200 capitalize shadow-sm">
                  ✨ {action}
                </span>
              </div>
            )}

            <form onSubmit={handleCustomSubmit} className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={searchQuery || `Search ${character} action...`}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-8 pr-14 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!customInput.trim() || loading}
                className="absolute right-1 px-2 py-0.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white text-[10px] font-mono font-bold transition-all shadow-sm"
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Center: Media Gallery (Yandex via imgsearch-api Results) */}
        <div className="relative z-10 flex-1 my-3 overflow-y-auto no-scrollbar min-h-0 pr-0.5">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
              <AvatarImage
                speaker={character}
                universe={universe}
                size="lg"
                className="w-20 h-20 rounded-3xl opacity-40 blur-xs"
              />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200 font-display">
                  Detecting Scene & Searching Yandex...
                </p>
                <p className="text-[10px] text-purple-300/70 font-mono">
                  Yandex Image Engine (SafeSearch: Off)
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <p className="text-xs text-rose-300 font-sans mb-3">{error}</p>
              <button
                onClick={() => onSearchAction && onSearchAction(searchQuery)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <AvatarImage
                speaker={character}
                universe={universe}
                size="lg"
                className="w-20 h-20 rounded-3xl mb-3 opacity-60"
              />
              <p className="text-xs font-bold text-slate-200 font-display">
                No Yandex results for "{searchQuery}"
              </p>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Try searching a different action phrase in the box above.
              </p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 pb-2">
              {results.map((item, idx) => (
                <div
                  key={`${item.image}-${idx}`}
                  onClick={() => setLightboxItem(item)}
                  className="relative group/card cursor-pointer overflow-hidden rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-400/50 transition-all shadow-md hover:scale-[1.02] aspect-[4/5]"
                >
                  <img
                    src={item.image}
                    alt={item.title || `${character} action`}
                    loading="lazy"
                    className="w-full h-full object-cover object-top select-none transition-transform duration-300 group-hover/card:scale-105"
                  />

                  {/* Dark Bottom Fade */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                  {/* GIF / Animated Badge */}
                  {item.isGif && (
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-pink-950/90 border border-pink-500/40 text-[8px] font-mono font-bold text-pink-300 shadow-sm flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> GIF
                    </div>
                  )}

                  {/* Expand icon on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Footer Info & Quick Return */}
        <div className="relative z-10 pt-2 border-t border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>Engine: Yandex (SafeSearch: Off)</span>
            {results.length > 0 && (
              <span className="text-cyan-400">{results.length} found</span>
            )}
          </div>
          {/* Mobile Full-Width Return Button */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Roleplay</span>
          </button>
        </div>
      </aside>

      {/* Full-Screen Lightbox Modal */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-950 border border-cyan-500/40 rounded-3xl p-4 shadow-2xl overflow-hidden cursor-default animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 gap-2">
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/20 text-slate-200 text-xs font-semibold hover:text-white active:scale-95 touch-manipulation shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center px-1">
                <span className="text-sm font-bold text-slate-100 font-display truncate">
                  {character}
                </span>
                {action && (
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-800/40 px-2 py-0.5 rounded-full capitalize truncate hidden xs:inline">
                    {action}
                  </span>
                )}
                {lightboxItem.isGif && (
                  <span className="text-[9px] font-mono text-pink-400 bg-pink-950/50 border border-pink-800/30 px-1.5 py-0.5 rounded-md uppercase font-bold shrink-0">
                    GIF
                  </span>
                )}
              </div>
              <button
                onClick={() => setLightboxItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-black/70 rounded-2xl overflow-hidden max-h-[75vh]">
              <img
                src={lightboxItem.image}
                alt={lightboxItem.title || character}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl select-none"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-xs">{lightboxItem.title || 'Yandex Scrape'}</span>
              <a
                href={lightboxItem.image}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View Full Media</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
