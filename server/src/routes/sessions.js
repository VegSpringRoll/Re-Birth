import express from 'express';
import { Session } from '../models/Session.js';
import { WorldState } from '../models/WorldState.js';
import { WORLD_PRESETS, getShuffledPresets, generateCustomWorldTemplate } from '../services/worldPresets.js';
import { getOrFetchAvatar } from '../services/avatarService.js';
import { streamRoleplayCompletion } from '../services/llmService.js';

const router = express.Router();

/**
 * POST /api/sessions/custom-briefing
 * Uses the LLM to generate a factual synopsis and chronological timeline arcs/chapters for any custom universe.
 * Note: Scenario Start is NOT AI-generated (user supplies raw prompt).
 */
router.post('/custom-briefing', async (req, res) => {
  const { universeTitle, apiConfig = {} } = req.body;
  const apiKey = apiConfig.apiKey || req.headers['x-api-key'] || req.body.apiKey;
  const provider = apiConfig.provider || req.headers['x-provider'] || req.body.provider || 'openrouter';
  const model = apiConfig.model || req.headers['x-model'] || req.body.model;
  const customBaseUrl = apiConfig.customBaseUrl || req.headers['x-custom-proxy-url'] || req.body.customBaseUrl;

  if (!universeTitle?.trim()) {
    return res.status(400).json({ error: 'universeTitle is required' });
  }

  if (!apiKey?.trim()) {
    return res.status(401).json({
      error: 'API_KEY_NOT_CONNECTED',
      message: 'Please connect an API key (OpenRouter, Anthropic, OpenAI, Gemini, or Groq) in Samplers & Moves to get an AI-generated world briefing.',
    });
  }

  try {
    const systemPrompt = `You are an elite anime world knowledge engine and canon archivist. When given an anime, manga, light novel, movie, or gaming universe, you provide a comprehensive factual summary and sequential canonical story arcs/chapters in strict JSON format. Respond ONLY with a valid JSON object.`;

    const userMsg = `Universe: "${universeTitle.trim()}"

Provide canon story arcs, factual synopsis, and key canon NPCs for "${universeTitle.trim()}". Return a valid JSON object matching this exact schema:
{
  "synopsis": "A detailed 120-160 word factual description of this universe, its power/magic system, major factions, and canon atmosphere.",
  "timelines": [
    { "id": "arc1", "label": "Canonical Arc 1 Name", "era": "Detailed in-universe arc/era description", "date": "Chronological period or year" },
    { "id": "arc2", "label": "Canonical Arc 2 Name", "era": "Detailed in-universe arc/era description", "date": "Chronological period or year" },
    { "id": "arc3", "label": "Canonical Arc 3 Name", "era": "Detailed in-universe arc/era description", "date": "Chronological period or year" },
    { "id": "arc4", "label": "Canonical Arc 4 Name", "era": "Detailed in-universe arc/era description", "date": "Chronological period or year" }
  ],
  "knownNPCs": [
    { "name": "Key Canon Character 1", "relation": "Affiliation & Role", "status": "Canon location & status" },
    { "name": "Key Canon Character 2", "relation": "Affiliation & Role", "status": "Canon location & status" },
    { "name": "Key Canon Character 3", "relation": "Affiliation & Role", "status": "Canon location & status" },
    { "name": "Key Canon Character 4", "relation": "Affiliation & Role", "status": "Canon location & status" }
  ]
}`;

    let fullText = '';
    for await (const token of streamRoleplayCompletion({
      systemPrompt,
      messages: [{ role: 'user', rawContent: userMsg }],
      samplers: { temperature: 0.3, top_p: 0.95, max_tokens: 2500 },
      apiConfig: { apiKey, provider, model, customBaseUrl },
    })) {
      fullText += token;
    }

    // Extract strictly the outermost JSON object from fullText
    let parsed = null;
    try {
      let cleanText = fullText.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        let jsonStr = cleanText.slice(firstBrace, lastBrace + 1).trim();
        // Strip trailing commas before closing brackets
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(jsonStr);
      }
    } catch (parseErr) {
      console.warn('[CustomBriefing] JSON parse warning, salvaging via heuristic:', parseErr.message);
    }

    if (!parsed || typeof parsed !== 'object') {
      const synopsisMatch = fullText.match(/"synopsis"\s*:\s*"([^"]+)"/i);
      const synopsis = synopsisMatch ? synopsisMatch[1] : `The world of ${universeTitle.trim()}, a rich anime and fictional realm ready for exploration.`;
      parsed = {
        synopsis,
        timelines: [
          { id: 'arc1', label: `${universeTitle.trim()} Arc 1: The Beginning`, era: `Opening canon arc of ${universeTitle.trim()}`, date: 'Chapter 1' },
          { id: 'arc2', label: `${universeTitle.trim()} Arc 2: Rising Threats`, era: `Mid-canon conflicts in ${universeTitle.trim()}`, date: 'Chapter 2' },
          { id: 'arc3', label: `${universeTitle.trim()} Arc 3: Climax & Apex`, era: `Climactic events of ${universeTitle.trim()}`, date: 'Chapter 3' }
        ],
        knownNPCs: [
          { name: `${universeTitle.trim()} Canon Figure`, relation: 'Canon Figure', status: 'Active in sector' }
        ]
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error('[CustomBriefing] Error:', err.message);
    res.json({
      error: err.message,
      message: `Failed generating AI briefing: ${err.message}`,
      synopsis: `The world of ${universeTitle.trim()}. Step into this realm and forge your story.`,
      timelines: [
        { id: 'arc1', label: 'Chapter 1: The Journey Begins', era: 'Chapter 1: The Journey Begins', date: 'Year 1, Mid-Autumn' },
        { id: 'arc2', label: 'Chapter 2: Escalating Shadows', era: 'Chapter 2: Escalating Shadows', date: 'Year 2, Winter' },
        { id: 'arc3', label: 'Chapter 3: Climax & Clashes', era: 'Chapter 3: Climax & Clashes', date: 'Year 3, Spring' }
      ],
      knownNPCs: []
    });
  }
});

