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
} from 'lucide-react';
import AvatarImage from './AvatarImage.jsx';
import { getActiveProvider, getStoredApiKeys, getStoredModels } from '../utils/storage.js';
import { getStoredPersonas, getActivePersona } from '../utils/personaStorage.js';

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

export default function WorldForgeModal({ isOpen, onClose, onForgeRealm, onOpenPersonaModal }) {
  const [step, setStep] = useState('select'); // 'select' | 'briefing'
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [presetSearch, setPresetSearch] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

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
    if (isOpen) {
      setStep('select');
      setIsCustomMode(false);
      setCustomBriefingError('');
      setCustomUniverseTitle('');
      setShowSystemPrompt(false);
      const allPersonas = getStoredPersonas();
      setSavedPersonas(allPersonas);
      const activeP = getActivePersona();
      setSelectedPersonaId(activeP?.id || allPersonas[0]?.id);
      setCharacterName(activeP?.name || 'Patrick Yokam');
      setCharacterConcept(activeP?.traits || 'Perceptive sovereign');
      fetchPresets();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-text">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080b1f]/97 border border-purple-500/25 shadow-2xl shadow-black/90 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.07] bg-gradient-to-r from-purple-950/50 via-[#080b1f] to-cyan-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-900/50 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-white animate-pulse-slow" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 font-display tracking-widest uppercase">
                {step === 'select'
                  ? 'REALM GATEWAY // SELECT UNIVERSE'
                  : `WORLD BRIEFING // ${selectedPreset?.universe}`}
              </h2>
              <p className="text-[11px] text-purple-300/70 font-mono">
                {step === 'select'
                  ? 'Discover popular canon worlds or enter any custom universe to begin'
                  : 'Review world briefing, choose timeline arc & provide your raw scenario start prompt'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ─── STEP 1: SELECT UNIVERSE ─── */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Custom Universe Input */}
              <form onSubmit={handleSelectCustom} className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/20 space-y-3 shadow-inner">
                <div>
                  <label className="text-[11px] font-mono text-cyan-300 uppercase font-semibold block mb-1.5">
                    Enter ANY Anime / Light Novel / Movie / Series / Game
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="e.g. Chainsaw Man, Mushoku Tensei, Re:Zero, Elden Ring, Dune…"
                      value={customUniverseTitle}
                      onChange={(e) => {
                        setCustomUniverseTitle(e.target.value);
                        setCustomBriefingError('');
                      }}
                      className="flex-1 bg-black/40 border border-purple-500/25 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!customUniverseTitle.trim() || customBriefingLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shrink-0"
                    >
                      {customBriefingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Briefing AI…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Brief World</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error / Warning Banner */}
                {customBriefingError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{customBriefingError}</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-mono">
                  💡 AI will generate a canon synopsis and sequential timeline arcs. Requires an API key connected in Samplers &amp; Moves.
                </p>
              </form>

              {/* Dynamic Presets Header with Refresh / Discover Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-bold text-purple-300 tracking-wider">
                    Popular Canon Universes ({presets.length})
                  </span>
                  <button
                    type="button"
                    onClick={fetchPresets}
                    disabled={presetsLoading}
                    title="Shuffle and discover new anime worlds"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105"
                  >
                    <RefreshCw className={`w-3 h-3 ${presetsLoading ? 'animate-spin' : ''}`} />
                    <span>Discover New Worlds</span>
                  </button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter worlds…"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-purple-500/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-purple-500/15 hover:border-cyan-400/50 cursor-pointer transition-all flex flex-col justify-between group shadow-lg shadow-black/40 hover:scale-[1.02]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <AvatarImage
                          speaker={preset.knownNPCs?.[0]?.name || preset.universe}
                          universe={preset.universe}
                          size="md"
                        />
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/30">
                          Canon
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-tight">
                        {preset.universe}
                      </h4>
                      <p className="text-[10px] text-purple-300/70 mt-1 line-clamp-2 leading-relaxed">
                        {preset.title}
                      </p>
                    </div>
                    <div className="pt-2.5 mt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{preset.knownNPCs?.length || 3} Cast</span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Select →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: WORLD BRIEFING, TIMELINE & RAW SCENARIO START ─── */}
          {step === 'briefing' && selectedPreset && (
            <div className="space-y-5 animate-fade-in">
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Universe Selection</span>
              </button>

              {/* World Briefing Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-purple-950/30 to-slate-900/80 border border-purple-500/25 space-y-2.5 shadow-xl">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    CANON WORLD SYNOPSIS &amp; LORE MATRIX
                  </span>
                  {isCustomMode && (
                    <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                      AI-Generated
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-100 font-display">{selectedPreset.universe}</h3>
                <p className="text-[12px] text-slate-300 leading-relaxed font-sans">{selectedPreset.synopsis}</p>

                {/* API key warning on briefing if custom mode was blocked */}
                {customBriefingError && customBriefingError.includes('API Key') && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/25 text-amber-300 text-[10px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Using generic template. Connect an API key for AI-generated synopsis.</span>
                  </div>
                )}
              </div>

              {/* Internal AI Lore Knowledge Proof & Audit Check */}
              <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/25 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      AI Canon Lore Mastery &amp; Knowledge Proof
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => executeLoreVerification(selectedPreset.universe)}
                    disabled={loreVerification.loading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className={`w-3 h-3 ${loreVerification.loading ? 'animate-spin' : ''}`} />
                    <span>Re-audit</span>
                  </button>
                </div>

                {/* The Internal Audit Command Prompt */}
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.07] flex items-start gap-2">
                  <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-mono text-purple-300/90 leading-relaxed">
                    <span className="text-slate-500 uppercase text-[9px] block mb-0.5">INTERNAL AUDIT PROMPT:</span>
                    "{internalLorePrompt}"
                  </div>
                </div>

                {/* Live AI Proof Response Output */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 max-h-56 overflow-y-auto">
                  {loreVerification.loading ? (
                    <div className="flex items-center gap-2.5 text-xs text-cyan-300/80 py-2 font-mono">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                      <span>Auditing AI familiarity with {selectedPreset.universe} canon lore, characters &amp; threats…</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
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

              {/* Choose Starting Timeline / Chronological Arcs */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Choose Starting Timeline / Anime Arcs (Sequential)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {selectedPreset.timelines?.map((tl) => {
                    const isSel = chosenTimeline?.id === tl.id;
                    return (
                      <div
                        key={tl.id}
                        onClick={() => setChosenTimeline(tl)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                          isSel
                            ? 'bg-purple-950/80 border-purple-400/70 text-purple-200 shadow-md ring-1 ring-purple-400/40'
                            : 'bg-white/[0.03] border-white/[0.07] text-slate-300 hover:border-purple-500/40'
                        }`}
                      >
                        <span className="font-bold block mb-1 leading-snug">{tl.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{tl.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scenario Start (User Raw Prompt - NOT AI Generated) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-cyan-500/25 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 uppercase font-bold tracking-wider">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Scenario Start (Your Raw Opening Prompt)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    User Creative Control
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Provide your raw opening scene or first actions. Not AI-generated — you decide how, where, and in what situation you begin your journey in <span className="text-cyan-300 font-semibold">{selectedPreset.universe}</span>.
                </p>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Starting Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={scenarioLocation}
                    onChange={(e) => setScenarioLocation(e.target.value)}
                    placeholder="e.g. Jura Forest Outskirts, Royal Capital Cobblestone Gates, Tokyo Shibuya..."
                    className="w-full bg-black/40 border border-purple-500/25 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Your Raw Opening Scenario / First Action
                  </label>
                  <textarea
                    rows={4}
                    value={scenarioPrompt}
                    onChange={(e) => setScenarioPrompt(e.target.value)}
                    placeholder="Describe your opening scenario, starting situation, or first actions to begin the roleplay..."
                    className="w-full bg-black/50 border border-cyan-500/30 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed transition-colors placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    💡 This exact prompt will be submitted as your very first turn to materialize you into {selectedPreset.universe}.
                  </p>
                </div>
              </div>

              {/* Gold Standard System Instructions Accordion */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-purple-500/25 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                      Director System Instructions (Gold Standard)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSystemInstructions(getGoldStandardTemplate(selectedPreset.universe))}
                      className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      Reset to Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                      className="text-[10px] font-mono text-purple-300 hover:text-white px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] transition-colors"
                    >
                      {showSystemPrompt ? 'Hide Instructions' : 'View / Edit Instructions'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Active simulation rules read on every response turn. Features turn selection rules, strict no-railroading, canon fidelity, and organic intimacy controls for <span className="text-cyan-300 font-bold">{selectedPreset.universe}</span>.
                </p>

                {showSystemPrompt && (
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      rows={9}
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-3 text-[11px] text-purple-200 font-mono focus:outline-none focus:border-cyan-400 resize-y leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500 font-mono">
                      Notice: <code className="text-cyan-300">{`{World}`}</code> is automatically mapped to <code className="text-cyan-300">{selectedPreset.universe}</code>.
                    </p>
                  </div>
                )}
              </div>

              {/* Protagonist Persona Selector (Saved Personas & Movesets) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-cyan-500/25 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Protagonist Persona &amp; Lorebook (Already Saved)
                    </span>
                  </div>
                  {onOpenPersonaModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPersonaModal();
                      }}
                      className="text-[11px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage / New Persona</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Choose which saved persona you want to roleplay as in <span className="text-cyan-300 font-semibold">{selectedPreset.universe}</span>. Their physical traits, aura, and keyword-triggered moveset lorebook will materialize automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedPersonas.map((p) => {
                    const isSel = p.id === selectedPersonaId;
                    let moveCount = 0;
                    try {
                      if (p.movesetKnowledge && p.movesetKnowledge.trim().startsWith('[')) {
                        moveCount = JSON.parse(p.movesetKnowledge).length;
                      }
                    } catch (e) {}

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPersonaId(p.id);
                          setCharacterName(p.name);
                          setCharacterConcept(p.traits);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSel
                            ? 'bg-cyan-950/60 border-cyan-400 text-slate-100 ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                            : 'bg-black/40 border-white/[0.08] text-slate-300 hover:border-cyan-500/40'
                        }`}
                      >
                        <AvatarImage
                          speaker={p.name}
                          universe="General Anime"
                          size="sm"
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold truncate font-display">{p.name}</h5>
                            {isSel && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.traits}</p>
                          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40 inline-block mt-1">
                            ⚡ {moveCount} Moves
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enter World Button */}
              <div className="pt-4 border-t border-white/[0.05] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmAndSpawn}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-purple-950/60 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
