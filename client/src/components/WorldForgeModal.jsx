import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Clock,
  MapPin,
  Search,
  Check,
  X,
  ArrowLeft,
  Info,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  FileCode,
  RotateCcw,
  Edit3,
  RefreshCw,
  User,
  Plus,
  Key,
} from 'lucide-react';
import AvatarImage from './AvatarImage.jsx';
import { getActiveProvider, getStoredApiKeys, getStoredModels } from '../utils/storage.js';
import { getStoredPersonas, getActivePersona, saveActivePersonaId } from '../utils/personaStorage.js';

export function getGoldStandardTemplate(worldName = 'this anime') {
  return `<role>
You are an immersive simulation engine for the ${worldName} anime verse. You control the world, NPCs, environment, and narrative flow. 
**CRITICAL:** You NEVER control, speak for, or decide actions/thoughts/dialogue for {{user}}. {{user}} is a participant, not the protagonist. The world moves independently of {{user}}.
</role>
<rules>
1. **Turn Selection:** Choose the narrative focus according to the current scene's needs. Introduce new characters or major events only when they make sense within the established situation. Never manufacture drama merely to keep the story exciting.
2. **No Railroading:** Outcomes depend on {{user}}'s choices AND NPC agency. NPCs can change the plot. Never invent {{user}}'s actions/feelings.
3. **Perspective:** Third-person limited/cinematic. NPCs only know what they’ve experienced/witnessed. No meta-knowledge.
4. **World Logic:** Adhere strictly to the anime’s tone, magic system, and social norms. Actions have lasting consequences (wounds, reputation, rumors). Mundane moments are valid.
5. **Narrative Style:** Sensory, focused, no filler. Specific physical details for characters. Consistent voices/mannerisms. NPCs may use crude language if fitting.
6. **Canon Fidelity:** Preserve each canon character's established appearance, personality, speech patterns, mannerisms, motivations, relationships, magical abilities, and knowledge. Character development is permitted, but must emerge gradually from believable events.
</rules>

<npc_behaviour>
- Fully realized agents with goals, biases, and memories.
- Politeness/cooperation must be earned. NPCs can ignore, insult, flirt, refuse, or attack based on context.
- Random NPCs can initiate organic interactions when it suits the scene.
- NPCs remember past events with {{user}} and evolve offscreen.
</npc_behaviour>

<Intimacy>
- Develops through earned tension, history, and compatibility. Never default.
- In intimate/ecchi scenes: Be erotic, sensual, and explicit . Describe beauty, curves, shape of ass of female characters.
-During Sex Scenes , describe sound effects , exchange of dialogues . Match explicitness to the moment. Crafting peak erotica and smut.
</intimacy>

<continuity>
- Keep the narrative flow organic. Introduce unexpected elements , characters or encounters only if necessary.
- in Sexual Scenes , No need to introduce unexpected interruptions.
- Re-read the entire chat history before responding to maintain continuity.
</continuity>`;
}

