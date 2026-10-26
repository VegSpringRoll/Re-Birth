/**
 * Assembles system prompt in exact required order:
 * 1. Combined Director Protocol (Immutable Backend Core) + Active System Instructions (Editable)
 * 2. Rolling World Summary & Pinned Chrono-Memories
 * 3. Current World State
 * 4. User Profile & Character Sheet
 * 5. Weapons, Forms & Moveset Knowledge
 * 6. Strict Output Tag Schema Enforcement
 */

export const IMMUTABLE_DIRECTOR_INSTRUCTIONS = `=== [DIRECTOR CORE ENGINE - MANDATORY BACKEND PROTOCOL] ===
You are the Master Storyteller, Game Director, and Simulation Engine for this roleplay.
1. Narrative Architecture: Maintain cinematic third-person prose, evocative pacing, sensory world details, and fluid dialogue exchanges.
2. Participant Agency: {{user}} is a sovereign participant. NEVER decide, control, dictate, or speak for {{user}}'s actions, feelings, thoughts, or dialogue.
3. Canon Logic: Adhere strictly to the universe's tone, power scaling, magic/combat mechanics, and social hierarchy.
4. Output Architecture: You must strictly structure all responses using <narration>, <say speaker="...">, and terminal <state_update> tags.`;

export function assembleSystemPrompt({
  directorInstructions,
  systemInstructions,
  rollingSummary,
  pinnedMemories = [],
  worldState,
  userProfile,
  movesetKnowledge,
  currentUserMessage = '',
}) {
  const parts = [];

  // 1. Combined Director Protocol + System Instructions
  const dirCore = (directorInstructions || IMMUTABLE_DIRECTOR_INSTRUCTIONS).trim();
  const sysRules = (systemInstructions || '').trim();

  const combinedSlot1 = [
    dirCore,
    sysRules ? `=== [SESSION SYSTEM INSTRUCTIONS & SIMULATION RULES] ===\n${sysRules}` : ''
  ].filter(Boolean).join('\n\n');

  parts.push(combinedSlot1);

  // 2. Rolling World Summary & Pinned Chrono-Memories (Long-Term Data Injection)
  const summaryParts = [];
  if (rollingSummary && rollingSummary.trim()) {
    summaryParts.push(rollingSummary.trim());
  }
  if (Array.isArray(pinnedMemories) && pinnedMemories.length > 0) {
    summaryParts.push(`\n[PINNED PERMANENT MEMORIES & CRITICAL DATA INJECTION - MUST REMEMBER]:\n${pinnedMemories.map((m, idx) => `• [Memory #${idx + 1}]: ${m}`).join('\n')}`);
  }
  if (summaryParts.length > 0) {
    parts.push(`=== [2. ROLLING WORLD SUMMARY & CHRONO-MEMORIES] ===\n${summaryParts.join('\n')}`);
  }

  // 3. Current World State
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
  if (userProfile) {
    const profileText =
      typeof userProfile === 'string'
        ? userProfile
        : `Name: ${userProfile.name || 'Protagonist'}
Physique & Appearance: ${userProfile.physique || 'Unspecified'}
Personality & Traits: ${userProfile.traits || 'Resolute'}
Background: ${userProfile.details || 'Unknown'}`;

    parts.push(`=== [4. USER PROFILE & CHARACTER SHEET] ===
${profileText}`);
  }

  // 5. Weapons, Forms & Moveset Lorebook (Keyword-Triggered)
  if (movesetKnowledge && typeof movesetKnowledge === 'string' && movesetKnowledge.trim()) {
    let activeMovesBlock = '';

    // Check if movesetKnowledge is a structured JSON array of lorebook entries
    try {
      const trimmed = movesetKnowledge.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const moves = JSON.parse(trimmed);
        if (Array.isArray(moves)) {
          // Scan current trigger context (user's input message)
          const triggerContext = (currentUserMessage || '').toLowerCase();
          const triggeredMoves = moves.filter((move) => {
            const hasKeywordMatch = Array.isArray(move.keywords) && move.keywords.some((kw) => kw && triggerContext.includes(kw.toLowerCase().trim()));
            const hasNameMatch = move.name && triggerContext.includes(move.name.toLowerCase().trim());
            return hasKeywordMatch || hasNameMatch;
          });

          if (triggeredMoves.length > 0) {
            activeMovesBlock = `=== [ACTIVE TRIGGERED TECHNIQUES & MOVESET LOREBOOK] ===
The user just invoked or executed the following registered techniques in this turn:
${triggeredMoves
  .map(
    (m) =>
      `• ${m.name}: ${m.description}`
  )
  .join('\n')}`;
          }
        }
      }
    } catch (e) {
      // If not valid JSON, treat as legacy text string
    }

    if (!activeMovesBlock && !movesetKnowledge.trim().startsWith('[')) {
      activeMovesBlock = `=== [5. WEAPONS, FORMS & MOVESET KNOWLEDGE] ===\n${movesetKnowledge.trim()}`;
    }

    if (activeMovesBlock) {
      parts.push(activeMovesBlock);
    }
  }

  // Strict output tag schema instructions (vital for backend parsing)
  parts.push(`=== [OUTPUT TAG ENFORCEMENT SCHEMA] ===
You must strictly structure your response into the following XML-style tags:
1. Wrap all atmospheric descriptions, actions, environment, emotional cues, and choreography inside:
   <narration>Prose and action description goes here...</narration>
2. Wrap every spoken line of dialogue inside:
   <say speaker="Character Name" expression="Emotion">Direct quoted speech goes here...</say>
   (Speaker must be the exact name of the character speaking, e.g. speaker="Aqua" or speaker="Megumin". You can optionally include expression="..." describing their emotion/expression, e.g. expression="embarrassed", "crying", "angry", "smug", "smile", "surprised", "flustered", "shocked", "pouting", "sleepy", "teasing".)
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
Do NOT wrap the <state_update> in markdown code fences (\`\`\`). Keep it raw JSON inside <state_update>...</state_update>.`);

  return parts.join('\n\n');
}