/**
 * Heuristic fallback parser for raw abilities when offline or without an API key
 */
function fallbackParseMoves(rawText) {
  const cleaned = (rawText || '')
    .replace(/<\/?(?:abilities|moveset|techniques|moves|skills|spells)>/gi, '')
    .trim();

  if (!cleaned) return [];

  // ═══════════════════════════════════════════════════════════════
  // Smart Heuristic Parser: Identifies REAL abilities/techniques
  // by detecting heading patterns, ## markers, named techniques,
  // and skipping over passive descriptions / stat lines.
  // ═══════════════════════════════════════════════════════════════

  const lines = cleaned.split(/\r?\n/).map(l => l.trimEnd());
  const moves = [];

  const headingPattern = /^#{1,4}\s*(.+)/;
  const namedTechPattern = /^[-*•]\s+(.+)/;

  // Skip patterns: pure stat lines, lore paragraphs, weapon descriptions, trigger conditions
  const skipPatterns = [
    /^(?:base\s+(?:speed|technique|form|stat|damage|power)\s*:)/i,
    /^(?:weapon'?s?\s+base\s+form\s*:)/i,
    /^(?:trigger\s+condition\s*:)/i,
  ];
  // Section labels that are NOT moves themselves (e.g. "Veldanava's moves:")
  const sectionLabelPattern = /^[\w\s'']+(?:moves|abilities|techniques|skills|spells)\s*:?\s*$/i;

  let currentBlock = null;

  const flushBlock = () => {
    if (!currentBlock) return;
    const { name, descLines } = currentBlock;
    const desc = descLines.join(' ').trim();
    if (!name) { currentBlock = null; return; }

    const cleanName = name.replace(/[^\w\s:'''\-]/g, '').trim();
    if (!cleanName || cleanName.length < 2) { currentBlock = null; return; }

    const kwSet = new Set();
    kwSet.add(cleanName.toLowerCase());
    cleanName.toLowerCase().split(/[\s:]+/).forEach(w => {
      if (w.length > 2 && !['the', 'and', 'with', 'for', 'from', 'that', 'into', 'upon', 'can', 'his', 'her', 'its', 'very', 'has', 'also', 'more', 'when', 'core', 'ability'].includes(w)) {
        kwSet.add(w);
      }
    });

    moves.push({
      id: `move_${Date.now()}_${moves.length + 1}`,
      name: cleanName,
      keywords: Array.from(kwSet).slice(0, 6),
      description: desc || `Executes ${cleanName} with devastating force.`,
      action: `*activates ${cleanName}*`,
    });
    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Skip known non-ability lines
    if (skipPatterns.some(p => p.test(trimmed))) {
      if (currentBlock) currentBlock.descLines.push(trimmed);
      continue;
    }

    // Skip section labels like "Veldanava's moves:"
    if (sectionLabelPattern.test(trimmed)) continue;

    // ── Heading style: "## Core Ability 1 - Ninpo: Hiboshi — A powerful blue fireball..." ──
    const headingMatch = trimmed.match(headingPattern);
    if (headingMatch) {
      flushBlock();
      let headingText = headingMatch[1].replace(/^[⚔️🔥💥✨🌀⚡🗡️]+\s*/, '').trim();

      // Strip "Core Ability N -" or "Ability N -" prefix
      headingText = headingText.replace(/^(?:core\s+)?ability\s*\d*\s*[-–—]\s*/i, '').trim();

      // Split name from description ONLY on — or – (em/en dash), NOT on : (colon is part of move names!)
      const dashSplit = headingText.match(/^(.+?)\s*[—–]\s+(.+)/);
      if (dashSplit) {
        currentBlock = { name: dashSplit[1].trim(), descLines: [dashSplit[2].trim()] };
      } else {
        // Clean trailing ":- " or " :-" from section headings
        const cleanHeading = headingText.replace(/\s*[:\-]+\s*$/, '').trim();
        currentBlock = { name: cleanHeading, descLines: [] };
      }
      continue;
    }

    // ── Bullet-point moves: "- Cinder Cross — Two crossing slashes..." ──
    const bulletMatch = trimmed.match(namedTechPattern);
    if (bulletMatch) {
      const bulletContent = bulletMatch[1].trim();

      // Split on — or – (em/en dash)
      const dashSplit = bulletContent.match(/^(.+?)\s*[—–]\s+(.+)/);
      if (dashSplit) {
        flushBlock();
        currentBlock = { name: dashSplit[1].trim(), descLines: [dashSplit[2].trim()] };
        continue;
      }
    }

    // ── Free-standing "Name — Description" pattern (not bullets, not headings) ──
    const freeMatch = trimmed.match(/^([A-Z][\w\s:'''\-]{2,50})\s*[—–]\s+(.+)/);
    if (freeMatch && !skipPatterns.some(p => p.test(trimmed))) {
      flushBlock();
      currentBlock = { name: freeMatch[1].trim(), descLines: [freeMatch[2].trim()] };
      continue;
    }

    // Otherwise it's a continuation line — append to current block
    if (currentBlock) {
      currentBlock.descLines.push(trimmed);
    }
  }

  flushBlock();

  return moves.filter(m => m.name.length > 1 && m.name.length < 80);
}

