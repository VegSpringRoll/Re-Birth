import React, { useState } from 'react';
import {
  Globe,
  Compass,
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  Users,
  ScrollText,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  Check,
  X,
  Sparkles,
  BookmarkPlus,
  Trash2,
  BookOpen,
  Heart,
  Shield,
  Swords,
  Archive,
  Plus,
} from 'lucide-react';
import AvatarImage from './AvatarImage.jsx';

const getAffinityDetails = (affinityVal = 50, bondTier) => {
  const val = typeof affinityVal === 'number' ? affinityVal : 50;
  if (val >= 90) {
    return {
      tier: bondTier || 'Devoted / Sworn',
      color: 'text-pink-300',
      barGrad: 'from-pink-500 via-rose-500 to-red-400',
      icon: Heart,
      iconColor: 'text-pink-400 fill-pink-500/20'
    };
  }
  if (val >= 75) {
    return {
      tier: bondTier || 'Trusted Companion',
      color: 'text-purple-300',
      barGrad: 'from-purple-500 to-pink-500',
      icon: Heart,
      iconColor: 'text-purple-400 fill-purple-500/20'
    };
  }
  if (val >= 60) {
    return {
      tier: bondTier || 'Friendly Ally',
      color: 'text-cyan-300',
      barGrad: 'from-indigo-500 to-cyan-400',
      icon: Sparkles,
      iconColor: 'text-cyan-400'
    };
  }
  if (val >= 40) {
    return {
      tier: bondTier || 'Acquaintance',
      color: 'text-slate-300',
      barGrad: 'from-slate-500 to-purple-400',
      icon: Users,
      iconColor: 'text-slate-400'
    };
  }
  if (val >= 20) {
    return {
      tier: bondTier || 'Wary / Distant',
      color: 'text-amber-300',
      barGrad: 'from-amber-600 to-orange-400',
      icon: Shield,
      iconColor: 'text-amber-400'
    };
  }
  return {
    tier: bondTier || 'Hostile / Rival',
    color: 'text-rose-400',
    barGrad: 'from-rose-700 to-red-600',
    icon: Swords,
    iconColor: 'text-rose-400'
  };
};

