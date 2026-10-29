/**
 * LLM Service supporting:
 * - OpenRouter (Claude 3.5 Sonnet, Llama 3.3, DeepSeek R1, etc.)
 * - Anthropic Claude
 * - OpenAI (GPT-4o, GPT-4o-mini)
 * - Google Gemini (Gemini 1.5 Pro, Flash)
 * - Dynamic Universe-Aware Simulator (when no API key is provided)
 */

export function decodeUnicodeTags(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export async function* streamRoleplayCompletion({
  systemPrompt,
  messages,
  samplers = {},
  apiConfig = {},
}) {
  const { provider = 'openrouter', apiKey, model } = apiConfig;
  const temperature = Number(samplers.temperature ?? 0.85);
  const topP = Number(samplers.top_p ?? 0.95);
  const frequencyPenalty = Number(samplers.frequency_penalty ?? 0.2);
  const maxTokens = Number(samplers.max_tokens ?? 1200);

  if (provider !== 'custom' && (!apiKey || !apiKey.trim())) {
    throw new Error('API_KEY_NOT_CONNECTED: No API key provided. Please connect your API key in Settings to begin.');
  }

  if (provider === 'anthropic') {
    yield* streamAnthropic({ systemPrompt, messages, apiKey, model: model || 'claude-3-5-sonnet-20241022', temperature, topP, maxTokens });
    return;
  }

  if (provider === 'gemini') {
    yield* streamGemini({ systemPrompt, messages, apiKey, model: model || 'gemini-1.5-pro', temperature, topP, maxTokens });
    return;
  }

  // Default to OpenAI-compatible endpoint (Custom Proxy, Mistral, Groq, OpenAI, or OpenRouter)
  let baseUrl;
  let defaultModel;

  if (provider === 'custom') {
    baseUrl = (apiConfig.customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
    defaultModel = 'default';
  } else if (provider === 'mistral') {
    baseUrl = 'https://api.mistral.ai/v1';
    defaultModel = 'mistral-large-latest';
  } else if (provider === 'groq') {
    baseUrl = 'https://api.groq.com/openai/v1';
    defaultModel = 'llama-3.3-70b-versatile';
  } else if (provider === 'openai') {
    baseUrl = 'https://api.openai.com/v1';
    defaultModel = 'gpt-4o';
  } else {
    baseUrl = 'https://openrouter.ai/api/v1';
    defaultModel = 'anthropic/claude-3.5-sonnet';
  }

  yield* streamOpenAICompatible({
    baseUrl,
    apiKey,
    model: model || defaultModel,
    systemPrompt,
    messages,
    temperature,
    topP,
    frequencyPenalty,
    minTokens: samplers.min_tokens ? Number(samplers.min_tokens) : undefined,
    maxTokens,
    extraHeaders: provider === 'openrouter' ? {
      'HTTP-Referer': 'https://rebirth.local',
      'X-Title': 'Re-Birth Anime Roleplay Engine'
    } : {}
  });
}

/**
 * Streams from OpenAI or OpenRouter compatible completions endpoint
 */
async function* streamOpenAICompatible({
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  messages,
  temperature,
  topP,
  frequencyPenalty,
  minTokens,
  maxTokens,
  extraHeaders = {}
}) {
  const systemMessage = baseUrl.includes('openrouter.ai')
    ? {
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ]
      }
    : { role: 'system', content: systemPrompt };

  const chatMessages = [
    systemMessage,
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.rawContent || m.content
    }))
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey?.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      ...(minTokens ? { min_tokens: minTokens } : {}),
      max_tokens: maxTokens || 1200,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API returned ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') return;
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch (e) {}
      }
    }
  }
}

/**
 * Streams from Anthropic Messages API
 */
