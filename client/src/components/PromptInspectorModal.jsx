import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  Sword,
  MessageSquare,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';
import {
  assembleSystemPromptForEstimation,
  calculateRoleplayTokenMetrics,
  getWindowedMessages,
  estimateTokens,
} from '../utils/tokenCounter.js';

export default function PromptInspectorModal({
  isOpen,
  onClose,
  session,
  worldState,
  currentInput = '',
  provider = 'openrouter',
  model = '',
}) {
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'system' | 'state' | 'history' | 'moves'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Calculate live token metrics
  const tokenMetrics = calculateRoleplayTokenMetrics({
    session,
    worldState,
    currentInput,
  });

  // 2. Assemble system prompt
  const systemPrompt = assembleSystemPromptForEstimation({
    session,
    worldState,
    currentInput,
  });

  // 3. Get windowed history messages
  const allMessages = Array.isArray(session?.messages) ? session.messages : [];
  const windowedMessages = getWindowedMessages(allMessages, tokenMetrics.slidingWindow);

  // 4. Detect triggered moves in current draft
  let triggeredMoves = [];
  let allRegisteredMoves = [];
  if (session?.movesetKnowledge && typeof session.movesetKnowledge === 'string') {
    try {
      const trimmed = session.movesetKnowledge.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        allRegisteredMoves = JSON.parse(trimmed);
        if (Array.isArray(allRegisteredMoves)) {
          const text = (currentInput || '').toLowerCase();
          triggeredMoves = allRegisteredMoves.filter((move) => {
            const hasKeyword = Array.isArray(move.keywords) && move.keywords.some((kw) => kw && text.includes(kw.toLowerCase().trim()));
            const hasName = move.name && text.includes(move.name.toLowerCase().trim());
            return hasKeyword || hasName;
          });
        }
      }
    } catch (e) {}
  }

  // 5. Build full raw payload text (what gets dispatched over HTTP to LLM)
  const fullPayloadText = `=== [SYSTEM PROMPT] ===\n${systemPrompt}\n\n=== [CONVERSATION HISTORY WINDOW (${windowedMessages.length} messages / last ${tokenMetrics.windowedPlayerTurns} player turns)] ===\n${windowedMessages
    .map((m, i) => {
      let content = m.rawContent || m.content || '';
      if (m.role === 'assistant') {
        content = content.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '').trim();
      }
      return `[${m.role.toUpperCase()} #${i + 1}]:\n${content}`;
    })
    .join('\n\n')}\n\n=== [USER CURRENT DRAFT] ===\n${currentInput ? currentInput : '(Draft is empty)'}`;

  const handleCopy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-text">
      <div className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl bg-[#080b1f]/98 border-0 sm:border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-gradient-to-r from-cyan-950/40 via-[#080b1f] to-purple-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md shrink-0">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider text-slate-100 truncate">
                  AI Prompt Inspector
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-600/50 font-semibold">
                  Turn Payload
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {provider.toUpperCase()} &bull; {model || 'Default Model'} &bull; ~{tokenMetrics.totalPayloadTokens.toLocaleString()} tokens total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(fullPayloadText)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-semibold transition-all active:scale-95 cursor-pointer"
              title="Copy entire payload to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">{copied ? 'Copied' : 'Copy Payload'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Token Metrics Pills Bar */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-[11px] font-mono shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-semibold shrink-0">
            Total to LLM: ~{tokenMetrics.totalPayloadTokens.toLocaleString()}t
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 shrink-0">
            System &amp; World: ~{tokenMetrics.systemTokens.toLocaleString()}t
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 shrink-0">
            History Window: ~{tokenMetrics.windowedHistoryTokens.toLocaleString()}t ({tokenMetrics.windowedMessagesCount} msgs / {tokenMetrics.windowedPlayerTurns} player turns)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 shrink-0">
            Current Draft: ~{tokenMetrics.draftTokens.toLocaleString()}t
          </span>
          {tokenMetrics.prunedPlayerTurns > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-700/40 text-purple-300 shrink-0">
              Pruned Old Turns: {tokenMetrics.prunedPlayerTurns} (~{tokenMetrics.prunedTokens.toLocaleString()}t saved)
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/[0.06] bg-slate-950/60 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('full')}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 shrink-0 ${
              activeTab === 'full'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.05]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Prompt Payload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 shrink-0 ${
              activeTab === 'system'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.05]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            System &amp; Directives
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('state')}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 shrink-0 ${
              activeTab === 'state'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.05]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            World State &amp; Character
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 shrink-0 ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.05]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active History Window ({windowedMessages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('moves')}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 shrink-0 ${
              activeTab === 'moves'
                ? 'border-cyan-400 text-cyan-300 bg-white/[0.05]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Triggered Moves ({triggeredMoves.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: FULL PAYLOAD */}
          {activeTab === 'full' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Exact raw text dispatched to the LLM completion API:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(fullPayloadText)}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy text</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-black/80 border border-cyan-500/20 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text max-h-[55vh] overflow-y-auto shadow-inner">
                {fullPayloadText}
              </pre>
            </div>
          )}

          {/* TAB 2: SYSTEM PROMPT & SIMULATION DIRECTIVES */}
          {activeTab === 'system' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-cyan-300">Immutable Director Protocol:</span> Enforces third-person prose, prohibits puppetmastering {{user}}, mandates output tags (<code className="text-cyan-300">&lt;narration&gt;</code>, <code className="text-cyan-300">&lt;say&gt;</code>, <code className="text-cyan-300">&lt;state_update&gt;</code>), and commands NPCs to treat you as a stranger unless introduced!
                </div>
              </div>
              <pre className="p-4 rounded-2xl bg-black/80 border border-white/10 text-cyan-100 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text max-h-[55vh] overflow-y-auto shadow-inner">
                {systemPrompt}
              </pre>
            </div>
          )}

          {/* TAB 3: WORLD STATE & CHARACTER SHEET */}
          {activeTab === 'state' && (
            <div className="space-y-4 animate-fade-in text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">Current Location</span>
                  <p className="font-bold text-slate-200 text-sm">{worldState?.currentLocation || 'Unknown'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">Era / Arc</span>
                  <p className="font-bold text-purple-300 text-sm">{worldState?.currentEra || 'Prologue'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">Date &amp; Time</span>
                  <p className="text-slate-200">{worldState?.inGameDate || 'Day 1'} &bull; {worldState?.timeOfDay || 'Dusk'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 block">Weather &amp; Atmosphere</span>
                  <p className="text-slate-200">{worldState?.weather || 'Atmospheric clarity'}</p>
                </div>
              </div>

              {/* Present NPCs in scene */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-cyan-300">
                    Characters Present in Immediate Scene ({Array.isArray(worldState?.knownNPCs) ? worldState.knownNPCs.filter(n => n.isPresent !== false).length : 0})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">NPCs currently with you</span>
                </div>
                <div className="space-y-2">
                  {Array.isArray(worldState?.knownNPCs) && worldState.knownNPCs.filter(n => n.isPresent !== false).length > 0 ? (
                    worldState.knownNPCs.filter(n => n.isPresent !== false).map((npc, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white">{npc.name}</span>
                          <span className="text-slate-400 text-[11px] block">{npc.relation} &bull; {npc.status}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                          Affinity: {npc.affinity || 50}% ({npc.bondTier || 'Acquaintance'})
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-xs">No NPCs currently in immediate vicinity.</p>
                  )}
                </div>
              </div>

              {/* Character Sheet */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="font-mono text-xs font-bold uppercase text-purple-300 block">
                  Protagonist Sheet (Director Reference Only)
                </span>
                <p className="text-[11px] text-slate-400 italic">
                  Note: NPCs in the world cannot read this sheet. They only perceive what is visually apparent and do not know your name until you introduce yourself.
                </p>
                <div className="space-y-1.5 font-mono text-xs text-slate-200">
                  <p><strong className="text-purple-300">Name:</strong> {session?.userProfile?.name || 'Protagonist'}</p>
                  <p><strong className="text-purple-300">Physique:</strong> {session?.userProfile?.physique || 'Unspecified'}</p>
                  <p><strong className="text-purple-300">Traits:</strong> {session?.userProfile?.traits || 'Resolute'}</p>
                  {session?.userProfile?.details && (
                    <p><strong className="text-purple-300">Background:</strong> {session?.userProfile?.details}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECENT TURNS WINDOW */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Sliding Memory Window:</span> Passing the most recent <b>{tokenMetrics.windowedPlayerTurns} player turns</b> and responses ({windowedMessages.length} total messages) into context. Older turns are safely compacted into the Chrono-Summary to prevent memory bloat!
                </div>
              </div>

              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {windowedMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-mono space-y-1 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-900/90 border-cyan-500/30 text-cyan-100'
                        : 'bg-purple-950/30 border-purple-500/25 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>{msg.role === 'user' ? '👤 Player Turn' : '✨ Simulation Master Response'}</span>
                      <span>~{estimateTokens(msg.rawContent || msg.content || '')}t</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {(msg.rawContent || msg.content || '').replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '').trim()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TRIGGERED MOVESET LOREBOOK */}
          {activeTab === 'moves' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 flex items-start gap-2">
                <Sword className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-cyan-300">Token-Saving Lorebook Trigger System:</span> The engine scans your current draft for ability keywords. Only matching techniques are injected into the LLM prompt, keeping prompt costs minimal!
                </div>
              </div>

              {triggeredMoves.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-mono font-bold text-emerald-400 uppercase text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Triggered Techniques for Current Draft ({triggeredMoves.length})
                  </span>
                  {triggeredMoves.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-200 font-display text-sm">{m.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700/50">
                          Active Triggered
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs">{m.description}</p>
                      <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono text-slate-400">
                        <span>Keywords:</span>
                        {Array.isArray(m.keywords) && m.keywords.map((k, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/40 text-emerald-300">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-white/10 text-slate-300 text-center font-mono space-y-1">
                  <p className="font-semibold text-slate-200">No technique triggered in current draft</p>
                  <p className="text-[11px] text-slate-400">
                    Type a registered move name or keyword in your message (e.g. {allRegisteredMoves[0]?.name ? `"${allRegisteredMoves[0].name}"` : 'your abilities'}) to trigger automatic combat parameter injection.
                  </p>
                </div>
              )}

              {/* All Registered Moves List */}
              <div className="pt-2">
                <span className="font-mono uppercase text-slate-400 text-[11px] font-bold block mb-2">
                  All Registered Lorebook Abilities ({allRegisteredMoves.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allRegisteredMoves.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/[0.07] space-y-1">
                      <span className="font-bold text-white text-xs block truncate">{m.name}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
