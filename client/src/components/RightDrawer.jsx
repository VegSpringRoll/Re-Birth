import React, { useState, useEffect, useRef } from 'react';
import {
  Key,
  Sliders,
  Sparkles,
  User,
  Sword,
  Save,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Flame,
  ShieldAlert,
  Cpu,
  Loader2,
  AlertCircle,
  Search,
  Zap,
  CheckCircle2,
  Lock,
  FileCode,
  Edit3,
  RotateCcw,
  Trash2,
  Code,
  BookOpen,
  Layers,
  Plus
} from 'lucide-react';
import {
  getStoredApiKeys,
  saveStoredApiKeys,
  getActiveProvider,
  saveActiveProvider,
  getStoredModels,
  saveStoredModels,
  getStoredSamplers,
  saveStoredSamplers,
  getStoredSummaryConfig,
  saveStoredSummaryConfig,
  getStoredApiProfiles,
  saveStoredApiProfiles,
  getActiveApiProfileId,
  saveActiveApiProfileId,
  getStoredCustomProxyUrl,
  saveStoredCustomProxyUrl,
  saveByokToMongoDB,
  syncByokWithMongoDB,
} from '../utils/storage.js';
import { getActivePersona, createOrUpdatePersona } from '../utils/personaStorage.js';
import { getGoldStandardTemplate } from './WorldForgeModal.jsx';

export const IMMUTABLE_DIRECTOR_PROTOCOL = `=== [DIRECTOR CORE ENGINE - MANDATORY BACKEND PROTOCOL] ===
You are the Master Storyteller, Game Director, and Simulation Engine for this text roleplay.
1. Narrative Architecture: Maintain cinematic third-person prose, evocative pacing, sensory world details, and fluid dialogue exchanges.
2. Participant Agency: {{user}} is a sovereign participant. NEVER decide, control, dictate, or speak for {{user}}'s actions, feelings, thoughts, or dialogue. The world moves independently of {{user}}.
3. Canon Logic: Adhere strictly to the chosen universe's tone, power scaling, magic/combat mechanics, and social hierarchy.
4. Output Schema: You must strictly structure all responses using <narration>, <say speaker="...">, and terminal <state_update> tags.`;