async function* streamAnthropic({ systemPrompt, messages, apiKey, model, temperature, topP, maxTokens }) {
  const formattedMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.rawContent || m.content
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    body: JSON.stringify({
      model,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: formattedMessages,
      max_tokens: maxTokens || 1200,
      temperature: Math.min(1.0, temperature),
      top_p: topP,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API returned ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const event = JSON.parse(trimmed.slice(6));
          if (event.type === 'content_block_delta' && event.delta?.text) {
            yield event.delta.text;
          }
        } catch (e) {}
      }
    }
  }
}

/**
 * Streams from Google Gemini API
 */
async function* streamGemini({ systemPrompt, messages, apiKey, model, temperature, topP, maxTokens }) {
  const contents = [
    {
      role: 'user',
      parts: [{ text: `[SYSTEM INSTRUCTIONS]:\n${systemPrompt}\n\nAcknowledge and prepare.` }]
    },
    {
      role: 'model',
      parts: [{ text: 'System parameters acknowledged. Ready to conduct roleplay.' }]
    },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.rawContent || m.content }]
    }))
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        topP,
        maxOutputTokens: maxTokens || 1200
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            yield decodeUnicodeTags(textPart);
          }
        } catch (e) {}
      } else if (trimmed.startsWith('"text": "')) {
        // Fallback for non-SSE chunks
        try {
          const parsedVal = JSON.parse('{' + trimmed.replace(/,\s*$/, '') + '}');
          if (parsedVal.text) {
            yield decodeUnicodeTags(parsedVal.text);
          }
        } catch (e) {
          const textPart = trimmed.slice(9, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
          yield decodeUnicodeTags(textPart);
        }
      }
    }
  }
}

/**
 * Dynamic Universe-Aware Simulator
 * Extracts the EXACT active universe, current location, era, and canonical NPCs from system prompt
 * so the simulated response NEVER leaks characters across verses!
 */
