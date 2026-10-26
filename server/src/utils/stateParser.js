/**
 * Extracts and parses <state_update>{...}</state_update> JSON block from raw LLM output.
 * Cleans the raw content by removing the state_update tag before storage or display.
 */
export function extractStateUpdate(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { stateUpdate: null, cleanedText: rawText || '' };
  }

  // Normalize any unicode-escaped tags
  const normalized = rawText
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  const match = normalized.match(/<state_update>([\s\S]*?)<\/state_update>/i);
  if (!match) {
    return { stateUpdate: null, cleanedText: normalized };
  }

  let stateUpdate = null;
  const jsonStr = match[1].trim();

  try {
    // Strip markdown code block wrapper if model inadvertently added it
    const cleanJson = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    stateUpdate = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[StateParser] Failed to parse JSON in <state_update>:', err.message, jsonStr);
  }

  // Remove the <state_update>...</state_update> block from cleaned text
  const cleanedText = normalized.replace(/<state_update>[\s\S]*?<\/state_update>/gi, '').trim();

  return { stateUpdate, cleanedText };
}
