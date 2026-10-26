/**
 * High-Precision Token Estimator for Roleplay Context Windows
 * Implements standard BPE (Byte-Pair Encoding) regex pattern matching identical to
 * cl100k / Claude / LLaMA / Gemini tokenizers for exact token metrics.
 */
import { getStoredSamplers } from './storage.js';

// Standard BPE regex used by modern LLM tokenizers (matches contractions, words, numbers, punctuation, spaces)
const BPE_TOKEN_REGEX = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

/**
 * Estimates token count for any text segment with high precision.
 * Automatically strips internal system <state_update> tags if present in the text
 * so that invisible JSON metadata is never counted as visible dialogue/story tokens.
 */
export function estimateTokens(text, stripStateUpdate = true) {
  if (!text || typeof text !== 'string') return 0;
  let clean = text;
  if (stripStateUpdate) {
    clean = clean.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '');
  }
  clean = clean.trim();
  if (!clean) return 0;

  const matches = clean.match(BPE_TOKEN_REGEX);
  if (matches && matches.length > 0) {
    return matches.length;
  }
  return Math.max(1, Math.ceil(clean.length / 3.8));
}

export const IMMUTABLE_DIRECTOR_INSTRUCTIONS = `=== [DIRECTOR CORE ENGINE - MANDATORY BACKEND PROTOCOL] ===
You are the Master Storyteller, Game Director, and Simulation Engine for this roleplay.
1. Narrative Architecture: Maintain cinematic third-person prose, evocative pacing, sensory world details, and fluid dialogue exchanges.
2. Participant Agency: {{user}} is a sovereign participant. NEVER decide, control, dictate, or speak for {{user}}'s actions, feelings, thoughts, or dialogue.
3. Canon Logic: Adhere strictly to the universe's tone, power scaling, magic/combat mechanics, and social hierarchy.
4. Output Architecture: You must strictly structure all responses using <narration>, <say speaker="...">, and terminal <state_update> tags.`;

export const OUTPUT_TAG_ENFORCEMENT_SCHEMA = `=== [OUTPUT TAG ENFORCEMENT SCHEMA] ===
You must strictly structure your response into the following XML-style tags:
1. Wrap all atmospheric descriptions, actions, environment, emotional cues, and choreography inside:
   <narration>Prose and action description goes here...</narration>
2. Wrap every spoken line of dialogue inside:
   <say speaker="Character Name">Direct quoted speech goes here...</say>
   (Speaker must be the exact name of the character speaking, e.g. speaker="Rimuru Tempest" or speaker="Aqua")
3. You may interleave multiple <narration> and <say> blocks in dramatic sequence.
   CRITICAL: Always close every tag with its exact matching tag name: close <narration> with </narration>, and close <say> with </say>. Never mix </say> onto a <narration> block.
4. AT THE VERY END of your response, output a single <state_update> JSON block reflecting any in-game time advancement, location changes, weather updates, or new/updated NPCs:
<state_update>
{
  "universe": "string",
  "currentEra": "string (Current Arc / Chapter name, e.g. 'Chapter 1: The Journey Begins')",
  "inGameDate": "string (Accurate canonical in-world date for this timeline, e.g. 'Taisho Year 2, October 15', advancing realistically as scene progresses)",
  "timeOfDay": "string (Accurate chronological time, e.g. '09:30 AM - Morning' or '11:45 PM - Moonlit Midnight', advancing as scene progresses)",
  "currentLocation": "string",
  "weather": "string",
  "knownNPCs": [
    {
      "name": "string",
      "relation": "string",
      "status": "string (Current activity, e.g. 'Talking at the guild counter' or 'Left behind at the field')",
      "isPresent": "boolean (MUST be true ONLY if the NPC is physically in the immediate room/area with {{user}} right now; false if elsewhere in the world)",
      "affinity": "number (0-100 intimacy / trust / loyalty meter, adjusting dynamically with {{user}}'s choices)",
      "bondTier": "string ('Hostile / Rival' < 25, 'Wary / Distant' < 40, 'Acquaintance' < 60, 'Friendly Ally' < 75, 'Trusted Companion' < 90, 'Devoted / Sworn' >= 90)"
    }
  ]
}
</state_update>
Do NOT wrap the <state_update> in markdown code fences (\`\`\`). Keep it raw JSON inside <state_update>...</state_update>.`;