export default function RightDrawer({
  isOpen,
  onClose,
  session,
  onSaveSessionSettings,
  onInjectMove,
  onOpenPersonaModal,
  onKeysSaved,
}) {
  const [activeTab, setActiveTab] = useState('byok'); // 'byok' | 'samplers' | 'director' | 'profile' | 'moveset'
  
  // BYOK state
  const [apiKeys, setApiKeys] = useState(getStoredApiKeys());
  const [provider, setProvider] = useState(getActiveProvider());
  const [models, setModels] = useState(getStoredModels());
  const [customBaseUrl, setCustomBaseUrl] = useState(getStoredCustomProxyUrl());
  const [showKey, setShowKey] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Dynamic API & Model Profiles Manager state
  const [apiProfiles, setApiProfiles] = useState(getStoredApiProfiles());
  const [activeProfileId, setActiveProfileId] = useState(getActiveApiProfileId());
  const [profileNameInput, setProfileNameInput] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileToast, setProfileToast] = useState('');

  const handleSelectProfile = (profileId) => {
    if (!profileId) {
      setActiveProfileId('');
      saveActiveApiProfileId('');
      return;
    }
    const prof = apiProfiles.find((p) => p.id === profileId);
    if (prof) {
      setActiveProfileId(prof.id);
      saveActiveApiProfileId(prof.id);
      setProvider(prof.provider);
      const updatedKeys = { ...apiKeys, [prof.provider]: prof.apiKey || '' };
      const updatedModels = { ...models, [prof.provider]: prof.model || '' };
      setApiKeys(updatedKeys);
      setModels(updatedModels);
      if (prof.customBaseUrl) {
        setCustomBaseUrl(prof.customBaseUrl);
        saveStoredCustomProxyUrl(prof.customBaseUrl);
      }
      saveActiveProvider(prof.provider);
      saveStoredApiKeys(updatedKeys);
      saveStoredModels(updatedModels);
      onKeysSaved?.();
      setProfileToast(`Activated Profile: ${prof.name}`);
      setTimeout(() => setProfileToast(''), 2500);
    }
  };

  const handleSaveCurrentAsProfile = () => {
    const cleanName = profileNameInput.trim() || `${provider.toUpperCase()} - ${models[provider] || 'Preset'}`;
    const newProfile = {
      id: `profile_${Date.now()}`,
      name: cleanName,
      provider,
      model: models[provider] || '',
      apiKey: apiKeys[provider] || '',
      customBaseUrl: provider === 'custom' ? customBaseUrl : undefined,
    };
    const updated = [...apiProfiles, newProfile];
    setApiProfiles(updated);
    saveStoredApiProfiles(updated);
    setActiveProfileId(newProfile.id);
    saveActiveApiProfileId(newProfile.id);
    setProfileNameInput('');
    setIsCreatingProfile(false);
    setProfileToast(`Saved Profile: "${cleanName}"`);
    setTimeout(() => setProfileToast(''), 2500);
  };

  const handleUpdateActiveProfile = () => {
    if (!activeProfileId) return;
    const updated = apiProfiles.map((p) => {
      if (p.id === activeProfileId) {
        return {
          ...p,
          provider,
          model: models[provider] || '',
          apiKey: apiKeys[provider] || '',
          customBaseUrl: provider === 'custom' ? customBaseUrl : undefined,
        };
      }
      return p;
    });
    setApiProfiles(updated);
    saveStoredApiProfiles(updated);
    setProfileToast('Active Profile updated with current settings!');
    setTimeout(() => setProfileToast(''), 2500);
  };

  const handleDeleteProfile = (profileIdToDelete) => {
    const updated = apiProfiles.filter((p) => p.id !== profileIdToDelete);
    setApiProfiles(updated);
    saveStoredApiProfiles(updated);
    if (activeProfileId === profileIdToDelete) {
      setActiveProfileId('');
      saveActiveApiProfileId('');
    }
    setProfileToast('Profile deleted');
    setTimeout(() => setProfileToast(''), 2000);
  };

  // Model auto-detection state
  const [availableModels, setAvailableModels] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);
  const [detectError, setDetectError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCustomModel, setManualCustomModel] = useState(false);

  // Model connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Sampler state
  const [samplers, setSamplers] = useState(getStoredSamplers());

  // Dedicated AI Summarizer configuration state
  const [summaryConfig, setSummaryConfig] = useState(getStoredSummaryConfig());
  const [usePrimarySummaryKey, setUsePrimarySummaryKey] = useState(true);
  const [showSummaryKey, setShowSummaryKey] = useState(false);
  const [summaryCustomBaseUrl, setSummaryCustomBaseUrl] = useState(summaryConfig?.customBaseUrl || 'http://localhost:11434/v1');
  const [summaryAvailableModels, setSummaryAvailableModels] = useState([]);
  const [isDetectingSummary, setIsDetectingSummary] = useState(false);
  const [detectedSummarySuccess, setDetectedSummarySuccess] = useState(false);
  const [detectSummaryError, setDetectSummaryError] = useState('');
  const [summarySearchQuery, setSummarySearchQuery] = useState('');
  const [manualSummaryCustomModel, setManualSummaryCustomModel] = useState(false);
  const [isTestingSummary, setIsTestingSummary] = useState(false);
  const [summaryTestResult, setSummaryTestResult] = useState(null);
  const [summarySavedToast, setSummarySavedToast] = useState(false);

  const filteredSummaryModels = summaryAvailableModels.filter((m) => {
    if (!summarySearchQuery) return true;
    const q = summarySearchQuery.toLowerCase();
    return (m.id && m.id.toLowerCase().includes(q)) || (m.name && m.name.toLowerCase().includes(q));
  });

  const fetchSummaryModels = async (targetProvider, targetKey, targetCustomUrl) => {
    setIsDetectingSummary(true);
    setDetectSummaryError('');

    try {
      const res = await fetch('/api/models/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: targetKey || '',
          customBaseUrl: targetCustomUrl || summaryCustomBaseUrl || 'http://localhost:11434/v1',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDetectSummaryError(data.message || `Failed to detect models (${res.status})`);
        setDetectedSummarySuccess(false);
        if (Array.isArray(data.fallbackModels)) {
          setSummaryAvailableModels(data.fallbackModels);
        }
      } else {
        if (Array.isArray(data.models)) {
          setSummaryAvailableModels(data.models);
          setDetectedSummarySuccess(Boolean(data.detected));

          // If current summarizer has no model selected, default to the first detected model
          if (!summaryConfig.model && data.models.length > 0) {
            setSummaryConfig((prev) => ({
              ...prev,
              model: data.models[0].id,
            }));
          }
        }
      }
    } catch (err) {
      setDetectSummaryError(err.message || 'Network error fetching models');
      setDetectedSummarySuccess(false);
    } finally {
      setIsDetectingSummary(false);
    }
  };

  const handleTestSummaryConnection = async () => {
    setIsTestingSummary(true);
    setSummaryTestResult(null);

    const targetProvider = summaryConfig.provider || 'openai';
    const targetKey = usePrimarySummaryKey ? (apiKeys[targetProvider] || '') : (summaryConfig.apiKey || '');
    const targetModel = summaryConfig.model || 'gpt-4o-mini';

    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: targetKey || '',
          model: targetModel || '',
          customBaseUrl: summaryCustomBaseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSummaryTestResult({
          success: true,
          message: 'OK',
          latencyMs: data.latencyMs,
          modelResponse: data.modelResponse,
        });
      } else {
        setSummaryTestResult({
          success: false,
          message: data.message || data.error || 'Connection test failed',
        });
      }
    } catch (err) {
      setSummaryTestResult({
        success: false,
        message: err.message || 'Network connection failed',
      });
    } finally {
      setIsTestingSummary(false);
    }
  };

  // Session context states
  const [systemInstructions, setSystemInstructions] = useState(session?.systemInstructions || '');
  const [userProfile, setUserProfile] = useState(session?.userProfile || { name: '', physique: '', traits: '', details: '' });
  const [movesetKnowledge, setMovesetKnowledge] = useState(session?.movesetKnowledge || '');
  const [contextSavedToast, setContextSavedToast] = useState(false);


  const fetchModels = async (targetProvider, targetKey) => {
    setIsDetecting(true);
    setDetectError('');

    try {
      const res = await fetch('/api/models/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: targetProvider,
          apiKey: targetKey || '',
          customBaseUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDetectError(data.message || `Failed to detect models (${res.status})`);
        setDetectedSuccess(false);
        if (Array.isArray(data.fallbackModels)) {
          setAvailableModels(data.fallbackModels);
        }
      } else {
        if (Array.isArray(data.models)) {
          setAvailableModels(data.models);
          setDetectedSuccess(Boolean(data.detected));

          // If current provider has no model selected, default to the first detected model
          if (!models[targetProvider] && data.models.length > 0) {
            setModels((prev) => ({
              ...prev,
              [targetProvider]: data.models[0].id,
            }));
          }
        }
      }
    } catch (err) {
      setDetectError(err.message || 'Network error fetching models');
      setDetectedSuccess(false);
    } finally {
      setIsDetecting(false);
    }
  };

  // Debounced auto-fetch when provider or key changes
  useEffect(() => {
    if (!isOpen) return;
    const currentKey = apiKeys[provider];
    const timer = setTimeout(() => {
      fetchModels(provider, currentKey);
    }, 450);
    return () => clearTimeout(timer);
  }, [provider, apiKeys[provider], isOpen]);

  // Debounced auto-fetch for Summarizer models
  useEffect(() => {
    if (!isOpen) return;
    const targetProvider = summaryConfig.provider || 'openai';
    const effectiveKey = usePrimarySummaryKey ? (apiKeys[targetProvider] || '') : (summaryConfig.apiKey || '');
    const timer = setTimeout(() => {
      fetchSummaryModels(targetProvider, effectiveKey, summaryCustomBaseUrl);
    }, 450);
    return () => clearTimeout(timer);
  }, [summaryConfig.provider, summaryConfig.apiKey, usePrimarySummaryKey, apiKeys, summaryCustomBaseUrl, isOpen]);

  useEffect(() => {
    if (session) {
      setSystemInstructions(session.systemInstructions || '');
      setUserProfile(session.userProfile || { name: '', physique: '', traits: '', details: '' });
      setMovesetKnowledge(session.movesetKnowledge || '');
    }
  }, [session]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const currentKey = apiKeys[provider];
    const currentModel = models[provider];

    try {
      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: currentKey || '',
          model: currentModel || '',
          customBaseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'OK',
          latencyMs: data.latencyMs,
          modelResponse: data.modelResponse,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Connection test failed',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Network connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveKeys = async () => {
    saveStoredApiKeys(apiKeys);
    saveActiveProvider(provider);
    saveStoredModels(models);
    saveStoredCustomProxyUrl(customBaseUrl);
    setKeySavedToast(true);
    onKeysSaved?.();
    // Persist to MongoDB Cloud for cross-device sync on mobile
    await saveByokToMongoDB({
      apiKeys,
      activeProvider: provider,
      models,
      customProxyUrl: customBaseUrl,
      apiProfiles,
      activeProfileId,
    });
    setTimeout(() => setKeySavedToast(false), 2000);
  };

  const handleSaveSamplers = (newSamplers) => {
    setSamplers(newSamplers);
    saveStoredSamplers(newSamplers);
  };

  const handleSaveContext = () => {
    onSaveSessionSettings({
      systemInstructions,
      userProfile,
      movesetKnowledge,
    });

    // Also persist permanently to active persona in localStorage
    try {
      const activeP = getActivePersona();
      if (activeP) {
        createOrUpdatePersona({
          id: activeP.id,
          name: userProfile?.name || activeP.name,
          physique: userProfile?.physique || activeP.physique,
          traits: userProfile?.traits || activeP.traits,
          details: userProfile?.details || activeP.details,
          movesetKnowledge: movesetKnowledge || activeP.movesetKnowledge,
        });
      }
    } catch (e) {}

    setContextSavedToast(true);
    setTimeout(() => setContextSavedToast(false), 2000);
  };

  const filteredModels = availableModels.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.id && m.id.toLowerCase().includes(q)) ||
      (m.name && m.name.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for outside click and mobile immersion */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-slate-950/95 border-l border-white/10 flex flex-col shadow-2xl shadow-black/80 animate-fade-in select-text backdrop-blur-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-slate-900/60 flex items-center justify-between shrink-0 pt-safe">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-100 font-display">
                Engine Settings
              </h2>
              <p className="text-[11px] text-purple-300/70 font-mono">Samplers, Summarizer & Context</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pill Tabs (Spacious & Non-overlapping) */}
        <div className="flex border-b border-white/[0.08] bg-slate-900/90 overflow-x-auto no-scrollbar px-3 py-2.5 gap-2 shrink-0">
          {[
            { id: 'byok', label: 'BYOK & Model', icon: Key },
            { id: 'samplers', label: 'Samplers', icon: Sliders },
            { id: 'summary', label: 'AI Summarizer', icon: BookOpen },
            { id: 'director', label: 'Director & Rules', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-400/50 shadow-md shadow-purple-900/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] border-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28 pb-safe">
        {/* TAB 1: BYOK MANAGER */}
        {activeTab === 'byok' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 leading-relaxed shadow-sm flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-purple-300">Cross-Device Cloud Sync Active:</span> API keys &amp; custom profiles are stored in your browser and automatically synchronized with your MongoDB database so they appear instantly on both mobile and laptop!
              </div>
            </div>

            {/* SAVED API & MODEL PROFILES (DYNAMIC SELECTOR) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/20 to-slate-900/90 border border-cyan-500/30 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold text-cyan-300 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Saved API &amp; Model Profiles ({apiProfiles.length})</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/settings/clean-dummy', { method: 'POST' });
                        const data = await res.json();
                        if (data.apiProfiles) {
                          setApiProfiles(data.apiProfiles);
                          saveStoredApiProfiles(data.apiProfiles);
                          setProfileToast('Purged dummy profiles');
                          setTimeout(() => setProfileToast(''), 2500);
                        }
                      } catch (e) {}
                    }}
                    className="text-[10px] font-mono text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900 px-2 py-1 rounded-xl border border-purple-700/50 transition-colors cursor-pointer active:scale-95"
                    title="Clean unnecessary dummy profiles"
                  >
                    Clean Dummies
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                    className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 px-2.5 py-1 rounded-xl border border-cyan-700/50 transition-colors cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isCreatingProfile ? 'Cancel' : 'Save As Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Profile Selector Dropdown */}
              <div className="space-y-1.5">
                <select
                  value={activeProfileId}
                  onChange={(e) => handleSelectProfile(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400 font-sans"
                >
                  <option value="">
                    {apiProfiles.length === 0 ? '-- No saved profiles yet (Click "+ Save As Profile") --' : '-- Select Saved Profile / Switch Model --'}
                  </option>
                  {apiProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.provider.toUpperCase()} &bull; {p.model || 'Default'})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>Switch provider, API key &amp; model instantly across devices.</span>
                  {activeProfileId && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleUpdateActiveProfile}
                        className="text-purple-300 hover:text-white underline cursor-pointer"
                        title="Update profile with current key & model"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(activeProfileId)}
                        className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        title="Delete selected profile"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Save New Profile Drawer */}
              {isCreatingProfile && (
                <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2 animate-fade-in">
                  <label className="text-[10px] font-mono uppercase text-slate-300 block">
                    Profile Custom Name
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`e.g. My ${provider.toUpperCase()} Claude Key`}
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsProfile}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              )}

              {profileToast && (
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{profileToast}</span>
                </div>
              )}
            </div>

            {/* Provider Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-2 shadow-md">
              <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider block">
                Active Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="groq">Groq (Ultra-Fast Llama 3.3 &amp; DeepSeek R1)</option>
                <option value="mistral">Mistral AI (Mistral Large &amp; NeMo)</option>
                <option value="openrouter">OpenRouter (Unified API)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Pro)</option>
                <option value="custom">Custom OpenAI-Compatible Proxy (Ollama, LM Studio, vLLM…)</option>
              </select>
            </div>

            {/* Custom OpenAI-Compatible Proxy Configuration Card */}
            {provider === 'custom' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-md animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cyan-300 uppercase font-mono tracking-wider block">
                    Custom Proxy Base URL (/v1)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    OpenAI Compatible
                  </span>
                </div>

                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="e.g. http://localhost:11434/v1"
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-cyan-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Ollama', url: 'http://localhost:11434/v1' },
                      { label: 'LM Studio', url: 'http://localhost:1234/v1' },
                      { label: 'KoboldCpp', url: 'http://localhost:5001/v1' },
                      { label: 'vLLM Local', url: 'http://localhost:8000/v1' },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => {
                          setCustomBaseUrl(pre.url);
                          fetchModels('custom', apiKeys.custom);
                        }}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                          customBaseUrl === pre.url
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:border-cyan-500/30'
                        }`}
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Key Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-2 shadow-md">
              <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider block">
                {provider === 'custom' ? 'API Key (Optional for Local LLMs)' : `${provider.toUpperCase()} API Key`}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={
                    provider === 'custom'
                      ? 'Leave empty or enter bearer token (sk-...)...'
                      : `Enter ${provider} key (sk-...)...`
                  }
                  value={apiKeys[provider] || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl pl-3.5 pr-11 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Auto-detected Model Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Roleplay Model</span>
                  {isDetecting && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-normal">
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                    </span>
                  )}
                  {!isDetecting && detectedSuccess && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ● Detected ({availableModels.length})
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualCustomModel(!manualCustomModel)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono underline"
                  >
                    {manualCustomModel ? 'Choose from List' : 'Custom Model ID'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchModels(provider, apiKeys[provider])}
                    disabled={isDetecting}
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
                    title="Refresh / Auto-detect models from API"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {detectError && (
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug text-[11px]">{detectError}</span>
                </div>
              )}

              {manualCustomModel ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="e.g. anthropic/claude-3.5-sonnet, gpt-4o, etc."
                    value={models[provider] || ''}
                    onChange={(e) => setModels({ ...models, [provider]: e.target.value })}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    Custom model identifier will be sent directly to the {provider} API endpoint.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableModels.length > 12 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search / filter models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  )}

                  <select
                    value={models[provider] || ''}
                    onChange={(e) => setModels({ ...models, [provider]: e.target.value })}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                  >
                    {!models[provider] && (
                      <option value="">-- Choose AI Roleplay Model --</option>
                    )}
                    {filteredModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name !== m.id ? `${m.name} [${m.id}]` : m.id}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                    <span className="truncate max-w-[260px]">
                      Selected: <span className="text-cyan-300 font-semibold">{models[provider] || 'None'}</span>
                    </span>
                    <span>{filteredModels.length} models</span>
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !apiKeys[provider]?.trim()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Testing Connection with Server...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test AI Connection</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
                    testResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono uppercase tracking-wider text-[11px]">
                        {testResult.success ? 'Response: OK' : 'Connection Failed'}
                      </span>
                      {testResult.latencyMs && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          ({testResult.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 truncate mt-0.5">
                      {testResult.success
                        ? `AI is active & responding properly to prompt turns!`
                        : testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveKeys}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40"
              >
                {keySavedToast ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                {keySavedToast ? 'Keys Saved to LocalStorage!' : 'Save Keys to LocalStorage'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SAMPLER CONTROLS */}
        {activeTab === 'samplers' && (
          <div className="space-y-5 animate-fade-in">
            {/* Temperature Slider */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-purple-300 font-semibold uppercase tracking-wider">Temperature (Creativity)</span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-200 border border-purple-800/40 font-bold">
                  {Number(samplers.temperature).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={samplers.temperature}
                onChange={(e) => handleSaveSamplers({ ...samplers, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 accent-purple-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0.0 (Strict Lore)</span>
                <span>1.0 (Balanced)</span>
                <span>2.0 (Wild Chaos)</span>
              </div>
            </div>

            {/* Top P Slider */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-cyan-300 font-semibold uppercase tracking-wider">Top P (Nucleus Sampling)</span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-200 border border-cyan-800/40 font-bold">
                  {Number(samplers.top_p).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={samplers.top_p}
                onChange={(e) => handleSaveSamplers({ ...samplers, top_p: parseFloat(e.target.value) })}
                className="w-full h-2 accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0.0 (Laser Focus)</span>
                <span>0.95 (Recommended)</span>
                <span>1.0 (Full Vocabulary)</span>
              </div>
            </div>

            {/* Max Output Tokens Slider */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-300 font-semibold uppercase tracking-wider">Max Response Tokens</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-200 border border-emerald-800/40 font-bold">
                  {samplers.max_tokens ?? 1200} tokens
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="4096"
                step="50"
                value={samplers.max_tokens ?? 1200}
                onChange={(e) => handleSaveSamplers({ ...samplers, max_tokens: parseInt(e.target.value, 10) })}
                className="w-full h-2 accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>200 (Brisk)</span>
                <span>1200 (Standard)</span>
                <span>4096 (Novel Prose)</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '500 Fast', val: 500 },
                  { label: '1000 Standard', val: 1000 },
                  { label: '1800 Long', val: 1800 },
                  { label: '3000 Epic', val: 3000 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleSaveSamplers({ ...samplers, max_tokens: p.val })}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                      (samplers.max_tokens ?? 1200) === p.val
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliding Window Context History Slider */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-violet-300 font-semibold uppercase tracking-wider">Player Turns Memory Window</span>
                <span className="px-2.5 py-1 rounded-lg bg-violet-950/80 text-violet-200 border border-violet-800/40 font-bold">
                  Last {samplers.sliding_window ?? 10} Player Turns (~{(samplers.sliding_window ?? 10) * 2} msgs)
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={samplers.sliding_window ?? 10}
                onChange={(e) => handleSaveSamplers({ ...samplers, sliding_window: parseInt(e.target.value, 10) })}
                className="w-full h-2 accent-violet-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>3 Turns (Lean)</span>
                <span>10 Turns (Default)</span>
                <span>25 Turns (Epic Memory)</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '5 Turns (Lean)', val: 5 },
                  { label: '10 Turns (Default)', val: 10 },
                  { label: '15 Turns (Extended)', val: 15 },
                  { label: '20 Turns (Deep Memory)', val: 20 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleSaveSamplers({ ...samplers, sliding_window: p.val })}
                    className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                      (samplers.sliding_window ?? 10) === p.val
                        ? 'bg-violet-950/80 border-violet-500 text-violet-300 shadow-sm'
                        : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 block leading-relaxed">
                Sends your last N player turns <b>and all generated AI responses combined</b> verbatim into prompt context. Older turns beyond this window are preserved in your chat screen and rolling summary, but pruned from prompt context to save tokens and eliminate lag.
              </span>
            </div>

            {/* Frequency / Repetition Penalty */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-300 font-semibold uppercase tracking-wider">Frequency Penalty</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-200 border border-amber-800/40 font-bold">
                  {Number(samplers.frequency_penalty).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.1"
                value={samplers.frequency_penalty}
                onChange={(e) => handleSaveSamplers({ ...samplers, frequency_penalty: parseFloat(e.target.value) })}
                className="w-full h-2 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <span className="text-[11px] text-slate-400 block leading-relaxed">
                Prevents repetitive phrases and dialogue loops across roleplay turns.
              </span>
            </div>

            {/* Safety Threshold Toggle */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <label className="text-xs font-semibold text-rose-300 uppercase font-mono tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Safety Filter Threshold</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {['permissive', 'standard', 'strict'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSaveSamplers({ ...samplers, safety_threshold: lvl })}
                    className={`py-2 px-3 rounded-xl text-xs capitalize font-semibold border transition-all ${
                      samplers.safety_threshold === lvl
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm'
                        : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                handleSaveSamplers({
                  temperature: 0.85,
                  top_p: 0.95,
                  max_tokens: 1200,
                  sliding_window: 10,
                  frequency_penalty: 0.2,
                  repetition_penalty: 1.1,
                  safety_threshold: 'standard',
                })
              }
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors flex items-center justify-center gap-2 border border-white/[0.08] shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Samplers to Defaults
            </button>
          </div>
        )}

        {/* TAB: DEDICATED AI SUMMARIZER CONFIGURATION */}
        {activeTab === 'summary' && (
          <div className="space-y-5 animate-fade-in text-xs">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 flex items-start gap-3 shadow-sm">
              <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-purple-300">Dedicated AI Summarizer &amp; Chronicler:</span> Runs independently from your primary roleplay model to compress narrative turns into permanent chronological chapters every 10 turns without consuming primary model bandwidth.
              </div>
            </div>

            {/* Toggle Enable Dedicated Summarizer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between shadow-md">
              <div className="pr-3">
                <span className="font-semibold text-slate-100 block text-xs tracking-wide">Use Dedicated Summarizer Engine</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">When enabled, periodic memory compaction uses this dedicated configuration.</span>
              </div>
              <input
                type="checkbox"
                checked={summaryConfig.enabled !== false}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, enabled: e.target.checked })}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Summarizer Provider Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-2 shadow-md">
              <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider block">
                Summarizer Provider
              </label>
              <select
                value={summaryConfig.provider || 'openai'}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  setSummaryConfig({ ...summaryConfig, provider: newProvider });
                  const effKey = usePrimarySummaryKey ? (apiKeys[newProvider] || '') : summaryConfig.apiKey;
                  fetchSummaryModels(newProvider, effKey, summaryCustomBaseUrl);
                }}
                className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
              >
                <option value="groq">Groq (Llama 3.1 8B Instant - Free &amp; Ultra-Fast)</option>
                <option value="mistral">Mistral AI (Mistral Small - Cheap &amp; Precise)</option>
                <option value="openai">OpenAI (GPT-4o-mini - Flagship Cost-Efficient)</option>
                <option value="openrouter">OpenRouter (Unified API - 100+ Models)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Haiku - Rapid High Quality)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash / Flash-8B)</option>
                <option value="custom">Custom Proxy (Ollama, LM Studio, KoboldCpp, vLLM…)</option>
              </select>
            </div>

            {/* Custom OpenAI-Compatible Proxy Configuration Card for Summarizer */}
            {summaryConfig.provider === 'custom' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 shadow-md animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-cyan-300 uppercase font-mono tracking-wider block">
                    Summarizer Proxy Base URL (/v1)
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    OpenAI Compatible
                  </span>
                </div>

                <input
                  type="text"
                  value={summaryCustomBaseUrl}
                  onChange={(e) => {
                    setSummaryCustomBaseUrl(e.target.value);
                    setSummaryConfig({ ...summaryConfig, customBaseUrl: e.target.value });
                  }}
                  placeholder="e.g. http://localhost:11434/v1"
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-cyan-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Ollama', url: 'http://localhost:11434/v1' },
                      { label: 'LM Studio', url: 'http://localhost:1234/v1' },
                      { label: 'KoboldCpp', url: 'http://localhost:5001/v1' },
                      { label: 'vLLM Local', url: 'http://localhost:8000/v1' },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => {
                          setSummaryCustomBaseUrl(pre.url);
                          setSummaryConfig((prev) => ({ ...prev, customBaseUrl: pre.url }));
                          const effKey = usePrimarySummaryKey ? (apiKeys.custom || '') : (summaryConfig.apiKey || '');
                          fetchSummaryModels('custom', effKey, pre.url);
                        }}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                          summaryCustomBaseUrl === pre.url
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/[0.08] hover:border-cyan-500/30'
                        }`}
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Summarizer API Key Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                  Summarizer API Key {summaryConfig.provider === 'custom' && <span className="text-slate-400 font-normal normal-case">(Optional for local)</span>}
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-purple-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePrimarySummaryKey}
                    onChange={(e) => setUsePrimarySummaryKey(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Use Primary Key</span>
                </label>
              </div>

              {!usePrimarySummaryKey ? (
                <div className="relative">
                  <input
                    type={showSummaryKey ? 'text' : 'password'}
                    value={summaryConfig.apiKey || ''}
                    onChange={(e) => setSummaryConfig({ ...summaryConfig, apiKey: e.target.value })}
                    placeholder={summaryConfig.provider === 'custom' ? 'Optional for local Ollama / LM Studio...' : `Enter separate ${summaryConfig.provider} key (sk-...)...`}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl pl-3.5 pr-11 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSummaryKey(!showSummaryKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showSummaryKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.06] text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Using key configured in BYOK tab</span>
                  <span className={apiKeys[summaryConfig.provider] ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {apiKeys[summaryConfig.provider] ? '● Key Connected' : (summaryConfig.provider === 'custom' ? '● Local / No Key Needed' : '○ No Key Configured')}
                  </span>
                </div>
              )}
            </div>

            {/* Auto-detected Summarizer Model Card (Identical to BYOK tab!) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Summarizer Model</span>
                  {isDetectingSummary && (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-normal">
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                    </span>
                  )}
                  {!isDetectingSummary && detectedSummarySuccess && (
                    <span className="text-[10px] text-emerald-400 font-mono font-normal">
                      ● Detected ({summaryAvailableModels.length})
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualSummaryCustomModel(!manualSummaryCustomModel)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono underline"
                  >
                    {manualSummaryCustomModel ? 'Choose from List' : 'Custom Model ID'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const effKey = usePrimarySummaryKey ? (apiKeys[summaryConfig.provider] || '') : (summaryConfig.apiKey || '');
                      fetchSummaryModels(summaryConfig.provider, effKey, summaryCustomBaseUrl);
                    }}
                    disabled={isDetectingSummary}
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
                    title="Refresh / Auto-detect models from API"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingSummary ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {detectSummaryError && (
                <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug text-[11px]">{detectSummaryError}</span>
                </div>
              )}

              {manualSummaryCustomModel ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="e.g. gpt-4o-mini, llama-3.1-8b-instant, mistral-small-latest..."
                    value={summaryConfig.model || ''}
                    onChange={(e) => setSummaryConfig({ ...summaryConfig, model: e.target.value })}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block">
                    Custom model identifier will be sent directly to the {summaryConfig.provider} compaction endpoint.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {summaryAvailableModels.length > 10 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search / filter summarizer models..."
                        value={summarySearchQuery}
                        onChange={(e) => setSummarySearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  )}

                  <select
                    value={summaryConfig.model || ''}
                    onChange={(e) => setSummaryConfig({ ...summaryConfig, model: e.target.value })}
                    className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans cursor-pointer"
                  >
                    {!summaryConfig.model && (
                      <option value="">-- Choose AI Summarizer Model --</option>
                    )}
                    {filteredSummaryModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name !== m.id ? `${m.name} [${m.id}]` : m.id}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                    <span className="truncate max-w-[260px]">
                      Selected: <span className="text-cyan-300 font-semibold">{summaryConfig.model || 'None'}</span>
                    </span>
                    <span>{filteredSummaryModels.length} models available</span>
                  </div>
                </div>
              )}

              {/* Recommended Quick Presets */}
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                  Popular Fast &amp; Cheap Summarizer Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'GPT-4o-mini', val: 'gpt-4o-mini', prov: 'openai' },
                    { label: 'Llama 3.1 8B', val: 'llama-3.1-8b-instant', prov: 'groq' },
                    { label: 'Mistral Small', val: 'mistral-small-latest', prov: 'mistral' },
                    { label: 'Claude 3.5 Haiku', val: 'claude-3-5-haiku-20241022', prov: 'anthropic' },
                    { label: 'Gemini 1.5 Flash', val: 'gemini-1.5-flash', prov: 'gemini' },
                    { label: 'OpenRouter Haiku', val: 'anthropic/claude-3.5-haiku', prov: 'openrouter' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setSummaryConfig({
                          ...summaryConfig,
                          provider: p.prov,
                          model: p.val
                        });
                        const effKey = usePrimarySummaryKey ? (apiKeys[p.prov] || '') : (summaryConfig.apiKey || '');
                        fetchSummaryModels(p.prov, effKey, summaryCustomBaseUrl);
                      }}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        summaryConfig.model === p.val
                          ? 'bg-purple-950/90 border-purple-400 text-purple-200 font-bold shadow-sm'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08] hover:border-purple-500/40'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Summarizer Connection Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <button
                type="button"
                onClick={handleTestSummaryConnection}
                disabled={isTestingSummary || (summaryConfig.provider !== 'custom' && !(usePrimarySummaryKey ? apiKeys[summaryConfig.provider] : summaryConfig.apiKey)?.trim())}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-purple-500/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isTestingSummary ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Testing Summarizer Connection...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Summarizer Connection</span>
                  </>
                )}
              </button>

              {summaryTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fade-in ${
                    summaryTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {summaryTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono uppercase tracking-wider text-[11px]">
                        {summaryTestResult.success ? 'Summarizer Response: OK' : 'Connection Failed'}
                      </span>
                      {summaryTestResult.latencyMs && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          ({summaryTestResult.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 truncate mt-0.5">
                      {summaryTestResult.success
                        ? `Summarizer AI is ready to compile roleplay turns into chapters!`
                        : summaryTestResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interval Slider Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-purple-300 font-semibold uppercase tracking-wider">Auto-Compaction Milestone</span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-200 border border-purple-800/40 font-bold">
                  Every {summaryConfig.intervalTurns || 10} Turns
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                step="2"
                value={summaryConfig.intervalTurns || 10}
                onChange={(e) => setSummaryConfig({ ...summaryConfig, intervalTurns: parseInt(e.target.value, 10) })}
                className="w-full h-2 accent-purple-500 bg-slate-800 rounded-lg cursor-pointer my-1"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[6, 10, 14, 20].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSummaryConfig({ ...summaryConfig, intervalTurns: t })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                      (summaryConfig.intervalTurns || 10) === t
                        ? 'bg-purple-950 border-purple-500 text-purple-200 font-bold'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08]'
                    }`}
                  >
                    Every {t} Turns
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 block leading-relaxed">
                The engine automatically condenses older narrative turns into permanent chronological chapters at this interval.
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  const finalCfg = {
                    ...summaryConfig,
                    apiKey: usePrimarySummaryKey ? (apiKeys[summaryConfig.provider] || '') : summaryConfig.apiKey,
                    customBaseUrl: summaryConfig.provider === 'custom' ? summaryCustomBaseUrl : undefined,
                  };
                  saveStoredSummaryConfig(finalCfg);
                  setSummarySavedToast(true);
                  setTimeout(() => setSummarySavedToast(false), 2000);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer"
              >
                {summarySavedToast ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                {summarySavedToast ? 'Summarizer Config Saved to Storage!' : 'Save Summarizer Settings'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DIRECTOR INSTRUCTIONS (IMMUTABLE) & SYSTEM INSTRUCTIONS (EDITABLE) */}
        {activeTab === 'director' && (
          <div className="space-y-5 animate-fade-in text-xs">
            {/* 1. Locked Director Architecture (Cannot be edited) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Director Engine Protocol (Locked Core)</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/40 font-semibold">
                  Non-Editable
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                This director protocol enforces XML output schema (<code className="text-cyan-300">&lt;narration&gt;</code>, <code className="text-cyan-300">&lt;say speaker="..."&gt;</code>, <code className="text-cyan-300">&lt;state_update&gt;</code>) and participant agency. It cannot be altered because it is necessary to keep the backend parser and formatting running.
              </p>
              <pre className="p-3.5 rounded-xl bg-black/80 border border-white/[0.08] text-[10px] text-purple-300/80 font-mono whitespace-pre-wrap leading-relaxed select-text overflow-x-auto max-h-40 overflow-y-auto">
                {IMMUTABLE_DIRECTOR_PROTOCOL}
              </pre>
            </div>

            {/* 2. Session System Instructions (Editable In-Between Roleplays) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>Session System Instructions (Editable)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSystemInstructions(getGoldStandardTemplate(session?.universe || 'this anime'))}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Gold Standard</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Combined with the Director protocol on every turn. You can freely edit these instructions in-between roleplays to customize rules, intimate scene explicitness, and world constraints.
              </p>

              <textarea
                rows={11}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                className="w-full bg-black/70 border border-purple-500/30 rounded-xl p-3.5 text-xs text-purple-200 focus:outline-none focus:border-cyan-400 font-mono leading-relaxed resize-y"
                placeholder="Enter system instructions / Gold Standard template..."
              />

              <button
                type="button"
                onClick={handleSaveContext}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer"
              >
                {contextSavedToast ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                {contextSavedToast ? 'System Instructions Saved!' : 'Save System Instructions to Session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </>
);
}
