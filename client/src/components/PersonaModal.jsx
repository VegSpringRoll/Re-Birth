import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Plus,
  Trash2,
  Check,
  Zap,
  Sword,
  Sparkles,
  Code,
  Save,
  Loader2,
  Copy,
  Shield,
  Layers,
  ArrowRight,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import AvatarImage from './AvatarImage.jsx';
import {
  getStoredPersonas,
  saveStoredPersonas,
  getActivePersonaId,
  saveActivePersonaId,
  createOrUpdatePersona,
  deletePersona
} from '../utils/personaStorage.js';
import { getActiveProvider, getStoredApiKeys, getStoredModels, getStoredSummaryConfig, getStoredCustomProxyUrl } from '../utils/storage.js';

export default function PersonaModal({
  isOpen,
  onClose,
  currentSession,
  onApplyPersonaToSession,
  onInjectMove
}) {
  const [personas, setPersonas] = useState(getStoredPersonas());
  const [activePersonaId, setActivePersonaIdState] = useState(getActivePersonaId());
  const [selectedPersonaId, setSelectedPersonaId] = useState(getActivePersonaId());

  // Edit form state
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [gender, setGender] = useState('Male');
  const [physique, setPhysique] = useState('');
  const [traits, setTraits] = useState('');
  const [details, setDetails] = useState('');
  const [movesetKnowledge, setMovesetKnowledge] = useState('[]');
  const [rawMovesInput, setRawMovesInput] = useState('');
  const [movesetParsing, setMovesetParsing] = useState(false);
  const [movesetParseError, setMovesetParseError] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 15MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        // Optimize and compress avatar to crisp 512x512 JPEG to prevent mobile 413 and lag
        const img = new Image();
        img.onload = () => {
          const maxDim = 512;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressed);
        };
        img.onerror = () => {
          setAvatar(dataUrl);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync state when opening or when personas change
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredPersonas();
      setPersonas(stored);
      const activeId = getActivePersonaId();
      setActivePersonaIdState(activeId);
      setSelectedPersonaId(activeId);
    }
  }, [isOpen]);

  // Load selected persona into form
  useEffect(() => {
    const current = personas.find((p) => p.id === selectedPersonaId) || personas[0];
    if (current) {
      setName(current.name || '');
      setAvatar(current.avatar || '');
      setGender(current.gender || 'Male');
      setPhysique(current.physique || '');
      setTraits(current.traits || '');
      setDetails(current.details || '');
      setMovesetKnowledge(current.movesetKnowledge || '[]');
      setRawMovesInput('');
      setMovesetParseError('');
    }
  }, [selectedPersonaId, personas]);

  if (!isOpen) return null;

  let parsedMoves = [];
  try {
    if (movesetKnowledge && movesetKnowledge.trim().startsWith('[')) {
      parsedMoves = JSON.parse(movesetKnowledge);
    }
  } catch (e) {
    parsedMoves = [];
  }

  const handleSave = () => {
    const updated = createOrUpdatePersona({
      id: selectedPersonaId,
      name,
      avatar,
      gender,
      physique,
      traits,
      details,
      movesetKnowledge
    });
    setPersonas(updated);

    // If this persona is the active one, sync directly to the current MongoDB session!
    if (selectedPersonaId === activePersonaId && onApplyPersonaToSession) {
      onApplyPersonaToSession({
        userProfile: { name, avatar, gender, physique, traits, details },
        movesetKnowledge
      });
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleSetActive = (personaId) => {
    saveActivePersonaId(personaId);
    setActivePersonaIdState(personaId);

    const targetPersona = personas.find((p) => p.id === personaId);
    if (targetPersona && onApplyPersonaToSession) {
      onApplyPersonaToSession({
        userProfile: {
          name: targetPersona.name,
          avatar: targetPersona.avatar,
          gender: targetPersona.gender,
          physique: targetPersona.physique,
          traits: targetPersona.traits,
          details: targetPersona.details
        },
        movesetKnowledge: targetPersona.movesetKnowledge
      });
    }
  };

  const handleCreateNew = () => {
    const newPersona = {
      name: 'New Protagonist',
      avatar: '',
      gender: 'Male',
      physique: 'Athletic, sharp presence with keen eyes.',
      traits: 'Determined, calculating, resolute.',
      details: 'A mysterious wanderer with deep martial focus.',
      movesetKnowledge: '[]'
    };
    const updated = createOrUpdatePersona(newPersona);
    setPersonas(updated);
    setSelectedPersonaId(updated[0].id);
    saveActivePersonaId(updated[0].id);
    setActivePersonaIdState(updated[0].id);
  };

  const handleDelete = (idToDelete) => {
    if (window.confirm('Delete this Persona profile?')) {
      const updated = deletePersona(idToDelete);
      setPersonas(updated);
      setSelectedPersonaId(updated[0].id);
      setActivePersonaIdState(getActivePersonaId());
    }
  };

  const handleGenerateMoveset = async () => {
    if (!rawMovesInput.trim()) return;

    setMovesetParsing(true);
    setMovesetParseError('');

    const provider = getActiveProvider();
    const apiKeys = getStoredApiKeys();
    const models = getStoredModels();
    const currentKey = apiKeys[provider] || '';
    const currentModel = models[provider] || '';
    const summaryConfig = getStoredSummaryConfig();

    try {
      const res = await fetch('/api/sessions/generate-moveset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentKey,
          'x-provider': provider,
          'x-model': currentModel || '',
          'x-custom-proxy-url': getStoredCustomProxyUrl(),
          'x-summary-api-key': summaryConfig?.apiKey || '',
          'x-summary-provider': summaryConfig?.provider || '',
          'x-summary-model': summaryConfig?.model || '',
        },
        body: JSON.stringify({
          rawText: rawMovesInput.trim(),
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }

      if (!res.ok || !data.success) {
        const errMsg = typeof data.error === 'string' ? data.error : (data.message || data.details || 'Failed to detect moveset');
        throw new Error(errMsg);
      }

      // Merge new moves with existing moves
      let existingMoves = [];
      try {
        if (movesetKnowledge && movesetKnowledge.trim().startsWith('[')) {
          existingMoves = JSON.parse(movesetKnowledge);
        }
      } catch (e) {
        existingMoves = [];
      }

      const merged = [...existingMoves, ...(data.moves || [])];
      const formattedJson = JSON.stringify(merged, null, 2);
      setMovesetKnowledge(formattedJson);
      setRawMovesInput('');

      // Auto save
      createOrUpdatePersona({
        id: selectedPersonaId,
        name,
        avatar,
        gender,
        physique,
        traits,
        details,
        movesetKnowledge: formattedJson
      });
      setPersonas(getStoredPersonas());

      if (selectedPersonaId === activePersonaId && onApplyPersonaToSession) {
        onApplyPersonaToSession({
          userProfile: { name, avatar, gender, physique, traits, details },
          movesetKnowledge: formattedJson
        });
      }
    } catch (err) {
      setMovesetParseError(err.message);
    } finally {
      setMovesetParsing(false);
    }
  };

  const handleDeleteMove = (indexToDelete) => {
    try {
      const moves = [...parsedMoves];
      moves.splice(indexToDelete, 1);
      const updated = JSON.stringify(moves, null, 2);
      setMovesetKnowledge(updated);
      createOrUpdatePersona({
        id: selectedPersonaId,
        name,
        avatar,
        gender,
        physique,
        traits,
        details,
        movesetKnowledge: updated
      });
      setPersonas(getStoredPersonas());
      if (selectedPersonaId === activePersonaId && onApplyPersonaToSession) {
        onApplyPersonaToSession({
          userProfile: { name, avatar, gender, physique, traits, details },
          movesetKnowledge: updated
        });
      }
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 animate-fade-in select-text">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl bg-slate-950/95 border-0 sm:border border-white/10 shadow-2xl shadow-black/90 overflow-hidden backdrop-blur-2xl z-10 pt-safe pb-safe">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-display uppercase tracking-wider text-slate-100">
                  Protagonist Persona Hub
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 hidden sm:inline-block">
                  Persistent LocalStorage &bull; Zero Token Waste
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Save your character identities once. Movesets are structured as lorebooks and trigger dynamically on keywords in chat.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Persona Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* LEFT: Persona Selector Sidebar */}
          <div className="w-full md:w-72 lg:w-80 max-h-40 sm:max-h-52 md:max-h-none border-b md:border-b-0 md:border-r border-white/[0.08] bg-slate-950/50 p-2.5 sm:p-4 flex flex-col shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Saved Personas ({personas.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/80 px-2 sm:px-2.5 py-1 rounded-xl border border-cyan-700/40 transition-colors"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1.5 sm:space-y-2 overflow-y-auto pr-1 flex-1">
              {personas.map((p) => {
                const isSelected = p.id === selectedPersonaId;
                const isActive = p.id === activePersonaId;
                let moveCount = 0;
                try {
                  if (p.movesetKnowledge && p.movesetKnowledge.trim().startsWith('[')) {
                    moveCount = JSON.parse(p.movesetKnowledge).length;
                  }
                } catch (e) {}

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonaId(p.id)}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 sm:gap-3 relative group ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15'
                    }`}
                  >
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shrink-0 border border-white/20"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-950 to-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300 font-bold font-mono text-xs sm:text-sm">
                        {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-100 truncate font-display">
                          {p.name}
                        </h4>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.traits || 'No traits yet'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          ⚡ {moveCount} Moves
                        </span>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetActive(p.id);
                            }}
                            className="text-[9px] font-mono text-slate-400 hover:text-cyan-300 underline"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>

                    {personas.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete Persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Selected Persona Editor & Moveset Lorebook */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Top Bar for Selected Persona */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-cyan-400/40 shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono text-base shadow-lg">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 transition-opacity cursor-pointer"
                    title="Upload Character Art"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 font-display">{name || 'Unnamed Persona'}</h3>
                    {selectedPersonaId === activePersonaId ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/50">
                        Active in Current Roleplay
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(selectedPersonaId)}
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 transition-colors"
                      >
                        Activate for This Session
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedPersonaId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                {savedToast ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedToast ? 'Persona Saved!' : 'Save Persona Changes'}</span>
              </button>
            </div>

            {/* Profile Fields */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/[0.08] space-y-4 shadow-md">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Persona Attributes & Appearance</span>
              </h4>

              {/* Custom Character Portrait Art Upload (User-Controlled) */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col sm:flex-row items-center gap-3.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="relative group shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Character Portrait"
                      className="w-16 h-16 rounded-xl object-cover border border-cyan-400/40 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-950 border border-dashed border-cyan-500/40 flex flex-col items-center justify-center text-slate-500 gap-1">
                      <ImageIcon className="w-5 h-5 text-cyan-400/60" />
                      <span className="text-[9px] font-mono text-cyan-300/70">No Art</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Character Portrait Art (User Uploaded)</span>
                    </label>
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="text-[10px] font-mono text-rose-400 hover:text-rose-300 underline"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Or paste custom image URL (https://...)"
                      className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Protagonist Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Patrick Yokam"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Gender / Archetype
                  </label>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Male, Female, Sovereign..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Physique & Visual Appearance
                </label>
                <textarea
                  rows={2}
                  value={physique}
                  onChange={(e) => setPhysique(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                  placeholder="Height, hair, eye color, apparel, weapons carried, armor..."
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Personality Traits & Aura
                </label>
                <textarea
                  rows={2}
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                  placeholder="Composed, analytical, sharp-witted, ruthless toward enemies, warm to allies..."
                />
              </div>
            </div>

            {/* Keyword-Triggered Moveset Lorebook Matrix */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/25 space-y-4 shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    Keyword-Triggered Moveset Lorebook ({parsedMoves.length} Moves)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showRawJson ? 'Hide JSON' : 'View/Edit JSON'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-cyan-300">Token-Saving Lorebook Architecture:</span> Moves saved here are <b>NEVER</b> sent on every turn. The engine scans your message for the trigger keywords. Only when you invoke the move in chat does it inject the ability parameters into the prompt!
                </div>
              </div>

              {/* Paste Raw Moves & AI Detect */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                  <span>Paste Raw Abilities / Wiki / Sheet (AI Will Detect Keywords)</span>
                  <span className="text-[10px] text-slate-500">Auto-Generates JSON</span>
                </label>
                <textarea
                  rows={3}
                  value={rawMovesInput}
                  onChange={(e) => {
                    setRawMovesInput(e.target.value);
                    setMovesetParseError('');
                  }}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl p-3 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed placeholder:text-slate-500"
                  placeholder="Paste raw abilities or wiki text here, e.g.:&#10;Rasengan: High-density spinning chakra sphere held in the palm...&#10;Chidori: Concentrated lightning piercing thrust at high velocity..."
                />

                {movesetParseError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                    {movesetParseError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!rawMovesInput.trim() || movesetParsing}
                  onClick={handleGenerateMoveset}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-40 cursor-pointer transition-all"
                >
                  {movesetParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Detecting Abilities &amp; Building Lorebook…</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>⚡ AI Detect &amp; Append to Moveset Lorebook</span>
                    </>
                  )}
                </button>
              </div>

              {/* Active Moves Cards */}
              {showRawJson ? (
                <div className="space-y-1.5">
                  <textarea
                    rows={8}
                    value={movesetKnowledge}
                    onChange={(e) => setMovesetKnowledge(e.target.value)}
                    className="w-full bg-black/80 border border-purple-500/30 rounded-xl p-3 text-[11px] text-purple-200 font-mono leading-relaxed resize-y focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Edit the JSON lorebook array directly.
                  </p>
                </div>
              ) : parsedMoves.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {parsedMoves.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 hover:border-cyan-400/50 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h5 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 flex items-center gap-1.5">
                            <Sword className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{m.name}</span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleDeleteMove(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Move"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] font-mono uppercase text-slate-500">Triggers:</span>
                          {Array.isArray(m.keywords) && m.keywords.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                        {m.action && onInjectMove && (
                          <button
                            type="button"
                            onClick={() => {
                              onInjectMove(m.action);
                              onClose();
                            }}
                            className="text-[10px] text-purple-300 hover:text-white font-mono uppercase bg-purple-950/80 hover:bg-purple-900 px-2 py-0.5 rounded border border-purple-800/40 transition-colors"
                            title="Paste into chat prompt"
                          >
                            Use in Chat
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-white/10 text-center text-xs text-slate-500 font-mono">
                  No moves in this persona yet. Paste raw abilities above and click "AI Detect" to build your lorebook matrix.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