async function* streamDynamicUniverseSimulator({ messages, systemPrompt = '' }) {
  const lastUserTurn = [...messages].reverse().find((m) => m.role === 'user')?.rawContent || '';

  // Extract Universe from system prompt
  const universeMatch = systemPrompt.match(/- Universe:\s*(.+)/i);
  const currentUniverse = universeMatch ? universeMatch[1].trim() : 'Anime Realm';

  // Extract Era
  const eraMatch = systemPrompt.match(/- Current Era:\s*(.+)/i);
  const currentEra = eraMatch ? eraMatch[1].trim() : 'Active Timeline';

  // Extract Location
  const locMatch = systemPrompt.match(/- Current Location:\s*(.+)/i);
  const currentLocation = locMatch ? locMatch[1].trim() : 'Outskirts Perimeter';

  // Extract Weather
  const weatherMatch = systemPrompt.match(/- Weather \/ Atmosphere:\s*(.+)/i);
  const weather = weatherMatch ? weatherMatch[1].trim() : 'Calm breeze';

  // Extract Known NPCs
  const npcMatches = [...systemPrompt.matchAll(/-\s*([^:]+):\s*([^[\n]+)(?:\[Status:\s*([^\]]+)\])?/gi)];
  const npcs = npcMatches.map((m) => ({
    name: m[1].trim(),
    relation: (m[2] || 'Ally').trim(),
    status: (m[3] || 'Active').trim()
  }));

  const primaryNPC = npcs[0]?.name || 'Companion Guide';
  const secondaryNPC = npcs[1]?.name || (npcs[0]?.name ? `${npcs[0].name}'s Ally` : 'Observer');

  const isCombat = /attack|strike|blade|cast|spell|slash|magic|shoot|punch|curse|domain|technique|draw|fire/i.test(lastUserTurn);
  const isQuestion = /\?|what|where|who|how|why|tell me/i.test(lastUserTurn);

  let scenarioText = '';

  if (currentUniverse.toLowerCase().includes('frieren')) {
    if (isCombat) {
      scenarioText = `<narration>
The quiet cold of the Northern Plateau fractures as mana condenses with piercing clarity. Frost shatters from the pine branches above as your spellcraft cuts through the freezing mist. Frieren's twin twintails drift in the sudden updraft, her turquoise eyes evaluating the mana trajectory with a scholar's detached precision.
</narration>

<say speaker="Frieren">
"That was a clean release of mana. You minimized the ambient dispersion just like Flamme used to teach. Even against greater demons, that strike would leave them with no time to react."
</say>

<narration>
Fern steps into position at the edge of the snowy ridge, her dark staff already drawn and pulsing with the rhythmic hum of rapid-fire Zoltraak.
</narration>

<say speaker="Fern">
"Mistress Frieren is right. But please stay behind my defensive ward until we confirm the demon's mana core has completely dissolved."
</say>

<state_update>
{
  "universe": "Sousou no Frieren",
  "currentEra": "${currentEra}",
  "inGameDate": "Year 28 After Hero Himmel",
  "timeOfDay": "Morning - Mana Frost",
  "currentLocation": "${currentLocation}",
  "weather": "Crisp mountain wind swirling with glowing blue mana motes",
  "knownNPCs": [
    { "name": "Frieren", "relation": "Elven Mage / Legend", "status": "Analyzing spell geometry" },
    { "name": "Fern", "relation": "First-Class Apprentice Mage", "status": "Maintaining defensive ward" },
    { "name": "Stark", "relation": "Warrior Vanguard", "status": "Readying battle axe on the slope" }
  ]
}
</state_update>`;
    } else {
      scenarioText = `<narration>
A peaceful morning breeze weaves through the ancient stones of the ruins. The faint aroma of roasted winter-berries and herbal tea drifts from the iron kettle over the small campfire. Frieren sits upon an overturned column, gently turning the parchment pages of a centuries-old grimoire.
</narration>

<say speaker="Frieren">
"Himmel used to say that the journey itself is where memories are forged. It's only after a hundred years that you realize how fast a human life truly passes. What are you thinking about right now?"
</say>

<narration>
Fern carefully pours warm herbal tea into a wooden cup and offers it to you with a quiet, polite nod.
</narration>

<say speaker="Fern">
"Please drink this before it grows cold. We still have several leagues of the plateau to cross before nightfall."
</say>

<state_update>
{
  "universe": "Sousou no Frieren",
  "currentEra": "${currentEra}",
  "inGameDate": "Year 28 After Hero Himmel",
  "timeOfDay": "Crisp Alpine Noon",
  "currentLocation": "${currentLocation}",
  "weather": "Gentle freezing mountain wind carrying blue petal pollen",
  "knownNPCs": [
    { "name": "Frieren", "relation": "Elven Mage / Legend", "status": "Resting by the campfire" },
    { "name": "Fern", "relation": "First-Class Apprentice Mage", "status": "Serving warm herbal tea" },
    { "name": "Stark", "relation": "Warrior Vanguard", "status": "Securing the trail ahead" }
  ]
}
</state_update>`;
    }
  } else if (currentUniverse.toLowerCase().includes('jujutsu')) {
    scenarioText = `<narration>
A dense shockwave of cursed energy ripples through the subterranean concourse. Sparks of azure and violet static dance across the concrete pillars as Gojo pushes his blindfold up just enough to expose one luminous Six-Eyes iris.
</narration>

<say speaker="Satoru Gojo">
"Not bad at all! Your cursed energy reinforcement is sharper than I expected. Don't worry about collateral damage down here—I'll handle the barrier."
</say>

<narration>
A low, rumbling resonance stirs from the shadows of the platform, the suffocating presence of Ryomen Sukuna vibrating through the air like a poisoned blade.
</narration>

<say speaker="Ryomen Sukuna">
"Hah. You dare flaunt your technique before me? Amusing. Let us see how long that composure lasts when the domain manifests."
</say>

<state_update>
{
  "universe": "Jujutsu Kaisen",
  "currentEra": "${currentEra}",
  "inGameDate": "October 31, 2018",
  "timeOfDay": "Midnight - Cursed Moon",
  "currentLocation": "${currentLocation}",
  "weather": "Suffocating dense cursed aura, ozone static",
  "knownNPCs": [
    { "name": "Satoru Gojo", "relation": "Unsealed Ally / Strongest Sorcerer", "status": "Observing with amusement" },
    { "name": "Ryomen Sukuna", "relation": "King of Curses / Lethal Threat", "status": "Measuring cursed output" }
  ]
}
</state_update>`;
  } else if (currentUniverse.toLowerCase().includes('solo leveling')) {
    scenarioText = `<narration>
The cavern trembles under the weight of surging shadow mana. Twin daggers slice through the frost-mist as Sung Jin-Woo steps forward, his glowing violet gaze piercing the dungeon gloom. From the shadows behind him, armored knights rise with silent ferocity.
</narration>

<say speaker="Sung Jin-Woo">
"Stay close. The boss of this dungeon is reacting to your presence. We finish this quickly."
</say>

<narration>
Commander Igris draws his broadsword with mechanical grace, stepping into a defensive vanguard stance at your right flank.
</narration>

<say speaker="Cha Hae-In">
"The mana density is spiking! Kaelen, Jin-Woo, get ready—it's breaking through the inner cavern gate!"
</say>

<state_update>
{
  "universe": "Solo Leveling",
  "currentEra": "${currentEra}",
  "inGameDate": "Year of the System Gate",
  "timeOfDay": "Dusk - Red Gate Eclipse",
  "currentLocation": "${currentLocation}",
  "weather": "Chilling frost-mist laced with abyssal shadow mana",
  "knownNPCs": [
    { "name": "Sung Jin-Woo", "relation": "Shadow Monarch / Equal Sovereign", "status": "Directing shadow vanguard" },
    { "name": "Cha Hae-In", "relation": "Vice-Guild Master / Allied Hunter", "status": "Guarding the rear" }
  ]
}
</state_update>`;
  } else {
    // Dynamic universal generator for ANY anime/LN/movie universe
    scenarioText = `<narration>
The atmosphere of ${currentUniverse} shifts as your presence makes its mark upon the scene. The ambient energy of ${currentLocation} ripples in concentric waves, reflecting the weight of your actions across the surrounding terrain.
</narration>

<say speaker="${primaryNPC}">
"Your timing is impeccable. In this corner of ${currentUniverse}, an arrival like yours never goes unnoticed. Tell me—what is your next objective?"
</say>

<narration>
The wind carries the distinctive resonance of this world. Across the perimeter, ${secondaryNPC} observes your stance with calculated vigilance, waiting to see how the next chapter unfolds.
</narration>

<say speaker="${secondaryNPC}">
"Stay alert. The balance of this realm is shifting."
</say>

<state_update>
{
  "universe": "${currentUniverse}",
  "currentEra": "${currentEra}",
  "inGameDate": "Day of the Convergence",
  "timeOfDay": "Twilight Dusk",
  "currentLocation": "${currentLocation}",
  "weather": "${weather}",
  "knownNPCs": [
    { "name": "${primaryNPC}", "relation": "${npcs[0]?.relation || 'Allied Figure'}", "status": "Engaging in tactical dialogue" },
    { "name": "${secondaryNPC}", "relation": "${npcs[1]?.relation || 'Watchful Observer'}", "status": "Maintaining perimeter watch" }
  ]
}
</state_update>`;
  }

  // Stream in realistic token chunks
  const chunks = scenarioText.match(/[\s\S]{1,12}/g) || [scenarioText];
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, 30));
    yield chunk;
  }
}