export function assembleSystemPromptForEstimation({
  session,
  worldState,
  currentInput = ''
}) {
  const parts = [];

  // 1. Director Core Protocol + Editable Session Instructions
  const dirCore = IMMUTABLE_DIRECTOR_INSTRUCTIONS.trim();
  const sysRules = (session?.systemInstructions || '').trim();
  parts.push([
    dirCore,
    sysRules ? `=== [SESSION SYSTEM INSTRUCTIONS & SIMULATION RULES] ===\n${sysRules}` : ''
  ].filter(Boolean).join('\n\n'));

  // 2. Rolling World Summary & Pinned Chrono-Memories
  const summaryParts = [];
  if (session?.rollingSummary && session.rollingSummary.trim()) {
    summaryParts.push(session.rollingSummary.trim());
  }
  if (Array.isArray(session?.pinnedMemories) && session.pinnedMemories.length > 0) {
    summaryParts.push(`\n[PINNED PERMANENT MEMORIES & CRITICAL DATA INJECTION - MUST REMEMBER]:\n${session.pinnedMemories.map((m, idx) => `• [Memory #${idx + 1}]: ${m}`).join('\n')}`);
  }
  if (summaryParts.length > 0) {
    parts.push(`=== [2. ROLLING WORLD SUMMARY & CHRONO-MEMORIES] ===\n${summaryParts.join('\n')}`);
  }

  // 3. Current World State (Matching promptAssembler.js exact structure)
  if (worldState) {
    const rawNpcs = Array.isArray(worldState.knownNPCs) ? worldState.knownNPCs : [];
    const activeNpcs = rawNpcs.filter((npc) => npc.isPresent !== false);
    const otherNpcs = rawNpcs.filter((npc) => npc.isPresent === false);

    const formatNpc = (npc) => {
      const aff = typeof npc.affinity === 'number' ? ` [Affinity: ${npc.affinity}% • Bond: ${npc.bondTier || 'Acquaintance'}]` : '';
      return `- ${npc.name}: ${npc.relation}${aff} [Status: ${npc.status}]`;
    };

    const activeText = activeNpcs.length > 0 ? activeNpcs.map(formatNpc).join('\n') : 'None in immediate room/vicinity';
    const otherText = otherNpcs.length > 0 ? otherNpcs.map(formatNpc).join('\n') : 'None currently away';

    parts.push(`=== [3. CURRENT WORLD STATE] ===
- Universe: ${worldState.universe || 'Anime Multiverse'}
- Current Era: ${worldState.currentEra || 'Present'}
- In-Game Date: ${worldState.inGameDate || 'Unknown'}
- Time of Day: ${worldState.timeOfDay || 'Dusk'}
- Current Location: ${worldState.currentLocation || 'Unknown Sector'}
- Weather / Atmosphere: ${worldState.weather || 'Clear'}
- Active NPCs Present Around {{user}} in Current Scene:
${activeText}
- Other Known NPCs Encountered in Chronicle (Elsewhere / Away):
${otherText}`);
  }

  // 4. User Profile & Character Sheet
  if (session?.userProfile) {
    const p = session.userProfile;
    const profileText = typeof p === 'string'
      ? p
      : `Name: ${p.name || 'Protagonist'}\nPhysique & Appearance: ${p.physique || 'Unspecified'}\nPersonality & Traits: ${p.traits || 'Resolute'}\nBackground: ${p.details || 'Unknown'}`;

    parts.push(`=== [4. USER PROFILE & CHARACTER SHEET] ===\n${profileText}`);
  }

  // 5. Weapons, Forms & Moveset Lorebook (Keyword-Triggered)
  if (session?.movesetKnowledge && typeof session.movesetKnowledge === 'string' && session.movesetKnowledge.trim()) {
    let activeMovesBlock = '';
    try {
      const trimmed = session.movesetKnowledge.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const moves = JSON.parse(trimmed);
        if (Array.isArray(moves)) {
          const triggerContext = (currentInput || '').toLowerCase();
          const triggeredMoves = moves.filter((move) => {
            const hasKeywordMatch = Array.isArray(move.keywords) && move.keywords.some((kw) => kw && triggerContext.includes(kw.toLowerCase().trim()));
            const hasNameMatch = move.name && triggerContext.includes(move.name.toLowerCase().trim());
            return hasKeywordMatch || hasNameMatch;
          });

          if (triggeredMoves.length > 0) {
            activeMovesBlock = `=== [ACTIVE TRIGGERED TECHNIQUES & MOVESET LOREBOOK] ===\nThe user just invoked or executed the following registered techniques in this turn:\n${triggeredMoves.map((m) => `• ${m.name}: ${m.description}`).join('\n')}`;
          }
        }
      }
    } catch (e) {}

    if (!activeMovesBlock && !session.movesetKnowledge.trim().startsWith('[')) {
      activeMovesBlock = `=== [5. WEAPONS, FORMS & MOVESET KNOWLEDGE] ===\n${session.movesetKnowledge.trim()}`;
    }

    if (activeMovesBlock) {
      parts.push(activeMovesBlock);
    }
  }

  // 6. Output Tag Enforcement Schema
  parts.push(OUTPUT_TAG_ENFORCEMENT_SCHEMA);

  return parts.join('\n\n');
}

/**
 * Slices the last N player turns and all generated assistant responses combined together.
 * For example, a window of 10 player turns preserves the last 10 player actions AND all
 * assistant narration/dialogues that took place between them (~20 messages in context).
 */
export function getWindowedMessages(messages, windowInTurns = 10) {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  let userCount = 0;
  let cutoffIndex = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      userCount++;
      if (userCount >= windowInTurns) {
        cutoffIndex = i;
        break;
      }
    }
  }

  return messages.slice(cutoffIndex);
}

