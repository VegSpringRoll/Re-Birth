import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  RotateCcw,
  Edit3,
  Check,
  X,
  Sparkles,
  Square,
  User as UserIcon,
  Trash2,
  Copy,
  Compass,
  Paperclip,
  MessageCircle,
  Key,
  AlertCircle,
  Image as ImageIcon,
  EyeOff,
  Users,
  Globe,
  ChevronRight,
} from 'lucide-react';
import NarrationCard from './NarrationCard.jsx';
import DialogueBubble from './DialogueBubble.jsx';
import AvatarImage from './AvatarImage.jsx';
import CharacterStageSidePanel from './CharacterStageSidePanel.jsx';
import { getActiveNPCsList } from './LeftPanel.jsx';
import { parseRoleplayBlocks } from '../utils/parseRoleplayBlocks.js';
import { getUniverseBackground } from '../utils/animeBackgrounds.js';
import { calculateRoleplayTokenMetrics, estimateTokens } from '../utils/tokenCounter.js';
import {
  getStoredSummaryConfig,
  getStoredApiKeys,
  getActiveProvider,
  getStoredModels,
  getStoredCustomProxyUrl
} from '../utils/storage.js';

/**
 * Renders dialogue enclosed in quotation marks with SillyTavern Moonlight Echoes color highlight
 */
export function renderHighlightedProse(text, quoteColor = 'text-cyan-300 font-normal') {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, pIdx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const codeContent = part.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
      return (
        <div key={pIdx} className="my-3 rounded-2xl bg-black/60 border border-cyan-500/30 p-3.5 font-mono text-xs text-slate-200 overflow-x-auto relative group/code shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-cyan-400/80 mb-2 border-b border-cyan-500/20 pb-1">
            <span>CODE / TECHNIQUE</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(codeContent)}
              className="text-slate-400 hover:text-white"
              title="Copy code"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="leading-relaxed font-mono"><code>{codeContent}</code></pre>
        </div>
      );
    }

    const paragraphs = part.split(/\n\s*\n/).filter(Boolean);
    return paragraphs.map((para, paraIdx) => {
      const quoteSegments = para.split(/(".*?"|“.*?”)/g);
      return (
        <p key={`${pIdx}-${paraIdx}`} className="text-[14.5px] sm:text-[15px] leading-relaxed text-slate-200 font-sans my-2.5">
          {quoteSegments.map((seg, sIdx) => {
            if ((seg.startsWith('"') && seg.endsWith('"')) || (seg.startsWith('“') && seg.endsWith('”'))) {
              return (
                <span key={sIdx} className={`${quoteColor} font-medium`}>
                  {seg}
                </span>
              );
            }
            return <span key={sIdx}>{seg}</span>;
          })}
        </p>
      );
    });
  });
}

