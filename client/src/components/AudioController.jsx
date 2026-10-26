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
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine.js';

const MOOD_PRESETS = [
  { id: 'auto', label: 'Auto (Scene Adaptive)', icon: Sparkles },
  { id: 'peaceful', label: 'Peaceful Plains', icon: Compass },
  { id: 'mystic', label: 'Mystic Mana Shrine', icon: Sparkles },
  { id: 'campfire', label: 'Campfire & Hearth', icon: Flame },
  { id: 'rain', label: 'Rain & Tempest', icon: CloudRain },
  { id: 'dungeon', label: 'Abyss & Caverns', icon: Sliders },
  { id: 'combat', label: 'Combat Pulse', icon: ShieldAlert },
];

export default function AudioController({ currentSceneContext }) {
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted);
  const [volume, setVolume] = useState(audioEngine.volume);
  const [currentMood, setCurrentMood] = useState(audioEngine.currentMood);
  const [selectedPreset, setSelectedPreset] = useState('auto');
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

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

  // Scene-adaptive auto mood detection
  useEffect(() => {
    if (selectedPreset === 'auto' && currentSceneContext) {
      const detected = audioEngine.detectMoodFromContext(currentSceneContext);
      if (detected !== currentMood) {
        setCurrentMood(detected);
        if (!isMuted) {
          audioEngine.playMood(detected);
        }
      }
    }
  }, [currentSceneContext, selectedPreset, isMuted]);

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

  const activePresetObj = MOOD_PRESETS.find((p) => p.id === (selectedPreset === 'auto' ? currentMood : selectedPreset)) || MOOD_PRESETS[0];
  const Icon = activePresetObj.icon;

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
          title={isMuted ? 'Unmute Ambient Soundscapes' : 'Mute Ambient Soundscapes'}
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
          className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Ambient Soundscape & BGM Controls"
        >
          <span className="max-w-[75px] truncate font-sans font-semibold hidden xs:inline">
            {isMuted ? 'Muted' : activePresetObj.label.split(' ')[0]}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-slate-950/95 border border-purple-500/30 shadow-2xl backdrop-blur-xl p-4 space-y-4 z-50 animate-fade-in text-xs font-sans">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-400" />
              <span className="font-bold font-mono uppercase tracking-wider text-purple-200 text-xs">
                Ambient Soundscapes
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleMute}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
              }`}
            >
              {isMuted ? 'Muted' : 'Sound Active'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>Master Volume</span>
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

          {/* Soundscape Mood Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
              Atmospheric Soundscape Mood:
            </span>
            <div className="grid grid-cols-1 gap-1">
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

          <p className="text-[10px] text-slate-500 font-mono leading-tight pt-1 border-t border-white/[0.05]">
            100% Procedural synthesis via Web Audio API. Adapts automatically to your roleplay scenes.
          </p>
        </div>
      )}
    </div>
  );
}
