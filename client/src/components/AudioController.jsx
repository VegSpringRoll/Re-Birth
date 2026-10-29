import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Flame,
  CloudRain,
  ShieldAlert,
  Compass,
  Sliders,
  ChevronDown,
  SkipForward,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine.js';

const MOOD_PRESETS = [
  { id: 'auto', label: 'Auto (Scene Adaptive)', icon: Sparkles, query: 'Cinematic' },
  { id: 'combat', label: 'Combat & Battle', icon: ShieldAlert, query: 'Action' },
  { id: 'peaceful', label: 'Peaceful & Chill', icon: Compass, query: 'Lofi' },
  { id: 'mystic', label: 'Mystic & Fantasy', icon: Sparkles, query: 'Fantasy' },
  { id: 'dungeon', label: 'Abyss & Dungeon', icon: Sliders, query: 'Dark' },
  { id: 'rain', label: 'Rain & Melancholy', icon: CloudRain, query: 'Melancholy' },
  { id: 'campfire', label: 'Campfire & Acoustic', icon: Flame, query: 'Acoustic' },
];

export default function AudioController({ currentSceneContext }) {
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted);
  const [volume, setVolume] = useState(audioEngine.volume);
  const [currentMood, setCurrentMood] = useState(audioEngine.currentMood);
  const [currentTrack, setCurrentTrack] = useState(audioEngine.currentTrack);
  const [aiMoodDescription, setAiMoodDescription] = useState(audioEngine.aiSceneMood);
  const [selectedPreset, setSelectedPreset] = useState('auto');
  const [isLoading, setIsLoading] = useState(audioEngine.isLoading);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Subscribe to live track changes from AudioEngine
  useEffect(() => {
    const unsub = audioEngine.onTrackChange((track, state) => {
      if (track) setCurrentTrack(track);
      if (state) {
        setIsMuted(state.isMuted);
        setVolume(state.volume);
        setCurrentMood(state.mood);
        if (state.aiSceneMood) setAiMoodDescription(state.aiSceneMood);
        setIsLoading(state.isLoading);
      }
    });
    return unsub;
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scene-adaptive auto mood detection driven by AI Director
  useEffect(() => {
    if (selectedPreset === 'auto' && currentSceneContext) {
      const { mood, query, description, fromAI } = audioEngine.detectMoodFromContext(currentSceneContext);
      if (description) {
        setAiMoodDescription(description);
      }
      const isNewMood = mood !== currentMood || (query && query !== audioEngine.currentQuery);
      if (isNewMood) {
        setCurrentMood(mood);
        if (!isMuted) {
          audioEngine.playMood(mood, false, query, description);
        }
      }
    }
  }, [currentSceneContext, selectedPreset, isMuted, currentMood]);

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const newMuted = audioEngine.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      const moodToPlay = selectedPreset === 'auto' ? currentMood : selectedPreset;
      audioEngine.playMood(moodToPlay, true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audioEngine.setVolume(newVol);
    if (isMuted && newVol > 0) {
      audioEngine.setMuted(false);
      setIsMuted(false);
    }
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    let moodToPlay = presetId;
    if (presetId === 'auto') {
      moodToPlay = currentSceneContext ? audioEngine.detectMoodFromContext(currentSceneContext) : 'peaceful';
    }
    setCurrentMood(moodToPlay);
    if (!isMuted) {
      audioEngine.playMood(moodToPlay, true);
    }
  };

  const handleSkipTrack = () => {
    audioEngine.nextTrack();
  };

  const activePresetObj =
    MOOD_PRESETS.find((p) => p.id === (selectedPreset === 'auto' ? currentMood : selectedPreset)) ||
    MOOD_PRESETS[0];

  return (
    <div className="relative" ref={popoverRef}>
      {/* Pill Toggle Button */}
      <div className="flex items-center rounded-full bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.08] hover:border-purple-500/30 p-0.5 shadow-md transition-all text-xs font-mono">
        <button
          type="button"
          onClick={handleToggleMute}
          className={`p-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
            isMuted
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-purple-300 hover:text-white bg-purple-950/60 shadow-sm'
          }`}
          title={isMuted ? 'Unmute BGM (FreeToUse API)' : 'Mute BGM (FreeToUse API)'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Scene BGM & FreeToUse Audio Settings"
        >
          <span className="max-w-[85px] truncate font-sans font-semibold hidden xs:inline">
            {isMuted ? 'BGM Off' : currentTrack?.title || activePresetObj.label.split(' ')[0]}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#090d21]/95 border border-purple-500/30 shadow-2xl backdrop-blur-2xl p-4 space-y-3.5 z-50 animate-fade-in text-xs font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="font-bold font-mono uppercase tracking-wider text-purple-200 text-xs">
                Scene BGM Radio
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border transition-colors cursor-pointer font-semibold ${
                isMuted
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
              }`}
            >
              {isMuted ? 'Muted' : 'Playing'}
            </button>
          </div>

          {/* AI Director Scene Mood Badge */}
          {aiMoodDescription && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-[10.5px] font-mono shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <div className="truncate min-w-0">
                <span className="text-cyan-400/80">AI Scene Vibe: </span>
                <span className="font-bold text-white uppercase tracking-wider">{aiMoodDescription}</span>
              </div>
            </div>
          )}

          {/* Now Playing FreeToUse Card */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/25 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {currentTrack?.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-lg object-cover border border-purple-400/30 shadow-md shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-purple-300" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate font-display">
                  {currentTrack?.title || (isLoading ? 'Tuning FreeToUse Radio...' : 'No Track Loaded')}
                </p>
                <p className="text-[10px] text-purple-300/80 truncate font-mono">
                  {currentTrack?.artist || 'FreeToUse Studio'} • {activePresetObj.query}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkipTrack}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white transition-all disabled:opacity-40 shrink-0 shadow-sm active:scale-95 cursor-pointer"
              title="Skip to next FreeToUse track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>BGM Volume</span>
              <span className="text-purple-300 font-bold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Scene Mood Selectors */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                Scene Audio Context:
              </span>
              <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/30">
                {selectedPreset === 'auto' ? `Auto: ${currentMood}` : selectedPreset}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-0.5">
              {MOOD_PRESETS.map((p) => {
                const ItemIcon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{p.label}</span>
                    </div>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attribution Footer */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Library: Free To Use</span>
            <a
              href="https://freetouse.com"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>freetouse.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