/**
 * POST /api/sessions/generate-moveset
 * AI parses raw moveset text into a structured JSON lorebook of triggerable techniques.
 * Uses the dedicated summarizer / secondary model for cost-efficiency, falls back to primary model,
 * then to the improved heuristic parser if no keys are available.
 */
const handleGenerateMoveset = async (req, res) => {
  const { rawText } = req.body;

  // Accept both primary and summary-specific credentials
  const primaryKey = req.headers['x-api-key'] || req.body.apiKey || '';
  const primaryProvider = req.headers['x-provider'] || req.body.provider || 'openrouter';
  const primaryModel = req.headers['x-model'] || req.body.model || '';
  const customBaseUrl = req.headers['x-custom-proxy-url'] || req.body.customBaseUrl || '';

  const summaryKey = req.headers['x-summary-api-key'] || req.body.summaryApiKey || '';
  const summaryProvider = req.headers['x-summary-provider'] || req.body.summaryProvider || '';
  const summaryModel = req.headers['x-summary-model'] || req.body.summaryModel || '';

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: 'rawText is required' });
  }

  // Decide which model config to use: prefer summarizer (cheap & fast), fallback to primary
  let useKey = '';
  let useProvider = '';
  let useModel = '';

  if (summaryKey && summaryKey.trim()) {
    useKey = summaryKey.trim();
    useProvider = summaryProvider || 'openai';
    useModel = summaryModel || 'gpt-4o-mini';
  } else if (primaryKey && primaryKey.trim()) {
    useKey = primaryKey.trim();
    useProvider = primaryProvider;
    useModel = primaryModel;
  } else if (primaryProvider === 'custom') {
    // Custom proxy may not need a key
    useKey = '';
    useProvider = 'custom';
    useModel = primaryModel || 'default';
  }

  // Key-prefix auto-detection for moveset generation
  if (useKey) {
    if (useKey.startsWith('sk-or-v1-') || useKey.startsWith('sk-or-')) {
      useProvider = 'openrouter';
      if (!useModel || useModel === 'gpt-4o-mini') useModel = 'anthropic/claude-3.5-haiku';
    } else if (useKey.startsWith('gsk_')) {
      useProvider = 'groq';
      if (!useModel || useModel === 'gpt-4o-mini') useModel = 'llama-3.1-8b-instant';
    } else if (useKey.startsWith('AIzaSy') || useKey.startsWith('AIza')) {
      useProvider = 'gemini';
      if (!useModel || useModel === 'gpt-4o-mini') useModel = 'gemini-1.5-flash';
    } else if (useKey.startsWith('sk-ant-')) {
      useProvider = 'anthropic';
      if (!useModel || useModel === 'gpt-4o-mini') useModel = 'claude-3-5-haiku-20241022';
    } else if (useKey.startsWith('sk-proj-') && useProvider !== 'openai') {
      useProvider = 'openai';
    }
  }

  // If no usable API config at all, use the improved heuristic parser
  if (!useKey && useProvider !== 'custom') {
    const fallbackMoves = fallbackParseMoves(rawText);
    return res.json({ success: true, moves: fallbackMoves, isFallback: true });
  }

  try {
    const systemPrompt = `You are a combat lorebook architect for an anime / fantasy text roleplay engine.

Your task: analyze the raw character abilities, techniques, spells, or moveset text provided by the user.
Extract ONLY distinct named techniques, abilities, spells, and special moves — NOT passive descriptions, stat blocks, lore paragraphs, trigger conditions, or weapon descriptions.

IMPORTANT RULES:
1. Each entry must be a SPECIFIC, NAMEABLE combat/support technique the character can actively USE.
2. If an ability has SUB-MOVES (e.g. a transformed weapon with its own techniques), extract each sub-move as a SEPARATE entry AND the parent transformation as its own entry.
3. The "keywords" array should contain the move's proper name and 1-3 short trigger words a player would type in chat to invoke it (e.g. ["rasengan", "spiral sphere"]).
4. The "description" should be a concise tactical summary covering: what it does, its visual effects, damage type, and any special conditions.
5. The "action" should be a short italicized roleplay action snippet (e.g. "*channels spiraling chakra into palm and thrusts forward*").
6. SKIP over: passive stats ("Base Speed: Mach 1"), weapon form descriptions, trigger conditions, and lore exposition.
7. Respond with ONLY a valid JSON array. No markdown code fences, no commentary, no explanation.`;

    const userMsg = `Parse the following raw abilities text into a JSON array of distinct techniques:

---
${rawText.trim()}
---

Return ONLY a JSON array with this structure:
[
  {
    "id": "move_1",
    "name": "Exact Technique Name",
    "keywords": ["technique name lowercase", "short alias", "alternate trigger"],
    "description": "Concise tactical summary: what it does, visual effects, damage type, constraints.",
    "action": "*short italicized choreography of the move being executed*"
  }
]`;

    let fullText = '';
    for await (const token of streamRoleplayCompletion({
      systemPrompt,
      messages: [{ role: 'user', rawContent: userMsg }],
      samplers: { temperature: 0.15, top_p: 0.9, max_tokens: 2000 },
      apiConfig: { apiKey: useKey, provider: useProvider, model: useModel, customBaseUrl },
    })) {
      fullText += token;
    }

    // Robust JSON extraction: handle markdown fences, trailing commas, etc.
    let jsonStr = fullText;

    // Strip markdown code fences if present
    jsonStr = jsonStr.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
      throw new Error('LLM did not return a valid JSON array in output');
    }
    jsonStr = jsonStr.slice(firstBracket, lastBracket + 1).trim();

    // Fix trailing commas before ] (common LLM JSON error)
    jsonStr = jsonStr.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');

    let parsedMoves;
    try {
      parsedMoves = JSON.parse(jsonStr);
    } catch (jsonErr) {
      // Try one more fix: replace single quotes with double quotes
      const fixedJson = jsonStr
        .replace(/'/g, '"')
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      parsedMoves = JSON.parse(fixedJson);
    }

    // Validate structure: ensure each entry has at minimum name and keywords
    if (!Array.isArray(parsedMoves)) {
      throw new Error('Parsed result is not an array');
    }

    const validatedMoves = parsedMoves
      .filter(m => m && typeof m === 'object' && m.name && typeof m.name === 'string')
      .map((m, idx) => ({
        id: m.id || `move_${Date.now()}_${idx + 1}`,
        name: String(m.name).trim(),
        keywords: Array.isArray(m.keywords) ? m.keywords.map(k => String(k).toLowerCase().trim()).filter(Boolean) : [String(m.name).toLowerCase().trim()],
        description: String(m.description || '').trim() || `Executes ${m.name} with devastating precision.`,
        action: String(m.action || '').trim() || `*activates ${m.name}*`,
      }));

    if (validatedMoves.length === 0) {
      throw new Error('No valid moves extracted by LLM');
    }

    console.log(`[GenerateMoveset] AI extracted ${validatedMoves.length} techniques using ${useProvider}/${useModel}`);
    res.json({ success: true, moves: validatedMoves });
  } catch (err) {
    console.warn('[GenerateMoveset] LLM failed, using heuristic fallback:', err.message);
    const fallbackMoves = fallbackParseMoves(rawText);
    res.json({ success: true, moves: fallbackMoves, isFallback: true });
  }
};

