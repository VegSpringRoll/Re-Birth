import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  Settings,
  User,
  Globe,
  Archive,
  X,
  Menu,
  Compass,
  Check,
} from 'lucide-react';
import { getActiveProvider, getStoredApiKeys, getStoredModels } from '../utils/storage.js';
import AudioController from './AudioController.jsx';

export default function Navbar({
  sessions,
  currentSessionId,
  currentUniverse,
  activeNpcCount = 0,
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
  const [chronicleDropdownOpen, setChronicleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileChroniclesOpen, setMobileChroniclesOpen] = useState(false);
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
        setChronicleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-[60px] border-b border-white/[0.07] bg-[#080b1a]/95 backdrop-blur-2xl px-3 sm:px-6 flex items-center justify-between shrink-0 z-40 shadow-lg shadow-black/60 select-none">
      {/* ─── LEFT: Brand & Desktop Quick Selectors / Mobile World Chip ─── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={onOpenWorldForge}
          title="Open Realm Gateway"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-400/35 bg-gradient-to-tr from-purple-900/70 via-slate-900 to-cyan-900/50 flex items-center justify-center shadow-md shadow-purple-950/60 group-hover:border-cyan-400/60 transition-all shrink-0">
            <Sparkles className="w-4 h-4 text-purple-300 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div className="leading-none">
            <span className="block text-xs sm:text-sm font-black tracking-[0.18em] sm:tracking-[0.25em] uppercase bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              RE-BIRTH
            </span>
            <span className="block text-[7.5px] sm:text-[8px] font-mono tracking-[0.15em] sm:tracking-[0.18em] uppercase text-purple-400/70 hidden xs:block">
              ANIME ENGINE
            </span>
          </div>
        </div>

        {/* Mobile-Only World Button (Opens World State, NPCs & Summary drawer) */}
        {currentSessionId && (
          <button
            onClick={onToggleLeftPanel}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-[10.5px] font-bold text-purple-200 transition-all shadow-sm active:scale-95 touch-manipulation shrink-0"
            title="Open World, NPCs & Timeline Matrix"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>World</span>
            {activeNpcCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-900 text-purple-300 border border-purple-700/50 text-[9px] font-mono font-bold leading-none">
                {activeNpcCount}
              </span>
            )}
          </button>
        )}

        <div className="hidden md:block w-px h-5 bg-purple-500/20 shrink-0" />

        {/* ─── DESKTOP ONLY: Universe Selector Pill ─── */}
        <button
          onClick={onOpenWorldForge}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold text-cyan-200 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer touch-manipulation"
          title="Universe Selector: Pick realm or create new world"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-400/80 font-mono text-[11px]">Universe:</span>
          <span className="font-bold text-cyan-300 max-w-[180px] lg:max-w-[260px] truncate">
            {currentUniverse || 'Worlds'}
          </span>
          <ChevronDown className="w-3 h-3 text-cyan-400/70 shrink-0" />
        </button>

        {/* ─── DESKTOP ONLY: Chronicle Archive Dropdown ─── */}
        <div className="relative shrink-0 hidden md:block" ref={dropdownRef}>
          <button
            onClick={() => setChronicleDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 hover:border-purple-400 text-xs font-bold text-purple-200 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
            title="Chronicle Archive: Switch roleplays or view saved sessions"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[11px]">Chronicles</span>
            <span className="text-[10px] font-mono text-purple-200 bg-purple-900/90 border border-purple-700/60 rounded-full px-1.5 py-0.2 leading-none font-bold">
              {safeSessions.length}
            </span>
            <ChevronDown className={`w-3 h-3 text-purple-400/70 transition-transform ${chronicleDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop Dropdown */}
          {chronicleDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#070a16] border border-purple-500/40 shadow-2xl shadow-black p-3 z-50 animate-fade-in ring-1 ring-purple-500/20">
              <div className="flex items-center justify-between px-1 py-1.5 mb-2 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-300 tracking-wider">
                  Active Chronicles ({safeSessions.length})
                </span>
                <button
                  onClick={() => {
                    setChronicleDropdownOpen(false);
                    onOpenWorldForge();
                  }}
                  className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 px-2.5 py-1 rounded-lg border border-cyan-700/50 transition-colors font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>New RP</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                {safeSessions.length === 0 && (
                  <p className="text-center text-[11px] text-slate-400 font-mono py-6 leading-relaxed">
                    No chronicles yet.{' '}
                    <span className="text-cyan-400 cursor-pointer font-bold" onClick={() => { setChronicleDropdownOpen(false); onOpenWorldForge(); }}>
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
                          setChronicleDropdownOpen(false);
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

      {/* ─── RIGHT: Audio + Desktop Controls OR Mobile Hamburger ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Ambient Soundscapes Controller (Mutable BGM) */}
        <AudioController currentSceneContext={currentSceneContext} />

        {/* ─── DESKTOP ONLY: Protagonist Persona & Settings Buttons ─── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Protagonist Persona / OC Button */}
          <button
            onClick={onOpenPersonaModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 group cursor-pointer active:scale-95 touch-manipulation"
            title="Protagonist Persona & OC Moveset Lorebook Hub"
          >
            <User className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-display uppercase tracking-wider text-[11px] font-bold text-cyan-300">
              Persona
            </span>
          </button>

          {/* API Keys & Settings Button with Live Key Status Dot */}
          <button
            onClick={onToggleRightDrawer}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md group active:scale-95 touch-manipulation ${
              isRightDrawerOpen
                ? 'bg-purple-600/90 text-white border border-purple-400 shadow-purple-900/60'
                : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 hover:border-purple-400'
            }`}
            title="API Keys, Models, Samplers & Engine Settings"
          >
            <Settings className={`w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition-transform duration-300 ${isRightDrawerOpen ? 'rotate-45 text-white' : ''}`} />
            <span className="font-display uppercase tracking-wider text-[11px] font-bold text-purple-300">
              Settings
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                hasKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
              title={hasKey ? 'API Key Connected' : 'API Key Missing - Click to connect'}
            />
          </button>
        </div>

        {/* ─── MOBILE ONLY: Hamburger Menu Trigger Button ─── */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`md:hidden flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 touch-manipulation relative ${
            mobileMenuOpen
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-slate-900/90 text-slate-200 border-white/10 hover:border-purple-500/40'
          }`}
          title="Open Menu: Persona, Settings, Universe, Chronicles"
        >
          <Menu className="w-5 h-5 text-purple-300" />
          {/* Status Indicator Dot on Hamburger */}
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
              hasKey ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
          />
        </button>
      </div>

      {/* ─── MOBILE HAMBURGER MENU DRAWER (Holds Persona, Settings, Universe, Chronicles) ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[80] flex justify-end bg-black/80 backdrop-blur-md animate-fade-in">
          {/* Backdrop Tap to Close */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer Sheet */}
          <div className="w-[88vw] max-w-sm h-full bg-[#080b1e]/98 border-l border-purple-500/30 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto pb-safe overscroll-contain">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-100 font-display">
                      RE-BIRTH ENGINE MENU
                    </h3>
                    <p className="text-[10px] text-purple-300/70 font-mono">Mobile Control Matrix</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 border border-white/10 touch-manipulation"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ─── Item 1: Universe Selector ─── */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWorldForge();
                }}
                className="p-3.5 rounded-2xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-left transition-all active:scale-[0.98] shadow-md cursor-pointer touch-manipulation group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-200">
                      Universe Selector
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-900/70 border border-cyan-700/50">
                    Switch Realm
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate pl-9">
                  {currentUniverse || 'Select or Forge Universe'}
                </p>
                <p className="text-[10.5px] text-slate-400 pl-9 mt-0.5">
                  Tap to browse anime presets or enter a custom verse.
                </p>
              </div>

              {/* ─── Item 2: Chronicles Archive (with Expandable RP List) ─── */}
              <div className="rounded-2xl bg-purple-950/50 border border-purple-500/40 overflow-hidden shadow-md">
                <div
                  onClick={() => setMobileChroniclesOpen((v) => !v)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-purple-900/40 transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <Archive className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider text-purple-200 block">
                        Chronicles Archive
                      </span>
                      <span className="text-[10.5px] text-purple-300/80 font-mono">
                        {safeSessions.length} Saved Roleplays
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(false);
                        onOpenWorldForge();
                      }}
                      className="text-[10.5px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-1 rounded-lg border border-cyan-700/50 flex items-center gap-1 active:scale-95 touch-manipulation"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                    <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${mobileChroniclesOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {mobileChroniclesOpen && (
                  <div className="p-3 pt-0 border-t border-purple-500/20 space-y-1.5 max-h-56 overflow-y-auto overscroll-contain">
                    {safeSessions.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 font-mono py-4">
                        No saved chronicles yet. Tap <b>+ New</b> to begin an adventure!
                      </p>
                    ) : (
                      safeSessions.map((s) => {
                        const isSelected = s._id === currentSessionId;
                        return (
                          <div
                            key={s._id}
                            onClick={() => {
                              onSelectSession(s._id);
                              setMobileMenuOpen(false);
                            }}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all active:scale-[0.99] touch-manipulation ${
                              isSelected
                                ? 'bg-purple-900/70 border-purple-400 text-white font-bold shadow-md'
                                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-white/10'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="truncate font-semibold text-slate-100">{s.title}</p>
                              <p className="text-[10px] text-purple-300/80 font-mono truncate">
                                {s.universe || 'Anime Realm'} &bull; {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {isSelected && (
                                <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 shrink-0">
                                  Active
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete chronicle "${s.title}"?`)) {
                                    onDeleteSession(s._id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* ─── Item 3: Protagonist Persona / OC Hub ─── */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPersonaModal();
                }}
                className="p-3.5 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/35 text-left transition-all active:scale-[0.98] shadow-md cursor-pointer touch-manipulation group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-200">
                      Protagonist Persona (OC)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/50">
                    OC Hub
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate pl-9">
                  Manage OC &amp; Moveset Lorebook
                </p>
                <p className="text-[10.5px] text-slate-400 pl-9 mt-0.5">
                  Configure character identity, traits, avatar &amp; keyword abilities.
                </p>
              </div>

              {/* ─── Item 4: Settings & BYOK Keys ─── */}
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  onToggleRightDrawer();
                }}
                className="p-3.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/35 text-left transition-all active:scale-[0.98] shadow-md cursor-pointer touch-manipulation group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-purple-200">
                      Engine Settings
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    hasKey
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                      : 'bg-amber-950 text-amber-300 border-amber-700/50 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {hasKey ? 'Connected' : 'Setup Key'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate pl-9">
                  API Keys, Models &amp; Samplers
                </p>
                <p className="text-[10.5px] text-slate-400 pl-9 mt-0.5">
                  Provider: <span className="uppercase text-purple-300 font-mono">{activeProvider}</span> &bull; Model: <span className="text-purple-300 font-mono truncate">{activeModel}</span>
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-[10px] font-mono text-purple-300/60 uppercase tracking-widest">
                RE-BIRTH ENGINE &bull; MOBILE RUNTIME
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