export default function WorldForgeModal({ isOpen, onClose, onForgeRealm, onOpenPersonaModal, onOpenKeyManager }) {
  const [step, setStep] = useState('select'); // 'select' | 'briefing'
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [presetSearch, setPresetSearch] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active key state for status badge
  const activeProvider = getActiveProvider();
  const apiKeys = getStoredApiKeys();
  const hasKey = Boolean(apiKeys[activeProvider]?.trim());

  // Custom universe inputs
  const [customUniverseTitle, setCustomUniverseTitle] = useState('');
  const [customBriefingLoading, setCustomBriefingLoading] = useState(false);
  const [customBriefingError, setCustomBriefingError] = useState('');

  // Briefing & Setup choices
  const [chosenTimeline, setChosenTimeline] = useState(null);
  const [scenarioPrompt, setScenarioPrompt] = useState('');
  const [scenarioLocation, setScenarioLocation] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [characterConcept, setCharacterConcept] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showLoreDetails, setShowLoreDetails] = useState(false);

  // Saved Persona selector
  const [savedPersonas, setSavedPersonas] = useState(getStoredPersonas());
  const [selectedPersonaId, setSelectedPersonaId] = useState(getActivePersona().id);

  // Internal AI Lore Verification state
  const [loreVerification, setLoreVerification] = useState({
    loading: false,
    verified: false,
    response: '',
    error: '',
  });

  const [loading, setLoading] = useState(false);

  // Fetch / Shuffle fresh anime presets dynamically
  const fetchPresets = async () => {
    setPresetsLoading(true);
    try {
      const res = await fetch(`/api/sessions/presets?refresh=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPresets(data);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setPresetsLoading(false);
    }
  };

  useEffect(() => {
    const syncPersonas = () => {
      const allPersonas = getStoredPersonas();
      setSavedPersonas(allPersonas);
      const activeP = getActivePersona();
      if (activeP) {
        setSelectedPersonaId(activeP.id);
        setCharacterName(activeP.name);
        setCharacterConcept(activeP.traits);
      }
    };

    if (isOpen) {
      setStep('select');
      setIsCustomMode(false);
      setCustomBriefingError('');
      setCustomUniverseTitle('');
      setShowSystemPrompt(false);
      syncPersonas();
      fetchPresets();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('persona_storage_updated', syncPersonas);
      return () => window.removeEventListener('persona_storage_updated', syncPersonas);
    }
  }, [isOpen]);

  // Run lore verification for chosen world
  const executeLoreVerification = async (worldTitle) => {
    const worldName = (worldTitle || '').trim();
    if (!worldName) return;

    setLoreVerification({ loading: true, verified: false, response: '', error: '' });

    const provider = getActiveProvider();
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const apiKey = apiKeys[provider] || '';
    const model = models[provider] || '';

    try {
      const res = await fetch('/api/models/verify-lore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': provider,
          'x-model': model,
        },
        body: JSON.stringify({
          universe: worldName,
          provider,
          apiKey,
          model,
        }),
      });

      let data = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        data = null;
      }

      if (res.ok && data?.success) {
        setLoreVerification({
          loading: false,
          verified: data.verified ?? true,
          response: typeof data.response === 'string' ? data.response : 'Proof of canon knowledge generated successfully.',
          error: '',
        });
      } else {
        setLoreVerification({
          loading: false,
          verified: false,
          response: typeof data?.response === 'string' ? data.response : `Please connect an API key in Settings to run the live AI canon audit for ${worldName}.`,
          error: typeof data?.message === 'string' ? data.message : '',
        });
      }
    } catch (err) {
      setLoreVerification({
        loading: false,
        verified: false,
        response: `Unable to verify AI lore: ${err.message}`,
        error: err.message,
      });
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setIsCustomMode(false);
    setChosenTimeline(preset.timelines?.[0] || null);

    // Scenario Start is NOT AI-generated — user enters raw prompt
    setScenarioPrompt('');
    setScenarioLocation(preset.currentLocation || `${preset.universe} Outskirts`);
    setCharacterName(preset.userProfile?.name || 'Kaelen Valerius');
    setCharacterConcept(preset.userProfile?.traits || 'Perceptive sovereign');

    // Populate Gold Standard System Instructions replacing {World}
    const goldStandard = getGoldStandardTemplate(preset.universe);
    setSystemInstructions(goldStandard);

    setStep('briefing');
    executeLoreVerification(preset.universe);
  };

  /**
   * For CUSTOM worlds: call AI briefing endpoint which uses LLM to
   * generate factual synopsis and sequential anime timeline arcs (NO scenario hooks).
   */
  const handleSelectCustom = async (e) => {
    e.preventDefault();
    const title = customUniverseTitle.trim();
    if (!title) return;

    setCustomBriefingError('');
    setCustomBriefingLoading(true);

    const provider = getActiveProvider();
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const apiKey = apiKeys[provider] || '';
    const model = models[provider] || '';

    try {
      const res = await fetch('/api/sessions/custom-briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-provider': provider,
          'x-model': model,
        },
        body: JSON.stringify({ universeTitle: title }),
      });

      let data = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        data = null;
      }

      // 1. Build bulletproof normalized synopsis
      let synopsisText = `The canonical world of ${title}. Step through the boundary into this realm and carve your own path.`;
      if (data && typeof data.synopsis === 'string' && data.synopsis.trim()) {
        synopsisText = data.synopsis.trim();
      } else if (data && typeof data.synopsis === 'object' && data.synopsis !== null) {
        synopsisText = Object.values(data.synopsis).filter((v) => typeof v === 'string').join(' ') || synopsisText;
      }

      // 2. Build bulletproof normalized timelines (Current Arc / Chapter)
      let timelines = [
        { id: 'arc1', label: 'Chapter 1: The Journey Begins', era: 'Chapter 1: The Journey Begins', date: 'Year 1, Mid-Autumn' },
        { id: 'arc2', label: 'Chapter 2: Escalating Shadows', era: 'Chapter 2: Escalating Shadows', date: 'Year 2, Winter' },
        { id: 'arc3', label: 'Chapter 3: Climax & Clashes', era: 'Chapter 3: Climax & Clashes', date: 'Year 3, Spring' },
      ];

      if (data && Array.isArray(data.timelines) && data.timelines.length > 0) {
        timelines = data.timelines.map((tl, idx) => {
          if (typeof tl === 'string') {
            return {
              id: `arc_${idx + 1}`,
              label: tl,
              era: tl,
              date: `Chapter ${idx + 1}`,
            };
          }
          return {
            id: tl?.id || `arc_${idx + 1}`,
            label: typeof tl?.label === 'string' ? tl.label : (typeof tl?.era === 'string' ? tl.era : `Chapter ${idx + 1}: The Beginning`),
            era: typeof tl?.era === 'string' ? tl.era : (typeof tl?.label === 'string' ? tl.label : `Chapter ${idx + 1}`),
            date: typeof tl?.date === 'string' ? tl.date : 'Timeline Year 1',
          };
        });
      }

      // 3. Build bulletproof normalized knownNPCs
      let knownNPCs = [];
      if (data && Array.isArray(data.knownNPCs)) {
        knownNPCs = data.knownNPCs.map((npc, idx) => {
          if (typeof npc === 'string') {
            return { name: npc, relation: 'Canon Figure', status: 'Active in area' };
          }
          return {
            name: typeof npc?.name === 'string' ? npc.name : `Character ${idx + 1}`,
            relation: typeof npc?.relation === 'string' ? npc.relation : 'Resident',
            status: typeof npc?.status === 'string' ? npc.status : 'Present in sector',
          };
        });
      }

      const aiPreset = {
        id: 'custom',
        universe: title,
        title: `${title}: Genesis Chronicle`,
        synopsis: synopsisText,
        timelines,
        knownNPCs,
      };

      setIsCustomMode(true);
      setSelectedPreset(aiPreset);
      setChosenTimeline(timelines[0]);
      setScenarioPrompt('');
      setScenarioLocation(`${title} Outskirts`);
      setCharacterName('Kaelen Valerius');
      setCharacterConcept('Wielder of the Void Singularity, tactical sovereign');
      setSystemInstructions(getGoldStandardTemplate(title));
      setStep('briefing');

      if (!res.ok || !data) {
        const errorMsg = data?.message || data?.error || 'Ready to forge world. You can provide your scenario opening.';
        setCustomBriefingError(typeof errorMsg === 'string' ? errorMsg : 'Custom realm template initialized.');
      }

      executeLoreVerification(title);
    } catch (err) {
      console.warn('Custom briefing fallback:', err);
      // Even on unhandled exception, NEVER crash the screen! Create fallback preset and move to briefing
      const fallbackPreset = {
        id: 'custom',
        universe: title,
        title: `${title}: Genesis Chronicle`,
        synopsis: `The world of ${title}. You are ready to step through the boundary and forge your adventure.`,
        timelines: [
          { id: 'arc1', label: 'Chapter 1: The Journey Begins', era: 'Chapter 1: The Journey Begins', date: 'Year 1, Mid-Autumn' },
          { id: 'arc2', label: 'Chapter 2: Escalating Shadows', era: 'Chapter 2: Escalating Shadows', date: 'Year 2, Winter' },
          { id: 'arc3', label: 'Chapter 3: Climax & Clashes', era: 'Chapter 3: Climax & Clashes', date: 'Year 3, Spring' },
        ],
        knownNPCs: [],
      };
      setIsCustomMode(true);
      setSelectedPreset(fallbackPreset);
      setChosenTimeline(fallbackPreset.timelines[0]);
      setScenarioPrompt('');
      setScenarioLocation(`${title} Outskirts`);
      setSystemInstructions(getGoldStandardTemplate(title));
      setStep('briefing');
      setCustomBriefingError('Ready to forge world. Provide your opening scene prompt to begin.');
    } finally {
      setCustomBriefingLoading(false);
    }
  };

  const handleConfirmAndSpawn = async () => {
    setLoading(true);
    try {
      const activeLocation = (scenarioLocation || '').trim() || `${selectedPreset?.universe} Horizon`;
      const activePrompt = (scenarioPrompt || '').trim() || `I step through the dimensional boundary and materialize into ${activeLocation}.`;

      const currentPersona = savedPersonas.find((p) => p.id === selectedPersonaId) || savedPersonas[0];
      const userProfile = {
        name: currentPersona?.name || characterName || 'Protagonist',
        avatar: currentPersona?.avatar || '',
        gender: currentPersona?.gender || 'Male',
        physique: currentPersona?.physique || 'Athletic silhouette, combat attire',
        traits: currentPersona?.traits || characterConcept || 'Resolute, perceptive',
        details: currentPersona?.details || 'Dimensional traveler awakened in this verse.',
      };
      const movesetKnowledge = currentPersona?.movesetKnowledge || '[]';

      const payload = isCustomMode
        ? {
            customWorld: { universeTitle: selectedPreset?.universe || customUniverseTitle },
            chosenTimeline: chosenTimeline || { era: 'Prologue Era', label: 'Prologue Era' },
            chosenScenario: {
              id: 'custom_user_scenario',
              label: 'User Opening Scenario',
              location: activeLocation,
              weather: 'Atmospheric clarity',
              prompt: activePrompt,
            },
            characterName: userProfile.name,
            characterConcept: userProfile.traits,
            userProfile,
            movesetKnowledge,
            systemInstructions: systemInstructions.trim(),
          }
        : {
            presetId: selectedPreset?.id,
            chosenTimeline: chosenTimeline || { era: 'Prologue Era', label: 'Prologue Era' },
            chosenScenario: {
              id: 'user_scenario',
              label: 'User Opening Scenario',
              location: activeLocation,
              weather: 'Atmospheric clarity',
              prompt: activePrompt,
            },
            characterName: userProfile.name,
            characterConcept: userProfile.traits,
            userProfile,
            movesetKnowledge,
            systemInstructions: systemInstructions.trim(),
          };

      await onForgeRealm(payload);
      onClose();
    } catch (err) {
      alert(`Failed to enter world: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const safePresets = Array.isArray(presets) ? presets : [];
  const filteredPresets = safePresets.filter(
    (p) =>
      p?.universe?.toLowerCase()?.includes((presetSearch || '').toLowerCase()) ||
      p?.title?.toLowerCase()?.includes((presetSearch || '').toLowerCase())
  );

  const internalLorePrompt = `Before we start the roleplay , How familiar you are with This ${selectedPreset?.universe || 'chosen'} verse world lore , characters , character appearances , threats and everything for a text based roleplay . i want proof that you have detailed knowledge of the verse because i am serious for this roleplay.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-text">
      <div className="relative w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col rounded-none sm:rounded-3xl bg-[#080b1f]/98 border-0 sm:border border-purple-500/25 shadow-2xl shadow-black/90 overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-white/[0.07] bg-gradient-to-r from-purple-950/50 via-[#080b1f] to-cyan-950/30 flex items-center justify-between shrink-0 pt-safe">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {step === 'briefing' ? (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center shrink-0 text-slate-300 hover:text-white transition-colors active:scale-95"
                title="Back to Universe Selection"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-900/50 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse-slow" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-slate-100 font-display tracking-widest uppercase truncate">
                {step === 'select'
                  ? 'REALM GATEWAY // SELECT UNIVERSE'
                  : `WORLD BRIEFING // ${selectedPreset?.universe}`}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-purple-300/70 font-mono truncate">
                {step === 'select'
                  ? 'Pick a world preset or enter your custom universe'
                  : 'Review world briefing & choose starting timeline'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* ─── STEP 1: SELECT UNIVERSE ─── */}
          {step === 'select' && (
            <div className="space-y-3.5 sm:space-y-5">
              {/* Mobile Quick Setup Strip: OC & API Keys */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/10 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase hidden xs:inline">OC:</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenPersonaModal) onOpenPersonaModal();
                    }}
                    className="text-cyan-300 font-bold text-xs hover:underline flex items-center gap-1.5 bg-cyan-950/70 px-2.5 py-1 rounded-lg border border-cyan-500/35 truncate active:scale-95 shadow-sm"
                    title="Setup Protagonist Persona & OC Moves"
                  >
                    <AvatarImage
                      src={getActivePersona()?.avatar}
                      speaker={getActivePersona()?.name || 'Protagonist OC'}
                      universe="General Anime"
                      size="sm"
                      className="w-4 h-4 rounded-full object-cover shrink-0 border border-cyan-400/50"
                    />
                    <span className="truncate">{getActivePersona().name || 'Protagonist OC'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenKeyManager) onOpenKeyManager();
                  }}
                  className={`text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                    hasKey
                      ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/70 border-amber-500/40 text-amber-300 animate-pulse'
                  }`}
                  title="Configure API Keys & AI Models"
                >
                  <Key className="w-3 h-3" />
                  <span>{hasKey ? 'Key: Connected' : 'Setup API Key'}</span>
                </button>
              </div>

              {/* Custom Universe Input */}
              <form onSubmit={handleSelectCustom} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-purple-500/20 space-y-2.5 shadow-inner">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase font-semibold block mb-1">
                    Enter ANY Anime / LN / Movie / Series / Game
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Chainsaw Man, Mushoku Tensei, Re:Zero, Elden Ring…"
                      value={customUniverseTitle}
                      onChange={(e) => {
                        setCustomUniverseTitle(e.target.value);
                        setCustomBriefingError('');
                      }}
                      className="flex-1 min-w-0 bg-black/50 border border-purple-500/25 rounded-xl px-3 py-2.5 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!customUniverseTitle.trim() || customBriefingLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shrink-0 active:scale-95 touch-manipulation"
                    >
                      {customBriefingLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Briefing…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Brief World</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error / Warning Banner */}
                {customBriefingError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[10px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{customBriefingError}</span>
                  </div>
                )}
              </form>

              {/* Dynamic Presets Header with Refresh / Discover Button */}
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] sm:text-xs font-mono uppercase font-bold text-purple-300 tracking-wider">
                    Popular Universes ({presets.length})
                  </span>
                  <button
                    type="button"
                    onClick={fetchPresets}
                    disabled={presetsLoading}
                    title="Shuffle and discover new anime worlds"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-cyan-300 border border-cyan-500/30 transition-all active:scale-95"
                  >
                    <RefreshCw className={`w-3 h-3 ${presetsLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">Shuffle</span>
                  </button>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter worlds…"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-purple-500/20 rounded-xl pl-8 pr-3 py-2.5 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Presets Grid (Sleek mobile list, responsive desktop grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-purple-500/15 hover:border-cyan-400/50 cursor-pointer transition-all flex sm:flex-col justify-between items-center sm:items-stretch gap-2.5 sm:gap-0 group shadow-lg shadow-black/40 hover:scale-[1.01] sm:hover:scale-[1.02] active:scale-95 touch-manipulation"
                  >
                    <div className="flex sm:block items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between sm:mb-1.5 shrink-0">
                        <AvatarImage
                          speaker={preset.knownNPCs?.[0]?.name || preset.universe}
                          universe={preset.universe}
                          size="md"
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0"
                        />
                        <span className="hidden sm:inline-block text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/30">
                          Canon
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:hidden mb-0.5">
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/30">
                            Canon
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {preset.knownNPCs?.length || 3} Cast
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-tight truncate">
                          {preset.universe}
                        </h4>
                        <p className="text-[10px] text-purple-300/70 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                          {preset.title}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 sm:pt-2 sm:mt-2 sm:border-t sm:border-white/[0.05] flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 font-mono">
                      <span className="hidden sm:inline">{preset.knownNPCs?.length || 3} Cast</span>
                      <span className="text-xs font-bold px-2 py-1 sm:p-0 rounded-lg bg-cyan-950/50 sm:bg-transparent border border-cyan-500/30 sm:border-none text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                        Select →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: WORLD BRIEFING, TIMELINE & RAW SCENARIO START ─── */}
          {step === 'briefing' && selectedPreset && (
            <div className="space-y-4 sm:space-y-5 animate-fade-in pb-4">
              {/* World Briefing Card */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-purple-950/30 to-slate-900/80 border border-purple-500/25 space-y-2 shadow-xl">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    CANON WORLD SYNOPSIS &amp; LORE MATRIX
                  </span>
                  {isCustomMode && (
                    <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                      AI-Generated
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 font-display">{selectedPreset.universe}</h3>
                <p className="text-[11px] sm:text-[12px] text-slate-300 leading-relaxed font-sans">{selectedPreset.synopsis}</p>
              </div>

              {/* Internal AI Lore Knowledge Proof & Audit Check (Collapsible Accordion on Mobile) */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 border border-cyan-500/25 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 truncate">
                      AI Canon Lore Mastery Proof
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoreDetails(!showLoreDetails)}
                    className="text-[10px] font-mono text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.05] border border-cyan-500/30 transition-colors shrink-0"
                  >
                    {showLoreDetails ? 'Hide Audit' : 'View Audit'}
                  </button>
                </div>

                {showLoreDetails && (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.07] flex items-start gap-2">
                      <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div className="text-[10px] sm:text-[11px] font-mono text-purple-300/90 leading-relaxed">
                        <span className="text-slate-500 uppercase text-[9px] block mb-0.5">INTERNAL AUDIT PROMPT:</span>
                        "{internalLorePrompt}"
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 max-h-48 overflow-y-auto">
                      {loreVerification.loading ? (
                        <div className="flex items-center gap-2 text-xs text-cyan-300/80 py-2 font-mono">
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                          <span>Auditing AI familiarity with {selectedPreset.universe} canon lore…</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                            <Check className="w-3.5 h-3.5" />
                            <span>Live AI Proof of Lore Mastery</span>
                          </div>
                          <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text">
                            {loreVerification.response}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Choose Starting Timeline / Chronological Arcs */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Choose Starting Timeline / Arc</span>
                </label>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedPreset.timelines?.map((tl) => {
                    const isSel = chosenTimeline?.id === tl.id;
                    return (
                      <div
                        key={tl.id}
                        onClick={() => setChosenTimeline(tl)}
                        className={`p-3 sm:p-3 rounded-xl border cursor-pointer transition-all text-xs touch-manipulation ${
                          isSel
                            ? 'bg-purple-950/80 border-purple-400/70 text-purple-200 shadow-md ring-1 ring-purple-400/40'
                            : 'bg-white/[0.03] border-white/[0.07] text-slate-300 hover:border-purple-500/40'
                        }`}
                      >
                        <span className="font-bold block mb-0.5 leading-snug">{tl.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{tl.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scenario Start (User Raw Prompt) */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-cyan-500/25 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 uppercase font-bold tracking-wider">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Scenario Start</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    Your Opening Move
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Starting Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={scenarioLocation}
                    onChange={(e) => setScenarioLocation(e.target.value)}
                    placeholder="e.g. Jura Forest Outskirts, Tokyo Shibuya..."
                    className="w-full bg-black/40 border border-purple-500/25 rounded-xl px-3 py-3 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Opening Actions / Situation
                  </label>
                  <textarea
                    rows={3}
                    value={scenarioPrompt}
                    onChange={(e) => setScenarioPrompt(e.target.value)}
                    placeholder="Describe your opening scene or first actions..."
                    className="w-full bg-black/50 border border-cyan-500/30 rounded-xl p-3 text-base sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed transition-colors placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Gold Standard System Instructions Accordion */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-purple-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                      Director Instructions
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="text-[10px] font-mono text-purple-300 hover:text-white px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] transition-colors"
                  >
                    {showSystemPrompt ? 'Hide' : 'Edit'}
                  </button>
                </div>

                {showSystemPrompt && (
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      rows={6}
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-3 text-sm text-purple-200 font-mono focus:outline-none focus:border-cyan-400 resize-y leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Protagonist Persona Selector */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-cyan-500/25 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Protagonist Persona (OC)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {onOpenKeyManager && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenKeyManager();
                        }}
                        className="text-[10px] font-mono text-purple-300 hover:text-white flex items-center gap-1 transition-colors font-semibold px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 active:scale-95"
                        title="Configure API Keys & Models"
                      >
                        <Key className="w-3 h-3 text-purple-400" />
                        <span>Keys</span>
                      </button>
                    )}
                    {onOpenPersonaModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPersonaModal();
                        }}
                        className="text-[10px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 transition-colors font-semibold px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 active:scale-95"
                        title="Create or edit your custom OC"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Custom OC</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedPersonas.map((p) => {
                    const isSel = p.id === selectedPersonaId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPersonaId(p.id);
                          saveActivePersonaId(p.id);
                          setCharacterName(p.name);
                          setCharacterConcept(p.traits);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSel
                            ? 'bg-cyan-950/60 border-cyan-400 text-slate-100 ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                            : 'bg-black/40 border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
                        }`}
                      >
                        <AvatarImage
                          src={p.avatar}
                          speaker={p.name}
                          universe="General Anime"
                          size="sm"
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold truncate font-display">{p.name}</h5>
                            {isSel && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.traits}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer (When in Briefing Step) */}
        {step === 'briefing' && selectedPreset && (
          <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#070a1a]/98 backdrop-blur-xl shrink-0 flex items-center justify-between gap-3 pb-safe z-30">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirmAndSpawn}
              className="flex-1 sm:flex-initial px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entering Realm…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✧ Enter {selectedPreset.universe}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