router.post('/generate-moveset', handleGenerateMoveset);
router.post('/detect-moveset', handleGenerateMoveset);

/**
 * GET /api/sessions/presets - Get popular canon world templates
 * Shuffles dynamically so new anime worlds appear every time the gateway is opened!
 */
router.get('/presets', (req, res) => {
  if (req.query.all === 'true') {
    return res.json(WORLD_PRESETS);
  }
  const count = parseInt(req.query.limit, 10) || 12;
  const presets = getShuffledPresets(count);
  res.json(presets);
});

/**
 * POST /api/sessions/briefing - Get detailed canon briefing, timelines and scenarios for any realm
 */
router.post('/briefing', async (req, res) => {
  try {
    const { presetId, universeTitle } = req.body;
    if (presetId) {
      const preset = WORLD_PRESETS.find((p) => p.id === presetId);
      if (preset) return res.json(preset);
    }

    // Custom universe briefing
    const custom = generateCustomWorldTemplate({ universeTitle: universeTitle || 'Custom Universe' });
    res.json(custom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sessions/forge - Forge realm with chosen timeline, scenario hook, and character
 */
router.post('/forge', async (req, res) => {
  try {
    const {
      presetId,
      customWorld,
      universeTitle,
      chosenTimeline,
      chosenScenario,
      characterName,
      characterConcept,
      systemInstructions,
    } = req.body;

    let template = null;

    // 1. If presetId matches a pre-baked canon preset
    if (presetId && presetId !== 'custom') {
      template = WORLD_PRESETS.find((p) => p.id === presetId);
    }

    // 2. Custom or AI-briefed realm
    if (!template) {
      const uTitle = (
        customWorld?.universeTitle ||
        universeTitle ||
        (presetId && presetId !== 'custom' ? presetId : '') ||
        'Custom Realm'
      ).trim();

      const startingNPCs = Array.isArray(customWorld?.knownNPCs)
        ? customWorld.knownNPCs
        : Array.isArray(customWorld?.startingNPCs)
        ? customWorld.startingNPCs
        : [];

      template = generateCustomWorldTemplate({
        universeTitle: uTitle,
        startingLocation: chosenScenario?.location,
        customEra: chosenTimeline?.era || chosenTimeline?.label,
        customScenario: chosenScenario?.prompt,
        characterName,
        characterConcept,
        startingNPCs,
      });

      if (customWorld?.synopsis) {
        template.synopsis = customWorld.synopsis;
      }
    }

    const currentArcOrChapter = chosenTimeline?.label || chosenTimeline?.era || template.currentEra || 'Chapter 1: The Journey Begins';
    const inGameDate = chosenTimeline?.date || template.inGameDate || 'Year 1, Mid-Autumn';
    const location = chosenScenario?.location || template.currentLocation;
    const weather = chosenScenario?.weather || template.weather;
    const spawnPrompt = (chosenScenario?.prompt || '').trim();

    const userProfile = {
      name: (req.body.userProfile?.name || characterName || template.userProfile?.name || 'Protagonist').trim(),
      avatar: req.body.userProfile?.avatar || template.userProfile?.avatar || '',
      gender: req.body.userProfile?.gender || template.userProfile?.gender || 'Male',
      physique: req.body.userProfile?.physique || template.userProfile?.physique || 'Athletic silhouette, combat attire',
      traits: req.body.userProfile?.traits || characterConcept || template.userProfile?.traits || 'Resolute, perceptive',
      details: req.body.userProfile?.details || template.userProfile?.details || '',
    };

    const movesetKnowledge = typeof req.body.movesetKnowledge === 'string'
      ? req.body.movesetKnowledge
      : typeof template.movesetKnowledge === 'string'
      ? template.movesetKnowledge
      : '[]';

    // Sanitize known NPCs to ensure Mongoose validation never fails
    const rawNPCs = Array.isArray(template.knownNPCs) && template.knownNPCs.length > 0
      ? template.knownNPCs
      : Array.isArray(customWorld?.knownNPCs)
      ? customWorld.knownNPCs
      : [];

    const cleanNPCs = rawNPCs
      .map((npc, idx) => {
        const rawName = typeof npc === 'string' ? npc : (npc?.name || '');
        const name = (typeof rawName === 'string' ? rawName.trim() : '') || `Character ${idx + 1}`;
        const relation = (typeof npc?.relation === 'string' ? npc.relation.trim() : '') || 'Local Resident';
        const status = (typeof npc?.status === 'string' ? npc.status.trim() : '') || 'Present in sector';
        let affinity = typeof npc?.affinity === 'number' && !isNaN(npc.affinity) ? npc.affinity : 50;
        affinity = Math.max(0, Math.min(100, affinity));
        const bondTier = (typeof npc?.bondTier === 'string' ? npc.bondTier.trim() : '') || 'Acquaintance';
        const isPresent = npc?.isPresent !== false;
        return { name, relation, status, isPresent, affinity, bondTier };
      });

    // Create Session - rollingSummary starts clean and empty, updating every 10 turns
    const session = await Session.create({
      title: `${template.universe}: ${chosenTimeline?.label || template.title || 'Genesis'}`,
      universe: template.universe,
      systemInstructions: systemInstructions || template.systemInstructions || '',
      userProfile,
      movesetKnowledge,
      rollingSummary: '',
      messages: []
    });

    // Create WorldState
    const worldState = await WorldState.create({
      sessionId: session._id,
      universe: template.universe,
      currentEra: currentArcOrChapter,
      inGameDate,
      timeOfDay: template.timeOfDay || '09:00 AM - Morning',
      currentLocation: location,
      weather,
      sceneMood: 'peaceful',
      musicTrackQuery: `${template.universe} ambient soundtrack`,
      knownNPCs: cleanNPCs
    });

    // Pre-cache avatars in background
    if (Array.isArray(cleanNPCs)) {
      cleanNPCs.forEach((npc) => {
        getOrFetchAvatar(npc.name, template.universe).catch((e) => {});
      });
    }

    res.status(201).json({ session, worldState, spawnPrompt });
  } catch (err) {
    console.error('[SessionRoute] Error forging realm:', err);
    res.status(500).json({ error: 'Failed to forge realm', details: err.message || String(err) });
  }
});

/**
 * GET /api/sessions - List all sessions
 */
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find({}, 'title universe updatedAt createdAt rollingSummary')
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sessions - Create raw session
 */
router.post('/', async (req, res) => {
  try {
    const { title, universe, systemInstructions, userProfile, movesetKnowledge } = req.body;
    const session = await Session.create({
      title: title || `Chronicle - ${new Date().toLocaleDateString()}`,
      universe: universe || 'Anime Multiverse',
      systemInstructions,
      userProfile,
      movesetKnowledge,
      messages: []
    });

    const worldState = await WorldState.create({
      sessionId: session._id,
      universe: universe || 'Anime Multiverse'
    });

    res.status(201).json({ session, worldState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sessions/:id - Get session details + WorldState
 */
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    let worldState = await WorldState.findOne({ sessionId: session._id });
    if (!worldState) {
      worldState = await WorldState.create({ sessionId: session._id });
    }

    res.json({ session, worldState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/sessions/:id - Update session settings/context
 */
router.put('/:id', async (req, res) => {
  try {
    const { title, universe, systemInstructions, userProfile, movesetKnowledge, rollingSummary } = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(title && { title }),
          ...(universe && { universe }),
          ...(systemInstructions !== undefined && { systemInstructions }),
          ...(userProfile && { userProfile }),
          ...(movesetKnowledge !== undefined && { movesetKnowledge }),
          ...(rollingSummary !== undefined && { rollingSummary }),
        }
      },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/sessions/:id/messages/:index - Edit a message turn and prune all subsequent turns
 */
router.put('/:id/messages/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const { rawContent, truncateBelow = true } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= session.messages.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    session.messages[idx].rawContent = rawContent;
    session.messages[idx].timestamp = new Date();

    // Whenever a turn is edited in the chronicle, prune all messages below it
    if (truncateBelow) {
      session.messages = session.messages.slice(0, idx + 1);
      if (session.lastSummarizedIndex > session.messages.length) {
        session.lastSummarizedIndex = session.messages.length;
      }
    }

    await session.save();

    res.json({
      success: true,
      updatedMessage: session.messages[idx],
      messages: session.messages,
      editedIndex: idx,
      isUser: session.messages[idx].role === 'user'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/sessions/:id/messages/:index/swipe - Switch active swipe candidate (◀ 1/3 ▶)
 */
router.put('/:id/messages/:index/swipe', async (req, res) => {
  try {
    const { index } = req.params;
    const { swipeIndex } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= session.messages.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    const msg = session.messages[idx];
    if (!msg.swipes || msg.swipes.length === 0) {
      return res.status(400).json({ error: 'Message has no alternative swipes' });
    }

    const targetSwipe = parseInt(swipeIndex, 10);
    if (targetSwipe < 0 || targetSwipe >= msg.swipes.length) {
      return res.status(400).json({ error: 'Invalid swipe index' });
    }

    msg.swipeIndex = targetSwipe;
    msg.rawContent = msg.swipes[targetSwipe];
    await session.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sessions/:id/messages/:index - Delete a specific message turn
 */
router.delete('/:id/messages/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= session.messages.length) {
      return res.status(400).json({ error: 'Invalid message index' });
    }

    session.messages.splice(idx, 1);
    if (session.lastSummarizedIndex > session.messages.length) {
      session.lastSummarizedIndex = session.messages.length;
    }
    await session.save();

    res.json({ success: true, messages: session.messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/sessions/:id/compact - Force manual memory compaction
 */
router.post('/:id/compact', async (req, res) => {
  try {
    const { summaryApiConfig } = req.body;
    const { forceCompaction } = await import('../services/memoryPipeline.js');
    const result = await forceCompaction(req.params.id, summaryApiConfig);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/sessions/:id/memories - Add a pinned long-term chrono-memory
 */
router.post('/:id/memories', async (req, res) => {
  try {
    const { memory } = req.body;
    if (!memory || !memory.trim()) return res.status(400).json({ error: 'Memory string is required' });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.pinnedMemories.push(memory.trim());
    await session.save();
    res.json({ pinnedMemories: session.pinnedMemories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sessions/:id/memories/:index - Delete a pinned memory
 */
router.delete('/:id/memories/:index', async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.pinnedMemories.splice(idx, 1);
    await session.save();
    res.json({ pinnedMemories: session.pinnedMemories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/sessions/:id - Completely delete roleplay session, world state & associated data
 */
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await Session.findByIdAndDelete(req.params.id);
    await WorldState.deleteMany({ sessionId: req.params.id });

    res.json({ success: true, message: `Roleplay "${session.title}" and all related data purged.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