export default function StagePanel({
  session,
  worldState,
  activeNpcCount,
  streamingContent,
  isStreaming,
  apiKeyConnected,
  onSendMessage,
  onRegenerateTurn,
  onEditMessage,
  onDeleteMessage,
  onStopStreaming,
  onOpenWorldForge,
  onOpenKeyManager,
  onOpenPersonaModal,
  onToggleLeftPanel,
  quickInputMove,
}) {
  const [inputText, setInputText] = useState('');
  const [editingMsgIndex, setEditingMsgIndex] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showKeyWarning, setShowKeyWarning] = useState(false);

  // On-Demand Character Action & Yandex Image Inspector
  const [activeInspection, setActiveInspection] = useState(null);

  const getActiveAnalyzerApiConfig = () => {
    // 1. Dedicated summarizer config (user preference for scene analysis)
    try {
      const summaryConfig = getStoredSummaryConfig();
      if (summaryConfig?.apiKey && summaryConfig.apiKey.trim()) {
        return {
          provider: summaryConfig.provider || 'openai',
          apiKey: summaryConfig.apiKey.trim(),
          model: summaryConfig.model || 'gpt-4o-mini',
          customBaseUrl: summaryConfig.customBaseUrl || 'http://localhost:11434/v1',
        };
      }
    } catch (e) {}

    // 2. Active BYOK chat provider
    try {
      const provider = getActiveProvider() || 'openrouter';
      const keys = getStoredApiKeys() || {};
      const models = getStoredModels() || {};
      const customBaseUrl = getStoredCustomProxyUrl() || 'http://localhost:11434/v1';
      const apiKey = keys[provider] || '';

      if (apiKey && apiKey.trim()) {
        return {
          provider,
          apiKey: apiKey.trim(),
          model: models[provider] || '',
          customBaseUrl,
        };
      }

      for (const p of ['openrouter', 'groq', 'gemini', 'openai', 'mistral', 'anthropic']) {
        if (keys[p] && keys[p].trim()) {
          return {
            provider: p,
            apiKey: keys[p].trim(),
            model: models[p] || '',
            customBaseUrl,
          };
        }
      }
    } catch (e) {}

    return null;
  };

  const handleInspectCharacter = async (character, sceneContext = '', customQuery = '') => {
    if (!character) return;
    setActiveInspection({
      character,
      universe: worldState?.universe || '',
      action: customQuery ? 'Custom Search' : 'Analyzing Scene...',
      searchQuery: customQuery || '',
      results: [],
      loading: true,
      error: null,
    });

    const activeApiConfig = getActiveAnalyzerApiConfig();

    try {
      const res = await fetch('/api/character-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character,
          universe: worldState?.universe || '',
          sceneText: sceneContext || '',
          searchQuery: customQuery || '',
          sessionId: session?._id,
          apiConfig: activeApiConfig,
        }),
      });

      if (!res.ok) throw new Error('Failed to scrape character images');
      const data = await res.json();
      setActiveInspection({
        character: data.character || character,
        universe: data.universe || worldState?.universe || '',
        action: data.action || '',
        searchQuery: data.searchQuery || '',
        results: data.results || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setActiveInspection((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Error scraping character images',
      }));
    }
  };

  const messages = session?.messages || [];
  const userTurnsCount = messages.filter((m) => m.role === 'user').length;
  const tokenMetrics = calculateRoleplayTokenMetrics({
    session,
    worldState,
    currentInput: inputText,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (quickInputMove) {
      setInputText((prev) => (prev ? `${prev} ${quickInputMove}` : quickInputMove));
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [quickInputMove]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingContent]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    if (!apiKeyConnected) {
      setShowKeyWarning(true);
      return;
    }

    setShowKeyWarning(false);
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStartEdit = (index, currentContent) => {
    setEditingMsgIndex(index);
    setEditingContent(currentContent);
  };

  const handleSaveEdit = (index) => {
    if (onEditMessage) {
      onEditMessage(index, editingContent);
    }
    setEditingMsgIndex(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingMsgIndex(null);
    setEditingContent('');
  };

  const handleCopyMessage = (index, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditLastMessage = () => {
    const msgs = session?.messages || [];
    // Only user's message should be editable, not NPC's
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        handleStartEdit(i, msgs[i].rawContent);
        return;
      }
    }
  };

  const insertDialogueSyntax = () => {
    const textarea = inputRef.current;
    if (!textarea) {
      setInputText((prev) => prev + '""');
      return;
    }
    const start = textarea.selectionStart ?? inputText.length;
    const end = textarea.selectionEnd ?? inputText.length;
    const selected = inputText.substring(start, end);
    const before = inputText.substring(0, start);
    const after = inputText.substring(end);

    const replacement = `"${selected}"`;
    setInputText(before + replacement + after);

    setTimeout(() => {
      textarea.focus();
      const cursor = start + 1;
      textarea.setSelectionRange(cursor, cursor + selected.length);
    }, 0);
  };

  const userName = session?.userProfile?.name || 'Kaelen Valerius';
  const parsedStreaming = streamingContent ? parseRoleplayBlocks(streamingContent) : null;
  const bgTheme = getUniverseBackground(worldState?.universe);

  return (
    <main
      className="flex-1 h-full flex flex-col bg-[#060814] overflow-hidden relative select-text"
      style={{
        backgroundImage: `radial-gradient(ellipse at 80% 25%, rgba(245, 158, 11, 0.12) 0%, rgba(56, 189, 248, 0.08) 40%, rgba(6, 9, 22, 0.97) 85%), ${bgTheme.gradient}`,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Ambient Skyline / Interior Glow Reflection (Matching Moonlight Echoes) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 900' fill='none'><path fill='%23ffffff' fill-opacity='0.08' d='M0,900 L0,550 L80,480 L120,400 L160,480 L240,430 L320,550 L380,320 L400,200 L420,320 L480,550 L560,450 L640,550 L720,250 L740,120 L760,250 L840,550 L920,420 L1000,550 L1080,310 L1100,180 L1120,310 L1200,550 L1280,440 L1360,520 L1440,450 L1440,900 Z'/><circle cx='1100' cy='280' r='180' stroke='%23f59e0b' stroke-opacity='0.12' stroke-width='4'/></svg>")`
        }}
      />

      {/* Stage Top Bar (Desktop Only - hidden on mobile to maximize chat space and eliminate duplicate bar) */}
      <div className="hidden md:flex px-3 sm:px-5 py-2 sm:py-2.5 border-b border-white/[0.07] bg-[#080b1a]/80 backdrop-blur-2xl items-center justify-between shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-400" />
            <span className="absolute -inset-1 rounded-full bg-emerald-400/25 animate-ping pointer-events-none" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[11px] sm:text-xs font-bold text-slate-100 font-display tracking-widest uppercase truncate max-w-[150px] sm:max-w-md">
                {session?.title || 'RE-BIRTH ROLEPLAY STAGE'}
              </h1>
            </div>
            <p className="text-[10px] text-purple-300/80 font-mono flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="font-semibold text-slate-300">
                ⌛ {userTurnsCount} {userTurnsCount === 1 ? 'Turn' : 'Turns'}
              </span>
              <span className="text-purple-600/60 hidden xs:inline">&bull;</span>
              <span
                className="text-cyan-300 font-semibold bg-cyan-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-cyan-800/40 cursor-help hidden xs:inline"
                title={`Full Chronicle Cumulative Size:\n• System & World Context: ~${tokenMetrics.systemTokens.toLocaleString()} tok\n• All ${messages.length} Messages in Chronicle: ~${tokenMetrics.allHistoryTokens.toLocaleString()} tok\n───────────────────────────────\nTotal Roleplay History: ~${tokenMetrics.fullRoleplayTokens.toLocaleString()} tok`}
              >
                🪙 RP Total: ~{tokenMetrics.fullRoleplayTokens.toLocaleString()} tok
              </span>
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={onRegenerateTurn}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-purple-950/60 border border-white/[0.08] hover:border-purple-500/40 text-[11px] text-purple-300 hover:text-purple-100 transition-all shadow-sm"
              title="Regenerate last turn"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
          {isStreaming && (
            <button
              onClick={onStopStreaming}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-[11px] text-rose-300 hover:text-rose-100 transition-all shadow-sm"
              title="Stop streaming"
            >
              <Square className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Scene HUD & World Matrix Banner (One-Tap Access to LeftPanel) */}
      {session && (
        <div className="md:hidden w-full px-3 py-2 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-cyan-950/90 border-b border-purple-500/30 flex items-center justify-between shadow-lg shrink-0">
          <button
            type="button"
            onClick={onToggleLeftPanel}
            className="flex-1 min-w-0 flex items-center gap-2 text-left mr-2 active:opacity-80 touch-manipulation"
            title="Tap to open World, NPCs & Timeline Matrix"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 font-display truncate">
                <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{worldState?.currentLocation || session?.title || 'World & Timeline Matrix'}</span>
              </div>
              <p className="text-[10px] text-purple-300/80 font-mono truncate">
                {worldState?.universe ? `${worldState.universe} • ` : ''}
                {worldState?.currentTime || worldState?.weather || 'Live Sector Tracker'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleLeftPanel}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-[10.5px] font-mono font-bold flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0 touch-manipulation"
            title="Open World, NPCs & Timeline Matrix"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{(activeNpcCount !== undefined ? activeNpcCount : getActiveNPCsList(worldState).length)} NPCs</span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-300" />
          </button>
        </div>
      )}

      {/* Middle Stage Body: Chat Feed + Dedicated Character Stage Beside Chat */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Roleplay Chat Stage Feed */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6 scroll-smooth">
        {/* OPENING HERO SCREEN (Responsive & Visually Immersive) */}
        {messages.length === 0 && !isStreaming && (
          <div className="min-h-[50vh] sm:min-h-full flex flex-col items-center justify-center text-center p-3 sm:p-6 animate-fade-in my-auto max-w-xl md:max-w-2xl mx-auto">
            {/* Centered Glowing Rounded Square Badge */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-cyan-400/50 p-1 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl flex items-center justify-center mb-3 sm:mb-6 hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-950/60 to-purple-950/80 flex items-center justify-center border border-white/10">
                <Compass className="w-7 h-7 sm:w-9 sm:h-9 text-cyan-300 animate-pulse-slow" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-100 font-display tracking-[0.12em] sm:tracking-[0.18em] uppercase px-1">
              CHOOSE YOUR WORLD AND PLAY
            </h2>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-sm text-slate-300/80 max-w-sm sm:max-w-xl mt-2 sm:mt-3 leading-relaxed font-sans px-2">
              Step into any realm from anime, light novels, movies, or fantasy lore. Pick a popular world preset or enter your custom universe to begin your personalized chronicle.
            </p>

            {/* Glowing Pill Button */}
            <button
              onClick={onOpenWorldForge}
              className="mt-4 sm:mt-7 px-6 sm:px-9 py-2.5 sm:py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-all shadow-xl shadow-purple-900/60 flex items-center gap-2 hover:scale-105 active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>ENTER REALM & BEGIN</span>
            </button>

            {/* Crucial Setup Hub Matrix (OC Persona & API Keys - 100% Mobile & Desktop Prominent) */}
            <div className="mt-4 sm:mt-6 w-full max-w-xs sm:max-w-md md:max-w-lg grid grid-cols-2 gap-2 sm:gap-3">
              {/* Protagonist Persona / OC Hub */}
              <button
                type="button"
                onClick={onOpenPersonaModal}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/70 via-slate-900/90 to-cyan-950/40 border border-cyan-500/35 hover:border-cyan-400 text-left transition-all group shadow-lg active:scale-95 touch-manipulation"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-[8.5px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    OC Hub
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  Protagonist OC
                </div>
                <div className="text-[9.5px] sm:text-[10px] text-slate-400 font-sans truncate mt-0.5">
                  Moves &amp; Backstory
                </div>
              </button>

              {/* API Keys & Settings Hub */}
              <button
                type="button"
                onClick={onOpenKeyManager}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-purple-950/40 border border-purple-500/35 hover:border-purple-400 text-left transition-all group shadow-lg active:scale-95 touch-manipulation"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <span className={`text-[8.5px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    apiKeyConnected
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                      : 'bg-amber-950 text-amber-300 border-amber-700/50 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apiKeyConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {apiKeyConnected ? 'Ready' : 'Setup Key'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                  API Keys &amp; Models
                </div>
                <div className="text-[9.5px] sm:text-[10px] text-slate-400 font-sans truncate mt-0.5">
                  OpenRouter, Gemini…
                </div>
              </button>
            </div>

            {/* Popular Realm Quick-Tap Chips */}
            <div className="mt-4 sm:mt-5 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-w-lg">
              <span className="text-[9.5px] sm:text-[10px] font-mono text-purple-300/60 uppercase tracking-wider w-full mb-0.5">
                Popular Realms
              </span>
              {['Sword Art Online', 'Jujutsu Kaisen', 'Re:Zero', 'Mushoku Tensei'].map((realm) => (
                <button
                  key={realm}
                  onClick={onOpenWorldForge}
                  className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.08] hover:border-cyan-400/40 text-[10px] sm:text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all active:scale-95 touch-manipulation"
                >
                  {realm}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* API KEY DISCONNECTED NOTIFICATION BANNER */}
        {showKeyWarning && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shadow-xl backdrop-blur-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block text-slate-100">API Key Not Connected</span>
                <span className="text-[11px] text-amber-300/80">
                  Please connect your API key (OpenRouter, Anthropic, OpenAI, or Gemini) in Samplers & Moves to begin roleplay.
                </span>
              </div>
            </div>
            <button
              onClick={onOpenKeyManager}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 ml-3"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Connect Key</span>
            </button>
          </div>
        )}

        {/* Message Turns Feed */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isAssistant = msg.role === 'assistant';
          const isBeingEdited = editingMsgIndex === index;
          const isLastMessage = index === messages.length - 1;

          if (isUser) {
            const userTokens = estimateTokens(msg.rawContent || msg.content || '');

            return (
              <div key={index} className="flex justify-end my-5 animate-fade-in group max-w-4xl ml-auto">
                <div className="w-full sm:w-auto max-w-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-end gap-2 mb-1.5 px-2">
                    <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full">
                      {userTokens}t
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs font-bold text-cyan-300 font-display flex items-center gap-1.5">
                      {userName}
                      <AvatarImage
                        src={session?.userProfile?.avatar}
                        speaker={userName}
                        universe={worldState?.universe}
                        size="sm"
                        className="w-6 h-6 rounded-full border border-cyan-400/40 object-cover"
                      />
                    </span>
                  </div>

                  {isBeingEdited ? (
                    <div className="p-4 bg-slate-900/95 border border-cyan-400/50 rounded-3xl shadow-2xl backdrop-blur-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-cyan-300 font-mono uppercase">Edit User Turn</span>
                        <span className="text-[10px] text-slate-400 font-mono">{estimateTokens(editingContent)} tokens ({editingContent.length} chars)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-slate-950/90 border border-white/10 rounded-2xl p-3 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2.5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-3xl bg-slate-900/45 backdrop-blur-2xl border border-white/10 px-4 py-3 sm:px-6 sm:py-4 text-slate-100 shadow-2xl hover:border-cyan-500/30 transition-all group/usercard">
                      <div className="font-sans">
                        {renderHighlightedProse(msg.rawContent, 'text-cyan-300 font-normal')}
                      </div>

                      {/* Action buttons on hover */}
                      <div className="absolute right-4 -bottom-3 sm:opacity-0 sm:group-hover/usercard:opacity-100 transition-opacity flex items-center gap-1 bg-slate-950/90 border border-white/10 rounded-full px-2 py-0.5 shadow-xl backdrop-blur-xl">
                        <button
                          onClick={() => handleStartEdit(index, msg.rawContent)}
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Edit Message"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(index, msg.rawContent)}
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Copy text"
                        >
                          {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this message turn?')) {
                              onDeleteMessage(index);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (isAssistant) {
            const { blocks } = parseRoleplayBlocks(msg.rawContent);
            const speakingCharacters = Array.from(
              new Set(blocks.filter((b) => b.type === 'say' && b.speaker).map((b) => b.speaker))
            );
            const characterSpeaker = speakingCharacters[0] || (worldState?.universe || 'Simulation Master');
            const turnNumber = messages.slice(0, index + 1).filter((m) => m.role === 'assistant').length;
            const turnTokens = estimateTokens(msg.rawContent || msg.content || '');

            return (
              <div key={index} className="my-7 animate-fade-in group relative max-w-4xl mx-auto w-full">
                {/* Header matching Moonlight Echoes: Round avatar, #1 badge, token badge, name, date, actions */}
                <div className="flex items-center justify-between mb-2.5 px-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      onClick={() => handleInspectCharacter(characterSpeaker, msg.rawContent)}
                      className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      title={`Click to inspect ${characterSpeaker}'s action & images (Yandex)`}
                    >
                      <AvatarImage
                        speaker={characterSpeaker}
                        universe={worldState?.universe}
                        size="sm"
                        className="w-7 h-7 rounded-full border border-white/20 hover:border-cyan-400 shadow-md shrink-0 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      #{turnNumber}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full hidden sm:inline">
                      {turnTokens}t
                    </span>
                    <span className="text-xs font-bold text-slate-100 font-display truncate">
                      {characterSpeaker}
                    </span>
                    <span className="text-[10px] text-slate-400/80 font-sans hidden md:inline">
                      {new Date(msg.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions on top right */}
                  <div className="flex items-center gap-1 bg-slate-950/70 border border-white/10 rounded-full px-2 py-0.5 backdrop-blur-xl">
                    <button
                      onClick={() => handleStartEdit(index, msg.rawContent)}
                      className="p-1 rounded-full text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Edit this turn"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {isLastMessage && !isStreaming && (
                      <button
                        onClick={onRegenerateTurn}
                        className="p-1 rounded-full text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                        title="Regenerate this response"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-medium hidden sm:inline">Regenerate</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyMessage(index, msg.rawContent)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy raw message"
                    >
                      {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this turn?')) {
                          onDeleteMessage(index);
                        }
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete turn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Moonlight Echoes Glass Card */}
                <div className="rounded-3xl bg-slate-950/45 backdrop-blur-2xl border border-white/[0.09] shadow-2xl p-4 sm:p-7 relative overflow-hidden group/card hover:border-white/15 transition-all">
                  {/* Subtle top light sheen reflection */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  {/* Scene Topic Header: | Scene Name */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1 h-4 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                      <h3 className="text-sm font-semibold text-slate-100 tracking-wide font-display">
                        {worldState?.currentLocation || session?.title || 'Chronicle Chapter'}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-widest hidden sm:inline">
                      {worldState?.universe || 'Simulation'}
                    </span>
                  </div>

                  {/* Body Content with Integrated Character Portrait */}
                  {isBeingEdited ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                        <span>Edit Assistant Turn</span>
                        <span className="text-slate-400 text-[11px]">{editingContent.length} chars</span>
                      </div>
                      <textarea
                        rows={6}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full bg-slate-950/90 border border-white/15 rounded-2xl p-3.5 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 font-sans leading-relaxed"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/40"
                        >
                          <Check className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 leading-relaxed">
                      {blocks.map((block, bIdx) => {
                        if (block.type === 'narration') {
                          return (
                            <div key={bIdx} className="font-sans text-slate-200">
                              {renderHighlightedProse(block.content, 'text-cyan-300 font-normal')}
                            </div>
                          );
                        }
                        if (block.type === 'say') {
                          return (
                            <div
                              key={bIdx}
                              onMouseEnter={() => setHoveredSpeaker(block.speaker)}
                              className="my-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-900/85 border border-cyan-500/25 backdrop-blur-xl flex items-start gap-3 sm:gap-4 shadow-lg group/say transition-all hover:border-cyan-400/40"
                            >
                              <div
                                onClick={() => handleInspectCharacter(block.speaker, msg.rawContent || block.content)}
                                className="relative shrink-0 self-start cursor-pointer group/avatar hover:scale-105 active:scale-95 transition-transform"
                                title={`Click to inspect ${block.speaker}'s scene action & images (Yandex)`}
                              >
                                <AvatarImage
                                  speaker={block.speaker}
                                  universe={worldState?.universe}
                                  size="lg"
                                  className="w-12 h-12 sm:w-16 sm:h-20 rounded-2xl object-cover object-top border border-cyan-400/30 group-hover/avatar:border-cyan-400 shadow-md ring-1 ring-cyan-500/25 group-hover/say:scale-105 transition-all"
                                />
                                <span className="absolute -bottom-1 -right-1 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold shadow-sm group-hover/avatar:bg-cyan-600 group-hover/avatar:text-white transition-colors">
                                  NPC
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs sm:text-sm font-bold font-display text-cyan-300 tracking-wide">
                                    {block.speaker}
                                  </span>
                                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 font-semibold tracking-wider">
                                    Dialogue
                                  </span>
                                </div>
                                <div className="text-[15px] sm:text-[15.5px] text-slate-100 leading-relaxed font-sans font-medium">
                                  "{block.content}"
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {/* Card Footer: Turn Metrics & Quick Regenerate button */}
                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        🪙 ~{turnTokens} tokens
                      </span>
                      <span className="text-slate-500 hidden sm:inline">&bull;</span>
                      <span className="text-slate-500 hidden sm:inline">Cinematic Third-Person</span>
                    </div>

                    {isLastMessage && !isStreaming && (
                      <button
                        onClick={onRegenerateTurn}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-all text-xs font-sans font-medium shadow-sm"
                        title="Regenerate this turn"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Streaming Turn (Moonlight Echoes Live Card) */}
        {isStreaming && (() => {
          const { blocks } = parseRoleplayBlocks(streamingContent);
          const speakingCharacters = Array.from(
            new Set(blocks.filter((b) => b.type === 'say' && b.speaker).map((b) => b.speaker))
          );
          const characterSpeaker = speakingCharacters[0] || (worldState?.universe || 'Simulation Master');
          const turnTokens = estimateTokens(streamingContent || '');

          return (
            <div className="my-7 animate-fade-in group relative max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-2.5 px-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-sm shadow-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300 font-display uppercase tracking-wider">
                    Streaming Cinematic Turn...
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full">
                    {turnTokens}t
                  </span>
                </div>
                <button
                  onClick={onStopStreaming}
                  className="px-3 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3 h-3 fill-rose-300" />
                  <span>Stop</span>
                </button>
              </div>

              <div className="rounded-3xl bg-slate-950/45 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl p-4 sm:p-7 relative overflow-hidden">
                <div className="border-l-2 border-cyan-400 pl-3 font-semibold text-slate-100 text-sm tracking-wide mb-4">
                  | {worldState?.currentLocation || session?.title || 'Chronicle Chapter'}
                </div>
                <div className="space-y-3.5 leading-relaxed">
                  {blocks.length > 0 ? (
                    blocks.map((block, bIdx) => {
                      if (block.type === 'narration') {
                        return (
                          <div key={`stream-${bIdx}`} className="font-sans text-slate-200">
                            {renderHighlightedProse(block.content, 'text-cyan-300 font-normal')}
                          </div>
                        );
                      }
                      if (block.type === 'say') {
                        return (
                          <div
                            key={`stream-${bIdx}`}
                            onMouseEnter={() => setHoveredSpeaker(block.speaker)}
                            className="my-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-900/85 border border-cyan-500/25 backdrop-blur-xl flex items-start gap-3 sm:gap-4 shadow-lg group/say transition-all hover:border-cyan-400/40"
                          >
                            <div
                              onClick={() => handleInspectCharacter(block.speaker, streamingContent || block.content)}
                              className="relative shrink-0 self-start cursor-pointer group/avatar hover:scale-105 active:scale-95 transition-transform"
                              title={`Click to inspect ${block.speaker}'s scene action & images (Yandex)`}
                            >
                              <AvatarImage
                                speaker={block.speaker}
                                universe={worldState?.universe}
                                size="lg"
                                className="w-12 h-12 sm:w-16 sm:h-20 rounded-2xl object-cover object-top border border-cyan-400/30 group-hover/avatar:border-cyan-400 shadow-md ring-1 ring-cyan-500/25 group-hover/say:scale-105 transition-all"
                              />
                              <span className="absolute -bottom-1 -right-1 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold shadow-sm group-hover/avatar:bg-cyan-600 group-hover/avatar:text-white transition-colors">
                                NPC
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs sm:text-sm font-bold font-display text-cyan-300 tracking-wide">
                                  {block.speaker}
                                </span>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 font-semibold tracking-wider">
                                  Dialogue
                                </span>
                              </div>
                              <div className="text-[15px] sm:text-[15.5px] text-slate-100 leading-relaxed font-sans font-medium">
                                "{block.content}"
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <div className="text-slate-300 italic animate-pulse">
                      Generating roleplay prose...
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* On-Demand Character Action & Yandex Gallery Side Panel */}
      {activeInspection && (
        <CharacterStageSidePanel
          inspection={activeInspection}
          onSearchAction={(customQuery) =>
            handleInspectCharacter(activeInspection.character, '', customQuery)
          }
          onClose={() => setActiveInspection(null)}
        />
      )}
    </div>

      {/* Input Stage Bottom Bar (Matching Concept Art, Mobile-Optimized) */}
      <div className="p-2 sm:p-4 pb-safe border-t border-purple-500/20 bg-slate-950/90 backdrop-blur-2xl shrink-0 z-10 shadow-2xl">
        {/* Toolbar: SYNTAX & SIMULATION TOOLS (Hidden on mobile if 0 turns to maximize screen space) */}
        <div className={`items-center justify-between mb-2 px-1 gap-2 ${messages.length === 0 ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={insertDialogueSyntax}
              className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-cyan-950/70 border border-cyan-500/30 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 touch-manipulation"
              title='Insert "" dialogue quotation marks'
            >
              <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dialogue</span>
            </button>
            {messages.length > 0 && !isStreaming && (
              <>
                <button
                  type="button"
                  onClick={handleEditLastMessage}
                  className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-purple-950/70 border border-purple-500/30 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 touch-manipulation"
                  title="Edit Last Turn"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Last</span>
                </button>
                <button
                  type="button"
                  onClick={onRegenerateTurn}
                  className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-900/90 hover:bg-cyan-950/70 border border-cyan-500/30 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 touch-manipulation"
                  title="Regenerate last response"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xs:inline">Regenerate</span>
                  <span className="xs:hidden">Reroll</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono shrink-0 ml-auto">
            <span
              className="text-cyan-400 bg-cyan-950/50 px-1.5 sm:px-2 py-0.5 rounded border border-cyan-800/40 cursor-help"
              title={`Your current message draft: ~${tokenMetrics.draftTokens.toLocaleString()} tokens`}
            >
              Draft: ~{tokenMetrics.draftTokens.toLocaleString()}t
            </span>
            <span
              className="text-purple-300/80 bg-purple-950/50 px-1.5 sm:px-2 py-0.5 rounded border border-purple-800/40 cursor-help hidden xs:inline"
              title={`LLM Request Payload on Next Turn:\n• System & World Context: ~${tokenMetrics.systemTokens.toLocaleString()} tok\n• Active Window (${tokenMetrics.windowedPlayerTurns} player turns & responses combined / ${tokenMetrics.windowedMessagesCount} msgs): ~${tokenMetrics.windowedHistoryTokens.toLocaleString()} tok\n• Your Draft Message: ~${tokenMetrics.draftTokens.toLocaleString()} tok\n───────────────────────────────\nTotal sent to LLM: ~${tokenMetrics.totalPayloadTokens.toLocaleString()} tok${tokenMetrics.prunedPlayerTurns > 0 ? `\n\nPruned from prompt to save context: ${tokenMetrics.prunedPlayerTurns} older turns (~${tokenMetrics.prunedTokens.toLocaleString()} tok saved)` : '\n\nAll turns currently fit within your player turn memory window!'}`}
            >
              Payload: ~{tokenMetrics.totalPayloadTokens.toLocaleString()}t
            </span>
          </div>
        </div>

        {/* Input Capsule Box (Matching Moonlight Echoes Glass Capsule) */}
        <form onSubmit={handleSubmit} className="relative flex items-center rounded-2xl sm:rounded-full bg-slate-950/75 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/40 focus-within:border-cyan-400 shadow-2xl px-2.5 sm:px-4 py-2 sm:py-2 transition-all">
          <div className="p-1.5 text-slate-400 hover:text-cyan-300 cursor-pointer shrink-0 transition-colors hidden xs:block" title="Attach context or item reference">
            <Paperclip className="w-4 h-4" />
          </div>

          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={messages.length === 0 ? 'Type action and dialogue in double quotes or pick a world above...' : 'Type your action and dialogue in double quotes...'}
            className="flex-1 bg-transparent px-2 sm:px-3 py-1.5 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-sans leading-relaxed transition-all disabled:opacity-60 max-h-32"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Turn</span>
          </button>
        </form>
      </div>
    </main>
  );
}
