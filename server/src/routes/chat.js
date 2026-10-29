import express from 'express';
import { Session } from '../models/Session.js';
import { WorldState } from '../models/WorldState.js';
import { assembleSystemPrompt, IMMUTABLE_DIRECTOR_INSTRUCTIONS } from '../services/promptAssembler.js';
import { streamRoleplayCompletion } from '../services/llmService.js';
import { extractStateUpdate } from '../utils/stateParser.js';
import { checkAndTriggerCompaction } from '../services/memoryPipeline.js';

/**
 * Slices the last N player turns and all generated assistant responses combined together.
 * For example, a window of 10 player turns preserves the last 10 player actions AND all
 * assistant narration/dialogues that took place between them (~20 messages in context).
 */
function getWindowedMessages(messages, windowInTurns = 10) {
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

const router = express.Router();

/**
 * POST /api/roleplay/chat
 * Unified SSE streaming route for roleplay turns
 */
router.post('/', async (req, res) => {
  const { sessionId, userMessage, reroll = false, continueTurn = false, samplers = {}, contextOverrides = {} } = req.body;

  // Extract BYOK headers
  const apiKey = req.headers['x-api-key'] || req.body.apiKey;
  const provider = req.headers['x-provider'] || req.body.provider || 'openrouter';
  const model = req.headers['x-model'] || req.body.model;
  const customBaseUrl = req.headers['x-custom-proxy-url'] || req.body.customBaseUrl;

  // Extract Dedicated Summary Model headers
  const summaryApiKey = req.headers['x-summary-api-key'] || req.body.summaryApiKey;
  const summaryProvider = req.headers['x-summary-provider'] || req.body.summaryProvider;
  const summaryModel = req.headers['x-summary-model'] || req.body.summaryModel;

  const apiConfig = { apiKey, provider, model, customBaseUrl };
  const summaryApiConfig = summaryApiKey ? { apiKey: summaryApiKey, provider: summaryProvider, model: summaryModel, customBaseUrl } : null;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  if (provider !== 'custom' && (!apiKey || !apiKey.trim())) {
    sendEvent({
      error: 'API_KEY_NOT_CONNECTED',
      message: 'API key is not connected. Please connect your API key in Settings to begin.'
    });
    return res.end();
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      sendEvent({ error: 'Session not found' });
      return res.end();
    }

    let worldState = await WorldState.findOne({ sessionId: session._id });
    if (!worldState) {
      worldState = await WorldState.create({ sessionId: session._id });
    }

    let targetSwipeMessage = null;
    let isRerollCandidate = false;

    // Handle Regenerate: replaces the last assistant turn with a fresh response
    if (reroll) {
      if (session.messages.length > 0 && session.messages[session.messages.length - 1].role === 'assistant') {
        targetSwipeMessage = session.messages[session.messages.length - 1];
        isRerollCandidate = true;
      }
    } else if (userMessage && userMessage.trim()) {
      // Append user turn
      session.messages.push({
        role: 'user',
        rawContent: userMessage.trim(),
        timestamp: new Date()
      });
      await session.save();
    }

    // Prepare prompt message history (for reroll, exclude the last assistant response from prompt context so model generates a fresh alternative)
    const messagesForPrompt = isRerollCandidate
      ? session.messages.slice(0, session.messages.length - 1)
      : session.messages;

    // Apply active sliding window in Player Turns (user configurable, default: 10 player turns)
    // 10 player turns includes both the 10 user prompts and all generated assistant responses combined together (~20 messages)
    const slidingWindowTurns = Math.max(2, parseInt(samplers?.sliding_window || 10, 10));
    const windowedMessages = getWindowedMessages(messagesForPrompt, slidingWindowTurns);

    // Strip old <state_update> blocks from assistant turns in the prompt history to save tokens
    const promptMessages = windowedMessages.map((m) => {
      const content = m.rawContent || m.content || '';
      if (m.role === 'assistant') {
        const stripped = content.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '').trim();
        return {
          role: 'assistant',
          content: stripped,
          rawContent: stripped,
        };
      }
      return {
        role: 'user',
        content,
        rawContent: content,
      };
    });

    // Assemble system prompt combining Director protocol and editable System Instructions
    const systemPrompt = assembleSystemPrompt({
      directorInstructions: IMMUTABLE_DIRECTOR_INSTRUCTIONS,
      systemInstructions: contextOverrides.systemInstructions ?? session.systemInstructions,
      rollingSummary: session.rollingSummary,
      pinnedMemories: session.pinnedMemories,
      worldState,
      userProfile: contextOverrides.userProfile ?? session.userProfile,
      movesetKnowledge: contextOverrides.movesetKnowledge ?? session.movesetKnowledge,
      currentUserMessage: userMessage || (session.messages.length > 0 && session.messages[session.messages.length - 1].role === 'user' ? session.messages[session.messages.length - 1].rawContent : ''),
      samplers,
    });

    sendEvent({ type: 'start', timestamp: Date.now() });

    let fullAccumulatedText = '';

    // Stream tokens
    for await (const token of streamRoleplayCompletion({
      systemPrompt,
      messages: promptMessages,
      samplers,
      apiConfig
    })) {
      fullAccumulatedText += token;
      sendEvent({ token });
    }

    // Parse state update
    const { stateUpdate, cleanedText } = extractStateUpdate(fullAccumulatedText);

    if (stateUpdate && typeof stateUpdate === 'object') {
      try {
        if (stateUpdate.universe) worldState.universe = stateUpdate.universe;
        if (stateUpdate.currentEra) worldState.currentEra = stateUpdate.currentEra;
        if (stateUpdate.inGameDate) worldState.inGameDate = stateUpdate.inGameDate;
        if (stateUpdate.timeOfDay) worldState.timeOfDay = stateUpdate.timeOfDay;
        if (stateUpdate.currentLocation) worldState.currentLocation = stateUpdate.currentLocation;
        if (stateUpdate.weather) worldState.weather = stateUpdate.weather;
        if (stateUpdate.sceneMood) worldState.sceneMood = stateUpdate.sceneMood;
        if (stateUpdate.musicTrackQuery) worldState.musicTrackQuery = stateUpdate.musicTrackQuery;
        if (Array.isArray(stateUpdate.knownNPCs) && stateUpdate.knownNPCs.length > 0) {
          const existingMap = new Map((worldState.knownNPCs || []).map((npc) => [npc.name?.toLowerCase().trim(), npc]));

          stateUpdate.knownNPCs.forEach((newNpc) => {
            if (!newNpc || !newNpc.name) return;
            const key = newNpc.name.toLowerCase().trim();
            const existing = existingMap.get(key);

            let affinity = typeof newNpc.affinity === 'number' ? newNpc.affinity : (existing?.affinity ?? 50);
            affinity = Math.max(0, Math.min(100, Math.round(affinity)));

            let bondTier = newNpc.bondTier || existing?.bondTier;
            if (!bondTier) {
              if (affinity >= 90) bondTier = 'Devoted / Sworn';
              else if (affinity >= 75) bondTier = 'Trusted Companion';
              else if (affinity >= 60) bondTier = 'Friendly Ally';
              else if (affinity >= 40) bondTier = 'Acquaintance';
              else if (affinity >= 20) bondTier = 'Wary / Distant';
              else bondTier = 'Hostile / Rival';
            }

            // Determine active scene presence
            let isPresent = true;
            if (typeof newNpc.isPresent === 'boolean') {
              isPresent = newNpc.isPresent;
            } else if (newNpc.status && /\b(back at|away|elsewhere|left behind|slumbering|in the field|resting in|observing from|traveling to|absent|not present|far away|departed|at home|locked in|dead|slain)\b/i.test(newNpc.status)) {
              isPresent = false;
            } else if (existing && typeof existing.isPresent === 'boolean') {
              isPresent = existing.isPresent;
            }

            existingMap.set(key, {
              name: newNpc.name,
              relation: newNpc.relation || existing?.relation || 'Acquaintance',
              status: newNpc.status || existing?.status || 'Active',
              isPresent,
              affinity,
              bondTier,
            });
          });

          worldState.knownNPCs = Array.from(existingMap.values());
        }
        await worldState.save();
      } catch (wsErr) {
        console.warn('[ChatRoute] Error saving worldState updates:', wsErr.message);
      }
    }

    // Save or update assistant message in Session (Regenerate replaces last assistant turn)
    if (isRerollCandidate && targetSwipeMessage) {
      targetSwipeMessage.rawContent = fullAccumulatedText;
      targetSwipeMessage.timestamp = new Date();
    } else {
      session.messages.push({
        role: 'assistant',
        rawContent: fullAccumulatedText,
        timestamp: new Date()
      });
    }
    await session.save();

    // Trigger background memory compaction automatically when 10 new unsummarized player turns (user messages) have accumulated
    const unsummarizedUserTurns = session.messages
      .slice(session.lastSummarizedIndex || 0)
      .filter((m) => m.role === 'user').length;

    if (unsummarizedUserTurns >= 10) {
      checkAndTriggerCompaction(session._id, apiConfig, summaryApiConfig).catch((err) => {
        console.warn('[ChatRoute] Background compaction error:', err.message);
      });
    }

    const activeMsg = session.messages[session.messages.length - 1];

    // Send completion event
    sendEvent({
      done: true,
      fullContent: fullAccumulatedText,
      cleanedContent: cleanedText,
      stateUpdate,
      worldState,
      messageId: activeMsg._id,
      swipes: activeMsg.swipes,
      swipeIndex: activeMsg.swipeIndex
    });

    res.end();
  } catch (err) {
    console.error('[ChatRoute] Streaming error:', err);
    sendEvent({ error: err.message || 'Stream processing failed' });
    res.end();
  }
});

export default router;