/**
 * Executes a summarization call for memory compaction across OpenRouter, OpenAI, Gemini, and Anthropic
 */
export async function executeCompactionLLM({ previousSummary, archivedTurns, apiConfig, startTurn = 1, endTurn = 10 }) {
  let { provider = 'openrouter', apiKey, model, customBaseUrl } = apiConfig || {};

  const cleanKey = apiKey ? apiKey.trim() : '';

  // Key-prefix auto-detection for summarizer / compaction
  if (cleanKey) {
    if (cleanKey.startsWith('sk-or-v1-') || cleanKey.startsWith('sk-or-')) {
      provider = 'openrouter';
    } else if (cleanKey.startsWith('gsk_')) {
      provider = 'groq';
    } else if (cleanKey.startsWith('AIzaSy') || cleanKey.startsWith('AIza')) {
      provider = 'gemini';
    } else if (cleanKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
    } else if (cleanKey.startsWith('sk-proj-') && provider !== 'openai') {
      provider = 'openai';
    }
  }

  if (provider !== 'custom' && !cleanKey) {
    return `[Turns ${startTurn}–${endTurn} Chronicle]: Key narrative developments: ${archivedTurns
      .replace(/<[^>]+>/g, ' ')
      .slice(0, 450)}...`;
  }

  const prompt = `You are the Master Story Chronicler for an ongoing immersive roleplay.
Your task is to write a detailed, high-density chapter chronicle summarizing ONLY the provided roleplay turns (Turns ${startTurn} to ${endTurn}).

CRITICAL RETENTION MANDATES:
1. FACTUAL DETAIL & SPECIFICS: Preserve all concrete details — exact character names, companion relationship developments, dialogue promises, items/weapons used, combat results, tactical decisions, and environmental shifts.
2. NARRATIVE IMMERSION: Write in vivid, cinematic past-tense third-person prose. Capture the sensory impact and dramatic weight of the events.
3. CONCISE & DENSE: Provide 1 to 2 thorough, high-density paragraphs (approximately 150-300 words). Avoid generic filler.
4. SCOPE: Summarize ONLY the events that occurred within Turns ${startTurn} to ${endTurn}.

${previousSummary ? `[Context: Previous Storyline Prior to These Turns]:\n${previousSummary.slice(-800)}\n\n` : ''}[Roleplay Turns to Summarize (Turns ${startTurn} to ${endTurn})]:
${archivedTurns}

Provide ONLY the chapter summary text (no chapter title, no meta commentary, no markdown code fences):`;

  if (provider === 'gemini') {
    const geminiModel = model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${cleanKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.25 }
      })
    });
    if (!res.ok) throw new Error(`Gemini Compaction failed with status ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  if (provider === 'anthropic') {
    const anthropicModel = model || 'claude-3-5-haiku-20241022';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: anthropicModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.25
      })
    });
    if (!res.ok) throw new Error(`Anthropic Compaction failed with status ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  }

  // OpenAI-compatible providers: OpenAI, Groq, Mistral, OpenRouter, and Custom Proxy
  let baseUrl = 'https://openrouter.ai/api/v1';
  let defaultModel = 'anthropic/claude-3-haiku';

  if (provider === 'openai') {
    baseUrl = 'https://api.openai.com/v1';
    defaultModel = 'gpt-4o-mini';
  } else if (provider === 'groq') {
    baseUrl = 'https://api.groq.com/openai/v1';
    defaultModel = 'llama-3.1-8b-instant';
  } else if (provider === 'mistral') {
    baseUrl = 'https://api.mistral.ai/v1';
    defaultModel = 'mistral-small-latest';
  } else if (provider === 'custom') {
    baseUrl = (customBaseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '');
    defaultModel = 'default';
  }

  const headers = { 'Content-Type': 'application/json' };
  if (cleanKey) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://rebirth.local';
    headers['X-Title'] = 'Re-Birth Anime Roleplay Engine';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || defaultModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.25
    })
  });

  if (!res.ok) {
    throw new Error(`Compaction API (${provider}) failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
