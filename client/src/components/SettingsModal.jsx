import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cpu,
  Key,
  Trash2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import {
  getStoredSummaryConfig,
  saveStoredSummaryConfig,
  detectProviderFromApiKey,
  saveByokToMongoDB,
} from '../utils/storage.js';

export default function SettingsModal({ isOpen, onClose, onClearAllData }) {
  const [summaryConfig, setSummaryConfig] = useState(getStoredSummaryConfig());
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    saveStoredSummaryConfig(summaryConfig);
    setSavedToast(true);
    await saveByokToMongoDB({ summaryConfig });
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-text">
      <div className="w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl glass-panel-elevated bg-[#0a0d20]/98 sm:bg-[#0a0d20]/95 border-0 sm:border border-purple-500/30 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto pt-safe pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Settings className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display tracking-wider">
                RE-BIRTH ENGINE SETTINGS
              </h2>
              <p className="text-xs text-purple-300/70 font-mono">
                Local Database, Memory Compaction Models & Storage Controls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Local Database Engine Status */}
        <div className="space-y-2.5 rounded-xl p-4 bg-slate-900/70 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 font-mono uppercase">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Local Database Engine</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active (Local Offline)
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Running on your machine's native high-performance MongoDB engine. All chronicles, world states, character lorebooks, and avatars are stored permanently on your disk (<code className="text-emerald-300 font-mono bg-emerald-950/40 px-1 py-0.5 rounded">data/db</code>) with zero latency, zero cloud dependency, and 100% offline privacy.
          </p>
        </div>

        {/* 2. Dedicated AI Model for Summarization & Memory */}
        <div className="space-y-3 rounded-xl p-4 bg-slate-900/70 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200 font-mono uppercase">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Dedicated AI Summarizer / Compaction Model</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-mono">
              Recommended Best Practice
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Using a dedicated lightweight, high-speed model (like <i>GPT-4o-mini</i>, <i>Claude 3 Haiku</i>, or <i>Gemini 1.5 Flash</i>) for rolling summaries saves token costs while keeping your main flagship roleplay model focused on prose.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-xs sm:text-[11px] font-mono text-slate-300 block mb-1">Summarizer Provider</label>
              <select
                value={summaryConfig.provider}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, provider: e.target.value })}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="groq">Groq (llama-3.1-8b-instant - Fast & Free)</option>
                <option value="mistral">Mistral AI (mistral-small-latest)</option>
                <option value="openai">OpenAI (gpt-4o-mini)</option>
                <option value="openrouter">OpenRouter (Unified)</option>
                <option value="anthropic">Anthropic (claude-3-haiku)</option>
                <option value="gemini">Google Gemini (gemini-1.5-flash)</option>
              </select>
            </div>

            <div>
              <label className="text-xs sm:text-[11px] font-mono text-slate-300 block mb-1">Target Model Identifier</label>
              <input
                type="text"
                value={summaryConfig.model}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, model: e.target.value })}
                placeholder="gpt-4o-mini / llama-3.1-8b-instant"
                className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs sm:text-[11px] font-mono text-slate-300 block mb-1">
              Dedicated Summarizer API Key (Leave blank to use main roleplay key)
            </label>
            <input
              type="password"
              value={summaryConfig.apiKey}
              onChange={(e) => {
                const val = e.target.value;
                const detected = detectProviderFromApiKey(val);
                setSummaryConfig({
                  ...summaryConfig,
                  apiKey: val,
                  ...(detected ? { provider: detected } : {}),
                });
              }}
              placeholder="sk-... (Stored securely in local storage & synced to cloud)"
              className="w-full bg-slate-950 border border-purple-500/30 rounded-lg px-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 font-mono text-[11px]">Compaction Trigger Interval:</span>
            <span className="font-semibold text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
              Every 10 Turns
            </span>
          </div>
        </div>

        {/* 3. Roleplay Wiping / Delete All */}
        <div className="space-y-2 rounded-xl p-4 bg-rose-950/20 border border-rose-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 font-mono uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Danger Zone / Purge Roleplay Cache</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Completely purge all chronicles, world states, and cached character avatars from your MongoDB database.
          </p>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to completely purge all roleplays and world states from MongoDB?')) {
                onClearAllData();
                onClose();
              }
            }}
            className="px-3.5 py-2.5 sm:py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors touch-manipulation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Roleplay Data</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-500/20">
          <button
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 rounded-xl text-xs text-slate-400 hover:text-white touch-manipulation"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/40 touch-manipulation"
          >
            {savedToast ? <Check className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{savedToast ? 'Settings Saved!' : 'Save Engine Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
