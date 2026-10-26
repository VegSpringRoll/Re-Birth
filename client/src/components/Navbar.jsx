import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  ChevronDown,
  Settings,
  User,
  Globe,
  Archive,
} from 'lucide-react';
import { getActiveProvider, getStoredApiKeys, getStoredModels } from '../utils/storage.js';
import AudioController from './AudioController.jsx';

export default function Navbar({
  sessions,
  currentSessionId,
  currentUniverse,
  onSelectSession,
  onOpenWorldForge,
  onOpenSettings,
  onOpenPersonaModal,
  onDeleteSession,
  onToggleRightDrawer,
  onToggleLeftPanel,
  isRightDrawerOpen,
  keyTick,
  currentSceneContext,
}) {
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeProvider = getActiveProvider();
  const apiKeys = getStoredApiKeys();
  const models = getStoredModels();
  const hasKey = Boolean(apiKeys[activeProvider]?.trim());
  const activeModel = models[activeProvider] || 'default';

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const currentSession = safeSessions.find((s) => s._id === currentSessionId);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setChronicleOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-[60px] border-b border-white/[0.07] bg-[#080b1a]/95 backdrop-blur-2xl px-2.5 sm:px-6 flex items-center justify-between shrink-0 z-40 shadow-lg shadow-black/60 select-none">
      {/* LEFT: Brand + Universe Pill + Chronicle Pill */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Brand */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          onClick={onOpenWorldForge}
          title="Open Realm Gateway"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-400/35 bg-gradient-to-tr from-purple-900/70 via-slate-900 to-cyan-900/50 flex items-center justify-center shadow-md shadow-purple-950/60 group-hover:border-cyan-400/60 transition-all">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div className="leading-none">
            <span className="block text-[12px] sm:text-sm font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              RE-BIRTH
            </span>
            <span className="block text-[7.5px] sm:text-[8px] font-mono tracking-[0.15em] sm:tracking-[0.18em] uppercase text-purple-400/70 hidden xs:block">
              ANIME ROLEPLAY ENGINE
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-purple-500/20 shrink-0" />

        {/* Universe Pill */}
        <button
          onClick={onOpenWorldForge}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-400/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm shrink-0"
          title="Select or change universe"
        >
          <Globe className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="text-slate-400/80 font-mono">Universe:</span>
          <span className="font-bold text-cyan-300 max-w-[130px] truncate">
            {currentUniverse || 'Choose World'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {/* Chronicle Archive Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setChronicleOpen((v) => !v)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-400/40 text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-sm"
            title="Chronicle Archive"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider hidden sm:inline">Chronicle Archive</span>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 border border-purple-700/40 rounded-full px-1.5 py-0.5 leading-none">
              {safeSessions.length}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${chronicleOpen ? 'rotate-180' : ''}`} />
          </button>

          {chronicleOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#070a16] border border-purple-500/40 shadow-2xl shadow-black p-3 z-50 animate-fade-in ring-1 ring-purple-500/20">
              <div className="flex items-center justify-between px-1 py-1.5 mb-2 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-300 tracking-wider">
                  Active Chronicles ({safeSessions.length})
                </span>
                <button
                  onClick={() => {
                    setChronicleOpen(false);
                    onOpenWorldForge();
                  }}
                  className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 px-2.5 py-1 rounded-lg border border-cyan-700/50 transition-colors font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                {safeSessions.length === 0 && (
                  <p className="text-center text-[11px] text-slate-400 font-mono py-6 leading-relaxed">
                    No chronicles yet.{' '}
                    <span className="text-cyan-400 cursor-pointer font-bold" onClick={() => { setChronicleOpen(false); onOpenWorldForge(); }}>
                      + New
                    </span>{' '}to begin.
                  </p>
                )}
                {safeSessions.map((s) => {
                  const isSelected = s._id === currentSessionId;
                  return (
                    <div
                      key={s._id}
                      className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-purple-900/40 border-purple-400/60 text-white shadow-md shadow-purple-950/60'
                          : 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border-white/[0.08] hover:border-purple-500/30'
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0 pr-2"
                        onClick={() => {
                          onSelectSession(s._id);
                          setChronicleOpen(false);
                        }}
                      >
                        <p className="truncate font-bold text-slate-100">{s.title}</p>
                        <p className="text-[10px] text-purple-300/80 font-mono truncate mt-0.5">
                          {s.universe || 'Anime Realm'} &bull;{' '}
                          {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete chronicle "${s.title}" and all data?`)) {
                            onDeleteSession(s._id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-all shrink-0"
                        title="Delete Chronicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Persona Button + Retain Settings button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {currentSessionId && (
          <button
            onClick={onToggleLeftPanel}
            className="md:hidden flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.08] text-[11px] font-semibold text-purple-300 transition-all shadow-sm"
            title="Open World & Timeline Matrix"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="max-w-[50px] truncate">{currentUniverse || 'World'}</span>
          </button>
        )}

        {/* Ambient Soundscapes Controller (Mutable BGM) */}
        <AudioController currentSceneContext={currentSceneContext} />

        {/* Persona Hub Button */}
        <button
          onClick={onOpenPersonaModal}
          className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md bg-white/[0.04] hover:bg-cyan-500/10 text-slate-200 border border-white/[0.08] hover:border-cyan-400/40 group cursor-pointer"
          title="Protagonist Persona & Moveset Lorebook Hub"
        >
          <User className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-display uppercase tracking-wider text-[11px] hidden sm:inline">
            Persona
          </span>
        </button>

        <button
          onClick={onToggleRightDrawer}
          className={`flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md group ${
            isRightDrawerOpen
              ? 'bg-purple-600/80 text-white border border-purple-400/50 shadow-purple-900/60'
              : 'bg-white/[0.04] hover:bg-purple-500/10 text-slate-200 border border-white/[0.08] hover:border-purple-400/40'
          }`}
          title="Settings & Samplers"
        >
          <Settings className={`w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition-transform duration-300 ${isRightDrawerOpen ? 'rotate-45 text-white' : ''}`} />
          <span className="font-display uppercase tracking-wider text-[11px] hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}