export default function LeftPanel({
  worldState,
  rollingSummary,
  totalUserTurns = 0,
  summarizedUserTurns = 0,
  pendingUserTurns = 0,
  lastSummarizedIndex = 0,
  messagesCount = 0,
  pinnedMemories = [],
  onUpdateWorldState,
  onTriggerCompaction,
  onAddPinnedMemory,
  onDeletePinnedMemory,
  isMobileOpen,
  onCloseMobile,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onOpenWorldForge,
  onDeleteSession,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showChronicleList, setShowChronicleList] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [memoriesExpanded, setMemoriesExpanded] = useState(false);
  const [activeNpcsExpanded, setActiveNpcsExpanded] = useState(true);
  const [encounteredNpcsExpanded, setEncounteredNpcsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...(worldState || {}) });
  const [newMemoryText, setNewMemoryText] = useState('');

  React.useEffect(() => {
    if (worldState) {
      setFormData({ ...worldState });
    }
  }, [worldState]);

  const handleSave = () => {
    onUpdateWorldState(formData);
    setIsEditing(false);
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    onAddPinnedMemory(newMemoryText.trim());
    setNewMemoryText('');
  };

  const isNpcActive = (npc) => {
    if (!npc) return false;
    if (npc.isPresent === false) return false;
    if (npc.isPresent === true && !npc.status) return true;
    if (npc.status) {
      const awayRegex = /\b(back at|away|elsewhere|left behind|slumbering|in the field|resting in|observing from|traveling to|absent|not present|far away|departed|at home|locked in|dead|slain)\b/i;
      if (awayRegex.test(npc.status)) return false;
    }
    return npc.isPresent !== false;
  };

  const handleToggleNPCPresence = (npcName) => {
    const rawList = Array.isArray(worldState?.knownNPCs) ? worldState.knownNPCs : [];
    const updated = rawList.map((n) => {
      if (n.name === npcName) {
        const currentlyActive = isNpcActive(n);
        return { ...n, isPresent: !currentlyActive };
      }
      return n;
    });
    onUpdateWorldState?.({
      ...(worldState || {}),
      knownNPCs: updated
    });
  };

  const handleDeleteNPC = (npcName) => {
    const rawList = Array.isArray(worldState?.knownNPCs) ? worldState.knownNPCs : [];
    const updated = rawList.filter((n) => n.name !== npcName);
    onUpdateWorldState?.({
      ...(worldState || {}),
      knownNPCs: updated
    });
  };

  // Filter out legacy dummy template NPCs ('Rival Sovereign', 'Formidable Rival', '<Universe> Guide')
  const npcs = (Array.isArray(worldState?.knownNPCs) ? worldState.knownNPCs : []).filter(
    (npc) =>
      npc &&
      npc.name !== 'Rival Sovereign' &&
      npc.relation !== 'Formidable Rival' &&
      !npc.name?.toLowerCase().endsWith(' guide') &&
      npc.name !== 'Overlord Guide'
  );

  const activeNPCs = npcs.filter(isNpcActive);
  const allEncounteredNPCs = npcs;

  if (collapsed && !isMobileOpen) {
    return (
      <aside className="hidden md:flex w-12 h-full flex-col items-center py-4 bg-slate-950/90 border-r border-purple-500/20 glass-panel shrink-0 select-none z-20">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors"
          title="Expand World & Timeline Matrix"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
        <div className="writing-vertical text-[10px] font-mono tracking-widest text-purple-400 uppercase mt-8 opacity-70">
          World & Timeline
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-fade-in"
        />
      )}

      <aside
        className={`
          ${isMobileOpen ? 'fixed inset-y-0 left-0 z-[60] flex shadow-2xl shadow-black/95 w-[92vw] max-w-[360px] sm:max-w-[400px]' : 'hidden md:flex w-84 xl:w-88 z-20'}
          shrink-0 h-full flex-col glass-panel border-r border-purple-500/25 bg-[#070a18]/98 backdrop-blur-2xl overflow-hidden select-text pt-safe pb-safe
        `}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-inner shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-100 font-display">
                WORLD &amp; TIMELINE
              </h2>
              <p className="text-[10px] text-purple-300/70 font-mono">Live Matrix &amp; Sector Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors"
              title={isEditing ? 'Cancel Edit' : 'Edit Matrix Values'}
            >
              {isEditing ? <X className="w-3.5 h-3.5 text-rose-400" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                if (isMobileOpen && onCloseMobile) {
                  onCloseMobile();
                } else {
                  setCollapsed(true);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 transition-colors"
              title="Close Matrix Panel"
            >
              <X className="w-3.5 h-3.5" />
              <span className="md:hidden">Close</span>
            </button>
          </div>
        </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
        {/* Active Universe & Chronicle Switcher Hub */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0d122b]/80 to-purple-950/40 border border-purple-500/25 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-300 font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Realm &amp; Chronicles Hub</span>
            </span>
            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-300 font-bold">
              {sessions.length} Saved
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (isMobileOpen && onCloseMobile) onCloseMobile();
                onOpenWorldForge?.();
              }}
              className="py-2 px-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Open Universe Selector / Create New Roleplay"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate font-bold">Universe</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChronicleList(!showChronicleList)}
              className="py-2 px-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Switch roleplay chronicles"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate font-bold">Switch RP</span>
              <ChevronDown className={`w-3 h-3 text-purple-400 transition-transform ${showChronicleList ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Quick Chronicle List */}
          {showChronicleList && (
            <div className="space-y-1.5 pt-2 border-t border-purple-500/20 max-h-56 overflow-y-auto pr-0.5 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] font-mono text-purple-300/80 pb-1">
                <span>Select a chronicle to load:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (isMobileOpen && onCloseMobile) onCloseMobile();
                    onOpenWorldForge?.();
                  }}
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>
              {sessions.length === 0 && (
                <p className="text-[11px] text-slate-400 font-mono py-2 text-center">
                  No saved chronicles yet.
                </p>
              )}
              {sessions.map((s) => {
                const isCurrent = s._id === currentSessionId;
                return (
                  <div
                    key={s._id}
                    onClick={() => {
                      onSelectSession?.(s._id);
                      if (isMobileOpen && onCloseMobile) onCloseMobile();
                    }}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-purple-900/60 border-purple-400 text-white font-bold shadow-md shadow-purple-950/60'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-white/10'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate font-semibold text-slate-100">{s.title}</p>
                      <p className="text-[10px] text-purple-300/80 font-mono truncate mt-0.5">
                        {s.universe || 'Anime Realm'} &bull; {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/50 shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {isEditing ? (
          /* Manual Edit Mode */
          <div className="space-y-3 p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-purple-300 uppercase tracking-wider text-[11px]">Override State</span>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">Universe</label>
              <input
                type="text"
                value={formData.universe || ''}
                onChange={(e) => setFormData({ ...formData, universe: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">Current Arc / Chapter</label>
              <input
                type="text"
                value={formData.currentEra || ''}
                onChange={(e) => setFormData({ ...formData, currentEra: e.target.value })}
                placeholder="e.g. Chapter 1: The Journey Begins"
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">In-Game Date</label>
              <input
                type="text"
                value={formData.inGameDate || ''}
                onChange={(e) => setFormData({ ...formData, inGameDate: e.target.value })}
                placeholder="e.g. Year 1, Mid-Autumn"
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">Time of Day</label>
              <input
                type="text"
                value={formData.timeOfDay || ''}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                placeholder="e.g. 09:00 AM - Morning"
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">Current Location</label>
              <input
                type="text"
                value={formData.currentLocation || ''}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-300/80 font-mono">Weather / Atmosphere</label>
              <input
                type="text"
                value={formData.weather || ''}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        ) : (
          /* Live Indicators Glass Card (Matching concept art) */
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-[#0d122b]/80 to-slate-950/90 border border-purple-500/20 shadow-lg overflow-hidden group">
            {/* Background subtle art glow */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              {/* Universe */}
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-purple-300/70 font-mono uppercase tracking-wider block">Universe</span>
                  <p className="text-xs font-bold text-slate-100 leading-snug break-words" title={worldState?.universe}>
                    {worldState?.universe || 'Custom Anime Realm'}
                  </p>
                </div>
              </div>

              {/* Current Arc / Chapter */}
              <div className="flex items-start gap-3 pt-2 border-t border-purple-500/10">
                <BookOpen className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-cyan-300/70 font-mono uppercase tracking-wider block">Current Arc / Chapter</span>
                  <p className="text-xs font-semibold text-slate-100 leading-snug break-words" title={worldState?.currentEra}>
                    {worldState?.currentEra || 'Chapter 1: The Journey Begins'}
                  </p>
                </div>
              </div>

              {/* Date & Time (Accurate & Non-truncated) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-purple-500/10">
                <div className="flex items-start gap-2 min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-amber-300/70 font-mono uppercase block font-semibold">Date</span>
                    <p className="text-xs font-medium text-slate-100 leading-snug break-words" title={worldState?.inGameDate}>
                      {worldState?.inGameDate || 'Year 1, Mid-Autumn'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-amber-300/70 font-mono uppercase block font-semibold">Time</span>
                    <p className="text-xs font-medium text-slate-100 leading-snug break-words" title={worldState?.timeOfDay}>
                      {worldState?.timeOfDay || '09:00 AM - Morning'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 pt-2 border-t border-purple-500/10">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-emerald-300/70 font-mono uppercase tracking-wider block">Location</span>
                  <p className="text-xs font-semibold text-slate-100 leading-snug break-words" title={worldState?.currentLocation}>
                    {worldState?.currentLocation || 'Unknown Boundary'}
                  </p>
                </div>
              </div>

              {/* Atmosphere */}
              <div className="flex items-start gap-3 pt-2 border-t border-purple-500/10">
                <CloudSun className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-blue-300/70 font-mono uppercase tracking-wider block">Atmosphere</span>
                  <p className="text-xs text-slate-300 leading-snug break-words" title={worldState?.weather}>
                    {worldState?.weather || 'Atmospheric calm'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Helper function to render an NPC card */}
        {(() => {
          const renderNPCCard = (npc, idx, isFromActiveSection) => {
            const dotColor = idx === 0 ? 'bg-emerald-400' : idx === 1 ? 'bg-cyan-400' : 'bg-purple-400';
            const affinityVal = typeof npc.affinity === 'number' ? npc.affinity : 50;
            const aff = getAffinityDetails(affinityVal, npc.bondTier);
            const AffinityIcon = aff.icon;
            const isNearby = isNpcActive(npc);

            return (
              <div
                key={npc.name || idx}
                className="p-3 rounded-2xl bg-gradient-to-r from-slate-900/90 to-purple-950/30 border border-purple-500/20 hover:border-purple-400/50 transition-all flex flex-col gap-2.5 shadow-sm group"
              >
                <div className="flex items-start gap-3">
                  <AvatarImage
                    speaker={npc.name}
                    universe={worldState?.universe}
                    size="md"
                    className="mt-0.5 rounded-xl border border-purple-500/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${isNearby ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'} shrink-0`} />
                        <h4 className="text-xs font-bold text-slate-100 break-words">{npc.name}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNPCPresence(npc.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[9.5px] font-mono text-slate-400 hover:text-purple-300 hover:bg-purple-900/40 border border-purple-500/20 transition-all"
                          title={isNearby ? "Mark as Elsewhere / Away" : "Mark as Nearby in Current Scene"}
                        >
                          {isNearby ? "Set Away" : "Set Nearby"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNPC(npc.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                          title={`Remove ${npc.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {isNearby ? (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <MapPin className="w-2.5 h-2.5" /> Nearby
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-400 border border-slate-700/40 flex items-center gap-1 shrink-0">
                          <Globe className="w-2.5 h-2.5" /> Elsewhere
                        </span>
                      )}
                      {npc.relation && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-900/80 text-purple-300/90 border border-purple-800/40 leading-snug break-words">
                          {npc.relation}
                        </span>
                      )}
                    </div>

                    {/* Full, non-truncated status description */}
                    {npc.status && (
                      <div className="mt-1.5 p-2 rounded-xl bg-purple-950/50 border border-purple-500/20 text-[10.5px] text-purple-200 leading-relaxed font-sans break-words">
                        {npc.status}
                      </div>
                    )}
                  </div>
                </div>

                {/* NPC Affinity & Relationship Matrix */}
                <div className="pt-2 border-t border-purple-500/15">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AffinityIcon className={`w-3.5 h-3.5 ${aff.iconColor} shrink-0`} />
                      <span className={`text-[10.5px] font-semibold break-words ${aff.color}`}>{aff.tier}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-300 shrink-0 ml-1">
                      {affinityVal}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-purple-500/10 p-[1px]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${aff.barGrad} transition-all duration-300`}
                      style={{ width: `${affinityVal}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-2.5">
              {/* Section 1: Active NPCs Around You (Current Scene) */}
              <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveNpcsExpanded(!activeNpcsExpanded)}
                  className="w-full p-3 flex items-center justify-between bg-purple-950/30 hover:bg-purple-950/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {activeNPCs.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-purple-200 font-display block">
                        ACTIVE NPCS IN SCENE ({activeNPCs.length})
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400/90 block">
                        {activeNPCs.length > 0
                          ? `${activeNPCs.length} present around you now`
                          : 'None in current room/vicinity'}
                      </span>
                    </div>
                  </div>
                  {activeNpcsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  )}
                </button>

                {activeNpcsExpanded && (
                  <div className="p-3 border-t border-purple-500/15 space-y-2.5 bg-slate-950/40">
                    {activeNPCs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                        No active figures in your immediate presence.
                      </p>
                    ) : (
                      activeNPCs.map((npc, idx) => renderNPCCard(npc, idx, true))
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Total Encountered NPCs (World Directory) */}
              <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 overflow-hidden shadow-sm">
                <button
                  onClick={() => setEncounteredNpcsExpanded(!encounteredNpcsExpanded)}
                  className="w-full p-3 flex items-center justify-between bg-purple-950/30 hover:bg-purple-950/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-purple-200 font-display block">
                        TOTAL ENCOUNTERED NPCS ({allEncounteredNPCs.length})
                      </span>
                      <span className="text-[10px] font-mono text-purple-400/80 block">
                        World Character & Affinity Directory
                      </span>
                    </div>
                  </div>
                  {encounteredNpcsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-purple-400" />
                  )}
                </button>

                {encounteredNpcsExpanded && (
                  <div className="p-3 border-t border-purple-500/15 space-y-2.5 bg-slate-950/40">
                    {allEncounteredNPCs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                        No characters encountered yet in this chronicle.
                      </p>
                    ) : (
                      allEncounteredNPCs.map((npc, idx) => renderNPCCard(npc, idx, false))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Collapsible Tab: Compressed Rolling World Summary */}
        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 overflow-hidden shadow-sm">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full p-3 flex items-center justify-between bg-purple-950/30 hover:bg-purple-950/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-purple-200 font-display block">
                  ROLLING WORLD SUMMARY
                </span>
                <span className="text-[10px] font-mono text-purple-400/80 block">
                  {summarizedUserTurns > 0
                    ? `Turns 1–${summarizedUserTurns} compacted • ${pendingUserTurns}/10 turns toward Ch. ${Math.floor(summarizedUserTurns / 10) + 1}`
                    : `Turn ${totalUserTurns} • ${pendingUserTurns}/10 turns toward Chapter 1`}
                </span>
              </div>
            </div>
            {summaryExpanded ? (
              <ChevronUp className="w-4 h-4 text-purple-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {summaryExpanded && (
            <div className="p-3.5 border-t border-purple-500/15 text-xs text-slate-300 leading-relaxed font-serif bg-slate-950/60 max-h-56 overflow-y-auto space-y-2">
              {rollingSummary && rollingSummary.trim() ? (
                <p className="italic text-slate-300/90 whitespace-pre-wrap">{rollingSummary}</p>
              ) : (
                <p className="text-slate-500 italic">
                  Chronicle is fresh. Rolling compaction triggers automatically every 10 player turns.
                </p>
              )}

              <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-[10px] font-mono text-purple-400/80">
                <span>Compaction Cadence</span>
                <span className="text-purple-300 font-semibold">Every 10 player turns</span>
              </div>
            </div>
          )}
        </div>

        {/* Chrono-Memories & Permanent Data Injection */}
        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 overflow-hidden shadow-sm">
          <button
            onClick={() => setMemoriesExpanded(!memoriesExpanded)}
            className="w-full p-3 flex items-center justify-between bg-cyan-950/30 hover:bg-cyan-950/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-200 font-display">
                CHRONO-MEMORIES ({pinnedMemories.length})
              </span>
            </div>
            {memoriesExpanded ? (
              <ChevronUp className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {memoriesExpanded && (
            <div className="p-3.5 border-t border-purple-500/15 text-xs bg-slate-950/60 space-y-2.5">
              <p className="text-[11px] text-slate-400 leading-tight">
                Permanent facts injected into every prompt so NPCs remember events from 50+ turns ago:
              </p>

              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Rem promised to guard the seal..."
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                >
                  Pin
                </button>
              </form>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {pinnedMemories.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No pinned memories yet.</p>
                ) : (
                  pinnedMemories.map((mem, mIdx) => (
                    <div
                      key={mIdx}
                      className="p-2 rounded-lg bg-slate-900 border border-cyan-500/20 text-[11px] text-slate-200 flex items-start justify-between gap-2"
                    >
                      <span className="flex-1 leading-snug">📌 {mem}</span>
                      <button
                        onClick={() => onDeletePinnedMemory(mIdx)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Remove memory"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  </>
  );
}
