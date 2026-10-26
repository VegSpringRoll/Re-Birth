import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const yandexScriptPath = path.resolve(__dirname, '../../scripts/yandex_search.py');

/**
 * Strict regex-based scene action extractor with word boundaries to eliminate false positives
 */
export function extractActionFromText(character = '', sceneText = '') {
  const text = sceneText.toLowerCase();

  // Narrow focus to sentences mentioning this specific character if present
  let focusText = text;
  if (character && character.trim()) {
    const charClean = character.trim().toLowerCase();
    const charRegex = new RegExp(`\\b${charClean}\\b`, 'i');
    if (charRegex.test(text)) {
      const sentences = text.split(/(?<=[.!?\n])/);
      const relevant = sentences.filter(s => charRegex.test(s));
      if (relevant.length > 0) focusText = relevant.join(' ');
    }
  }

  // 1. Emotional expressions & immediate physical reactions
  if (/\b(?:danc(?:e|ing|es|ed)|waltz|happy dance)\b/i.test(focusText)) return 'dancing';
  if (/\b(?:cry(?:ing|ies|ied)?|tears|sob(?:bing|bed)?|bawl(?:ing|ed)?|waaa+|uwooo+)\b/i.test(focusText)) return 'crying';
  if (/\b(?:indignant|outraged|infuriated|how dare|offended|furious|livid|pissed off)\b/i.test(focusText)) return 'indignant shouting';
  if (/\b(?:panic(?:ked|king|s)?|terrified|horrified|freak(?:ing)? out|alarmed)\b/i.test(focusText)) return 'panicking';
  if (/\b(?:scream(?:ing|ed|s)?|screech(?:ing)?|shout(?:ing|ed|s)?|yell(?:ing|ed|s)?|kyaaa+)\b/i.test(focusText)) return 'screaming';
  if (/\b(?:blush(?:ing|ed|es)?|embarrass(?:ed|ing)?|fluster(?:ed)?|shy(?:ly)?|red-faced)\b/i.test(focusText)) return 'blushing';
  if (/\b(?:smug(?:ly)?|fufufu|mocking(?:ly)?|superior smile|cocky)\b/i.test(focusText)) return 'smug face';
  if (/\b(?:pout(?:ing|ed|s)?|sulking|sulked|cheeks? puff(?:ed)?)\b/i.test(focusText)) return 'pouting';
  if (/\b(?:laugh(?:ing|ed|s)?|giggle?s?|giggling|chuckle?s?|chuckling|haha+|hehe+)\b/i.test(focusText)) return 'laughing';

  // 2. Physical scene activities
  if (/\b(?:drinks?|drinking|drank|drunk|chug(?:ged|ging)?|toast(?:ing)?|cheers)\b/i.test(focusText)) return 'drinking beer';
  if (/\b(?:explosion|cast(?:ing)?|magic spell|spellcast|chant(?:ing)?|staff|wand)\b/i.test(focusText)) return 'casting magic';
  if (/\b(?:slash(?:ing|ed)?|sword(?:play)?|punch(?:ing|ed)?|striking|combat|battle)\b/i.test(focusText)) return 'fighting combat';
  if (/\b(?:run(?:ning)? away|flee(?:ing)?|flees|fled|sprint(?:ing)?|escap(?:ing|ed))\b/i.test(focusText)) return 'running away';
  if (/\b(?:sleep(?:ing)?|slept|asleep|nap(?:ping)?|drowsy|yawn(?:ing)?)\b/i.test(focusText)) return 'sleeping';

  // 3. Eating strictly requires eating keywords + explicit food context (prevents 'great', 'threat', 'defeat' bug)
  if (/\b(?:eating|eats|ate|snacking|munching|chewing|feasting)\s+(?:on\s+)?(?:(?:a|an|the|some|delicious|roasted|hot|warm)\s+)?(?:food|meat|bread|snack|dinner|lunch|breakfast|meal|apple|cake|ramen|soup|pie|feast)\b/i.test(focusText)
      || /\b(?:feasting on|munching on)\b/i.test(focusText)) {
    return 'eating food';
  }

  return 'anime scene';
}

