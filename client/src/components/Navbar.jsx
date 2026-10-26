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
  X,
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
    <header className="h-[60px] border-b border-white/[0.07] bg-[#080b1a]/95 backdrop-blur-2xl px-2 sm:px-6 flex items-center justify-between shrink-0 z-40 shadow-lg shadow-black/60 select-none">
      {/* LEFT: Brand + Universe Selector Pill + Chronicle Archive Pill */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Brand */}
        <div
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0"
          onClick={onOpenWorldForge}
          title="Open Realm Gateway"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-purple-400/35 bg-gradient-to-tr from-purple-900/70 via-slate-900 to-cyan-900/50 flex items-center justify-center shadow-md shadow-purple-950/60 group-hover:border-cyan-400/60 transition-all shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div className="leading-none">
            <span className="block text-[11px] sm:text-sm font-black tracking-[0.18em] sm:tracking-[0.25em] uppercase bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
              RE-BIRTH
            </span>
            <span className="block text-[7.5px] sm:text-[8px] font-mono tracking-[0.15em] sm:tracking-[0.18em] uppercase text-purple-400/70 hidden xs:block">
              ANIME ENGINE
            </span>
          </div>
        </div>

        <div className="hidden sm:block w-px h-5 bg-purple-500/20 shrink-0" />

        {/* Universe Selector Pill (Always Visible on Mobile & Desktop) */}
        <button
          onClick={onOpenWorldForge}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 hover:border-cyan-400 text-[10.5px] sm:text-[11px] font-bold text-cyan-200 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer touch-manipulation"
          title="Universe Selector: Pick realm or create new world"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline text-slate-400/80 font-mono">Universe:</span>
          <span className="font-bold text-cyan-300 max-w-[65px] xs:max-w-[95px] sm:max-w-[180px] md:max-w-[260px] truncate">
            {currentUniverse || 'Worlds'}
          </span>
          <ChevronDown className="w-3 h-3 text-cyan-400/70 shrink-0" />
        </button>

        {/* Chronicle Archive Pill (Always Visible on Mobile & Desktop) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setChronicleOpen((v) => !v)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/90 border border-purple-500/40 hover:border-purple-400 text-[10.5px] sm:text-[11px] font-bold text-purple-200 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
            title="Chronicle Archive: Switch roleplays or view saved sessions"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider hidden sm:inline">Chronicles</span>
            <span className="font-bold uppercase tracking-wider hidden xs:inline sm:hidden">RPs</span>
            <span className="text-[9.5px] sm:text-[10px] font-mono text-purple-200 bg-purple-900/90 border border-purple-700/60 rounded-full px-1.5 py-0.2 leading-none font-bold">
              {safeSessions.length}
            </span>
            <ChevronDown className={`w-3 h-3 text-purple-400/70 transition-transform ${chronicleOpen ? 'rotate-180' : ''}`} />
          </button>

          {chronicleOpen && (
            <>
              {/* MOBILE BOTTOM SHEET / MODAL (< md) */}
              <div className="md:hidden fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
                <div className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-[#070a16] border border-purple-500/40 shadow-2xl p-4 flex flex-col space-y-3 ring-1 ring-purple-500/30">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono font-bold uppercase text-purple-200 tracking-wider">
                        Saved Chronicles ({safeSessions.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setChronicleOpen(false);
                          onOpenWorldForge();
                        }}
                        className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-700/50 font-bold active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New RP</span>
                      </button>
                      <button
                        onClick={() => setChronicleOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 border border-white/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of Chronicles in Mobile Sheet */}
                  <div className="overflow-y-auto max-h-[60vh] space-y-2 pr-0.5">
                    {safeSessions.length === 0 && (
                      <p className="text-center text-xs text-slate-400 font-mono py-8 leading-relaxed">
                        No saved chronicles yet. Tap <b>+ New RP</b> to begin an adventure!
                      </p>
                    )}
                    {safeSessions.map((s) => {
                      const isSelected = s._id === currentSessionId;
                      return (
                        <div
                          key={s._id}
                          className={`flex items-center justify-between p-3 rounded-2xl text-xs cursor-pointer border transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg shadow-purple-950/80 ring-1 ring-purple-400/50'
                              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-white/10'
                          }`}
                          onClick={() => {
                            onSelectSession(s._id);
                            setChronicleOpen(false);
                          }}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-100 truncate">{s.title}</span>
                              {isSelected && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600/50">
                                  Current RP
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-300/80 font-mono truncate mt-0.5">
                              {s.universe || 'Anime Realm'} &bull; {s.messages?.length || 0} messages &bull;{' '}
                              {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete chronicle "${s.title}" and all its data?`)) {
                                onDeleteSession(s._id);
                              }
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-all shrink-0 active:scale-95"
                            title="Delete Chronicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DESKTOP DROPDOWN (>= md) */}
              <div className="hidden md:block absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#070a16] border border-purple-500/40 shadow-2xl shadow-black p-3 z-50 animate-fade-in ring-1 ring-purple-500/20">
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
                    <span>New RP</span>
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
            </>
          )}
        </div>
      </div>

      {/* RIGHT: OC Persona + API Keys & Settings buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {currentSessionId && (
          <button
            onClick={onToggleLeftPanel}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-[10px] sm:text-[11px] font-bold text-purple-200 transition-all shadow-sm active:scale-95"
            title="Open World, NPCs & Timeline Matrix"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>World</span>
            {activeNpcCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-900 text-purple-300 border border-purple-700/50 text-[9px] font-mono font-bold leading-none">
                {activeNpcCount}
              </span>
            )}
          </button>
        )}

        {/* Ambient Soundscapes Controller (Mutable BGM) */}
        <AudioController currentSceneContext={currentSceneContext} />

        {/* Protagonist Persona / OC Button */}
        <button
          onClick={onOpenPersonaModal}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 group cursor-pointer active:scale-95"
          title="Protagonist Persona & OC Moveset Lorebook Hub"
        >
          <User className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-display uppercase tracking-wider text-[11px] font-bold text-cyan-300">
            <span className="sm:hidden">OC</span>
            <span className="hidden sm:inline">Persona</span>
          </span>
        </button>

        {/* API Keys & Settings Button with Live Key Status Dot */}
        <button
          onClick={onToggleRightDrawer}
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full font-semibold text-xs tracking-wider transition-all shadow-md group active:scale-95 ${
            isRightDrawerOpen
              ? 'bg-purple-600/90 text-white border border-purple-400 shadow-purple-900/60'
              : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 hover:border-purple-400'
          }`}
          title="API Keys, Models, Samplers & Engine Settings"
        >
          <Settings className={`w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition-transform duration-300 ${isRightDrawerOpen ? 'rotate-45 text-white' : ''}`} />
          <span className="font-display uppercase tracking-wider text-[11px] font-bold text-purple-300">
            <span className="sm:hidden">Keys</span>
            <span className="hidden sm:inline">Settings</span>
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              hasKey ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
            title={hasKey ? 'API Key Connected' : 'API Key Missing - Click to connect'}
          />
        </button>
      </div>
    </header>
  );
}