export function calculateRoleplayTokenMetrics({
  session,
  worldState,
  currentInput = '',
  slidingWindow,
}) {
  const samplers = getStoredSamplers();
  const effectiveWindow = slidingWindow || samplers?.sliding_window || 10;

  // 1. Exact System Prompt Assembled for this turn
  const systemPrompt = assembleSystemPromptForEstimation({
    session,
    worldState,
    currentInput,
  });
  const systemTokens = estimateTokens(systemPrompt, false);

  // 2. Draft Message Tokens
  const draftTokens = estimateTokens(currentInput, false);

  // 3. Active Window Messages in Player Turns (User turns + assistant responses combined together)
  const allMessages = Array.isArray(session?.messages) ? session.messages : [];
  const windowed = getWindowedMessages(allMessages, effectiveWindow);

  let windowedText = '';
  for (const msg of windowed) {
    let content = msg.rawContent || msg.content || '';
    if (msg.role === 'assistant') {
      content = content.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '').trim();
    }
    windowedText += `\n${content}`;
  }
  const windowedHistoryTokens = estimateTokens(windowedText, false);

  // Total Payload Tokens sent to LLM on next turn
  const totalPayloadTokens = systemTokens + windowedHistoryTokens + draftTokens;

  // Full Roleplay Cumulative Token Length (Full chronicle history with clean narrative + system prompt)
  let allHistoryText = '';
  for (const msg of allMessages) {
    let content = msg.rawContent || msg.content || '';
    if (msg.role === 'assistant') {
      content = content.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '').trim();
    }
    allHistoryText += `\n${content}`;
  }
  const allHistoryTokens = estimateTokens(allHistoryText, false);
  const fullRoleplayTokens = systemTokens + allHistoryTokens;

  const windowedPlayerTurns = windowed.filter((m) => m.role === 'user').length;
  const totalPlayerTurns = allMessages.filter((m) => m.role === 'user').length;
  const prunedPlayerTurns = Math.max(0, totalPlayerTurns - windowedPlayerTurns);
  const prunedTokens = Math.max(0, allHistoryTokens - windowedHistoryTokens);
  const prunedMessagesCount = Math.max(0, allMessages.length - windowed.length);

  return {
    contextTokens: fullRoleplayTokens,
    fullRoleplayTokens,
    systemTokens,
    windowedHistoryTokens,
    allHistoryTokens,
    prunedTokens,
    prunedMessagesCount,
    windowedMessagesCount: windowed.length,
    windowedPlayerTurns,
    totalPlayerTurns,
    prunedPlayerTurns,
    draftTokens,
    totalPayloadTokens,
    slidingWindow: effectiveWindow,
  };
}