/**
 * Calls Yandex image search script (safesearch='off' / family=0) via imgsearch-api & direct engine
 */
export async function runYandexSearch(query, maxResults = 10, safesearch = 'off') {
  return new Promise((resolve) => {
    try {
      const py = spawn('python', [
        yandexScriptPath,
        query,
        '--max', String(maxResults),
        '--safesearch', safesearch
      ]);

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('close', (code) => {
        if (code !== 0) {
          console.error(`[YandexSearch] Python script exited with code ${code}: ${stderr}`);
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed.results || []);
        } catch (e) {
          console.warn(`[YandexSearch] JSON parse error on stdout (${stdout.slice(0, 100)}...):`, e.message);
          resolve([]);
        }
      });

      py.on('error', (err) => {
        console.error(`[YandexSearch] Failed to spawn python script:`, err.message);
        resolve([]);
      });
    } catch (err) {
      console.error(`[YandexSearch] Unexpected error:`, err);
      resolve([]);
    }
  });
}

/**
 * Detects what a character is doing in a given scene and performs Yandex image scrape
 */
export async function detectAndSearchCharacterAction({
  character,
  universe = '',
  sceneText = '',
  customAction = '',
  apiConfig = null,
}) {
  let detectedAction = customAction ? customAction.trim() : '';

  // 1. If no custom action provided, detect using LLM if apiConfig is available
  if (!detectedAction && apiConfig && apiConfig.apiKey) {
    try {
      const { provider = 'openrouter', apiKey, model, customBaseUrl } = apiConfig;
      const cleanKey = apiKey.trim();

      const prompt = `You are an anime visual scene analyzer.
Analyze the scene excerpt below for character "${character}" from anime "${universe}".
Scene:
"${sceneText.slice(0, 1200)}"

Identify in 1 to 3 words what "${character}" is doing or their immediate physical reaction in this scene (e.g. "dancing", "crying dramatically", "indignant shouting", "panicking", "drinking beer", "smug grin", "casting explosion magic").
Respond ONLY with a raw JSON object, no explanation:
{
  "action": "short action or reaction phrase",
  "searchKeywords": "action keywords"
}`;

      let actionResponse = null;

      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${cleanKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (res.ok) {
          const json = await res.json();
          const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) actionResponse = JSON.parse(match[0]);
        }
      } else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const raw = json.content?.[0]?.text || '';
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) actionResponse = JSON.parse(match[0]);
        }
      } else {
        // OpenAI / OpenRouter / Groq / Mistral / Custom compatible endpoints
        let endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        if (provider === 'openai') {
          endpoint = 'https://api.openai.com/v1/chat/completions';
        } else if (provider === 'groq') {
          endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        } else if (provider === 'mistral') {
          endpoint = 'https://api.mistral.ai/v1/chat/completions';
        } else if (provider === 'custom') {
          endpoint = `${(customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '')}/chat/completions`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model: model || (provider === 'openai' ? 'gpt-4o-mini' : 'meta-llama/llama-3.3-70b-instruct'),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 100
          })
        });

        if (res.ok) {
          const json = await res.json();
          const raw = json.choices?.[0]?.message?.content || '';
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) actionResponse = JSON.parse(match[0]);
        }
      }

      if (actionResponse && actionResponse.action) {
        detectedAction = actionResponse.action.trim();
      }
    } catch (e) {
      console.warn('[CharacterAction] LLM detection error, using regex fallback:', e.message);
    }
  }

  // 2. Fallback to rule-based extractor if not resolved
  if (!detectedAction) {
    detectedAction = extractActionFromText(character, sceneText);
  }

  // 3. Format optimal search query for Yandex
  const cleanChar = character ? character.trim() : '';
  const cleanUni = universe ? universe.trim() : '';
  const searchQuery = `${cleanChar} ${cleanUni} ${detectedAction}`.replace(/\s+/g, ' ').trim();

  // 4. Run Yandex Image Scraper with safesearch='off'
  const images = await runYandexSearch(searchQuery, 10, 'off');

  return {
    character: cleanChar,
    universe: cleanUni,
    action: detectedAction,
    searchQuery,
    results: images,
    count: images.length
  };
}
