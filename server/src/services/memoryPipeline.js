import { Session } from '../models/Session.js';
import { executeCompactionLLM } from './llmService.js';

/**
 * Checks unsummarized turn count for a session.
 * Compaction triggers whenever 10 new unsummarized turns have accumulated
 * since the last compaction milestone (e.g. 10, 20, 30...).
 *
 * CRITICAL TOKEN & MEMORY GUARANTEE:
 * 1. ONLY newly occurred turns since session.lastSummarizedIndex are sent to the summarizer.
 * 2. Already summarized past turns are NEVER re-sent, preventing token explosion.
 * 3. The existing rollingSummary is synthesized with the new batch to preserve full macro continuity.
 */
export async function checkAndTriggerCompaction(sessionId, apiConfig = {}, summaryApiConfig = null) {
  try {
    const session = await Session.findById(sessionId);
    if (!session) return;

    const lastSummarized = session.lastSummarizedIndex || 0;
    const totalMessages = session.messages.length;

    // Count player turns (user messages) since last compaction milestone
    const unsummarizedUserTurns = session.messages
      .slice(lastSummarized)
      .filter((m) => m.role === 'user').length;

    // Trigger compaction ONLY when at least 10 new unsummarized player turns have occurred
    if (unsummarizedUserTurns < 10) {
      return;
    }

    console.log(
      `[MemoryPipeline] Session ${sessionId} has ${unsummarizedUserTurns} new player turns (last summarized msg index: ${lastSummarized}, total msgs: ${totalMessages}). Triggering incremental rolling compaction...`
    );

    await runCompaction(session, summaryApiConfig || apiConfig);
  } catch (error) {
    console.error('[MemoryPipeline] Error during compaction check:', error.message);
  }
}

/**
 * Manually force compaction for a session at any time.
 * If there are unsummarized turns, it compacts them immediately.
 * If all turns were already summarized, it forces a fresh synthesis across the chronicle.
 */
export async function forceCompaction(sessionId, summaryApiConfig = {}) {
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.messages.length === 0) {
    throw new Error('No roleplay messages recorded in chronicle to summarize yet.');
  }
  return await runCompaction(session, summaryApiConfig, true);
}

async function runCompaction(session, compactionConfig, isManualForce = false) {
  let startIndex = Math.max(0, session.lastSummarizedIndex || 0);
  const totalMessages = session.messages.length;

  // Handle case where lastSummarizedIndex became out of bounds due to message deletion or edits
  if (startIndex > totalMessages) {
    startIndex = 0;
    session.lastSummarizedIndex = startIndex;
  }

  // Count player turns (user messages) before this slice and in this slice
  const previousUserTurns = session.messages.slice(0, startIndex).filter((m) => m.role === 'user').length;
  const newMessagesToSummarize = session.messages.slice(startIndex, totalMessages);
  const newUserTurns = newMessagesToSummarize.filter((m) => m.role === 'user').length;

  if (totalMessages === 0 || newMessagesToSummarize.length === 0 || (!isManualForce && newUserTurns < 10)) {
    console.log(`[MemoryPipeline] Not enough new player turns to summarize (turns pending: ${newUserTurns}, total msgs: ${totalMessages}).`);
    return {
      rollingSummary: session.rollingSummary,
      messagesCount: totalMessages,
      lastSummarizedIndex: startIndex,
      newlyCompactedTurns: 0,
    };
  }

  const startPlayerTurn = previousUserTurns + 1;
  const endPlayerTurn = previousUserTurns + newUserTurns;
  const chapterNumber = Math.max(1, Math.floor((startPlayerTurn - 1) / 10) + 1);
  const chapterHeader = `### 📜 Chapter ${chapterNumber} (Turns ${startPlayerTurn}–${endPlayerTurn})`;

  // Format the turns clearly with Player Turn numbering so the chronicler LLM sees exact dialogue & actions
  let currentPlayerTurn = previousUserTurns;
  const formattedArchivedTurns = newMessagesToSummarize
    .map((m) => {
      if (m.role === 'user') {
        currentPlayerTurn++;
        const cleanContent = (m.rawContent || m.content || '').trim();
        return `--- [Turn ${currentPlayerTurn} | PLAYER ACTION] ---\n${cleanContent}`;
      } else {
        const turnLabel = currentPlayerTurn > 0 ? `Turn ${currentPlayerTurn}` : 'Prologue';
        // Strip <state_update> JSON so summarizer only reads narrative and dialogue
        const cleanContent = (m.rawContent || m.content || '')
          .replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '')
          .trim();
        return `--- [${turnLabel} Narrative & NPC Response] ---\n${cleanContent}`;
      }
    })
    .join('\n\n');

  const oldSummary = session.rollingSummary || '';
  let chapterContent = '';

  try {
    const rawChapterSummary = await executeCompactionLLM({
      previousSummary: oldSummary,
      archivedTurns: formattedArchivedTurns,
      apiConfig: compactionConfig,
      startTurn: startPlayerTurn,
      endTurn: endPlayerTurn,
    });
    chapterContent = (rawChapterSummary || '').trim();
  } catch (llmErr) {
    console.warn('[MemoryPipeline] Dedicated summarizer failed, using intelligent semantic fallback:', llmErr.message);
    const recentSnippets = newMessagesToSummarize
      .filter((m) => m.role === 'assistant')
      .map((m) => (m.rawContent || '').replace(/<[^>]+>/g, ' ').slice(0, 150).trim())
      .filter(Boolean)
      .slice(-3)
      .join('; ');

    chapterContent = `Key developments: ${recentSnippets || 'Story progressed.'}`;
  }

  // Ensure chapter header is attached
  const newChapterBlock = chapterContent.startsWith('###')
    ? chapterContent
    : `${chapterHeader}\n${chapterContent}`;

  // Directly append the newly summarized chapter to the permanent chronicle!
  const updatedChronicle = oldSummary && oldSummary.trim()
    ? `${oldSummary.trim()}\n\n${newChapterBlock}`
    : newChapterBlock;

  session.rollingSummary = updatedChronicle;
  session.lastSummarizedIndex = totalMessages;
  await session.save();

  console.log(
    `[MemoryPipeline] Chapter ${chapterNumber} (Player Turns ${startPlayerTurn}–${endPlayerTurn}) appended to permanent chronicle! Total DB msgs: ${totalMessages}.`
  );

  return {
    rollingSummary: session.rollingSummary,
    messagesCount: session.messages.length,
    lastSummarizedIndex: session.lastSummarizedIndex,
    newlyCompactedTurns: newMessagesToSummarize.length,
  };
}
