/**
 * Streaming-Safe Roleplay Tag Parser
 * 
 * Extracts:
 * - <narration>...</narration> -> { type: 'narration', content: string }
 * - <say speaker="Character Name">...</say> -> { type: 'say', speaker: string, content: string }
 * - <state_update>...</state_update> -> parsed JSON object, strictly stripped from visual blocks
 * 
 * Handles incomplete/streaming tokens gracefully without breaking layout or leaking raw tags.
 */

function cleanBlockText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<\/?(?:narration|say)[^>]*>/gi, '')
    .replace(/<\/?p\s*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\u003c\/?p\s*\\u003e/gi, '\n\n')
    .replace(/&lt;\/?p\s*&gt;/gi, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseRoleplayBlocks(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { blocks: [], stateUpdate: null };
  }

  // Normalize any unicode-escaped or HTML-escaped tags (e.g. \u003cnarration\u003e or &lt;say&gt;)
  const normalizedText = rawText
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // 1. Separate and extract <state_update> (whether complete or actively streaming)
  let stateUpdate = null;
  let textToParse = normalizedText;

  const stateUpdateMatch = normalizedText.match(/<state_update>([\s\S]*?)(?:<\/state_update>|$)/i);
  if (stateUpdateMatch) {
    const jsonContent = stateUpdateMatch[1].trim();
    if (jsonContent) {
      try {
        const cleanJson = jsonContent
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/```$/, '')
          .trim();
        stateUpdate = JSON.parse(cleanJson);
      } catch (e) {
        // May be incomplete while streaming; ignore until complete JSON is received
      }
    }
    // Remove the state_update tag completely from visible chat stream
    textToParse = normalizedText.replace(/<state_update>[\s\S]*?(?:<\/state_update>|$)/gi, '');
  }

  const blocks = [];
  
  // Resilient regex to match tags even if LLM uses mismatched closing tags (e.g. <narration>...</say>)
  // or leaves a tag unclosed before the next block begins
  const tokenRegex = /<(narration|say)([^>]*)>([\s\S]*?)(?:<\/(?:narration|say)>|(?=<(?:narration|say|state_update)[\s>])|$)/gi;

  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(textToParse)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;
    const tagName = match[1].toLowerCase();
    const tagAttrs = match[2] || '';
    const content = match[3] || '';

    // If there is untagged text before this tag, treat it as ambient narration
    const untaggedPrefix = cleanBlockText(textToParse.substring(lastIndex, matchIndex));
    if (untaggedPrefix) {
      blocks.push({
        type: 'narration',
        content: untaggedPrefix,
        isUntagged: true
      });
    }

    if (tagName === 'narration') {
      const cleanContent = cleanBlockText(content);
      if (cleanContent) {
        const isClosed = fullMatch.toLowerCase().includes('</narration>') || fullMatch.toLowerCase().includes('</say>');
        blocks.push({
          type: 'narration',
          content: cleanContent,
          isPartial: !isClosed
        });
      }
    } else if (tagName === 'say') {
      // Extract speaker from attributes
      let speaker = 'Unknown Speaker';
      const speakerMatch = tagAttrs.match(/speaker=["']([^"']+)["']/i) || tagAttrs.match(/speaker=([^\s>]+)/i);
      if (speakerMatch && speakerMatch[1]) {
        speaker = speakerMatch[1].trim();
      }

      // Extract expression / emotion if present
      let expression = '';
      const exprMatch = tagAttrs.match(/(?:expression|emotion)=["']([^"']+)["']/i) || tagAttrs.match(/(?:expression|emotion)=([^\s>]+)/i);
      if (exprMatch && exprMatch[1]) {
        expression = exprMatch[1].trim();
      }

      const cleanContent = cleanBlockText(content);
      if (cleanContent) {
        const isClosed = fullMatch.toLowerCase().includes('</say>') || fullMatch.toLowerCase().includes('</narration>');
        blocks.push({
          type: 'say',
          speaker,
          expression,
          content: cleanContent,
          isPartial: !isClosed
        });
      }
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // If no tags were found at all or there's leftover text that has no tags
  if (lastIndex < textToParse.length) {
    const remaining = cleanBlockText(textToParse.substring(lastIndex));
    if (remaining) {
      // Check if it's the start of an incomplete tag like `<say speaker="`
      if (!remaining.startsWith('<')) {
        blocks.push({
          type: 'narration',
          content: remaining,
          isPartial: true
        });
      }
    }
  }

  // Fallback: If input exists but no blocks were parsed (e.g. initial token before tag completes)
  if (blocks.length === 0 && textToParse.trim()) {
    const cleanFull = cleanBlockText(textToParse);
    if (cleanFull && !cleanFull.startsWith('<')) {
      blocks.push({
        type: 'narration',
        content: cleanFull,
        isPartial: true
      });
    }
  }

  return { blocks, stateUpdate };
}
