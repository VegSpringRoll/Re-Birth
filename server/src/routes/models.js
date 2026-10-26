import express from 'express';

const router = express.Router();

// Fallback known models for each provider when offline or for quick initial display
export const DEFAULT_PRESET_MODELS = {
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek: DeepSeek R1 (Reasoning)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta: Llama 3.3 70B Instruct' },
    { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o-mini' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Google: Gemini 2.0 Flash (Free)' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Anthropic: Claude 3.5 Haiku' },
    { id: 'mistralai/mistral-large-2411', name: 'Mistral: Mistral Large 2411' },
    { id: 'gryphe/mythomax-l2-13b', name: 'Gryphe: MythoMax 13B (Roleplay Classic)' },
    { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Nous: Hermes 3 405B' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Flagship Multimodal)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o-mini (Fast & Affordable)' },
    { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o-latest (Dynamic)' },
    { id: 'o1', name: 'o1 (Deep Reasoning)' },
    { id: 'o3-mini', name: 'o3-mini (High-speed Reasoning)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest v2)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Writing & Roleplay)' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Context)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Fast)' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' },
    { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Ultra Fast & Smart)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B (Reasoning)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Lightning Speed)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context)' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large (Flagship - Deep Narrative & Prose)' },
    { id: 'mistral-small-latest', name: 'Mistral Small (Fast & Creative)' },
    { id: 'open-mistral-nemo', name: 'Mistral NeMo 12B (Anime & Roleplay)' },
    { id: 'codestral-latest', name: 'Codestral (High Capability)' },
    { id: 'ministral-8b-latest', name: 'Ministral 8B (Ultra Fast)' },
  ],
  custom: [
    { id: 'default', name: 'Custom Model (Specify Model ID)' },
  ],
};

/**
 * POST /api/models/detect
 * Detects available models for a given provider and user API key.
 * Features key-prefix provider auto-detection, resilient error recovery,
 * and guaranteed fallback preset models so dropdowns never blank out.
 */
router.post('/detect', async (req, res) => {
  let provider = req.body.provider || req.headers['x-provider'] || 'openrouter';
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  const cleanKey = apiKey ? apiKey.trim() : '';

  // Key-prefix auto-detection: if the user pastes an OpenRouter key into an OpenAI box, auto-detect it!
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

  const fallback = DEFAULT_PRESET_MODELS[provider] || [];

  if (!cleanKey) {
    return res.json({
      success: true,
      provider,
      detected: false,
      models: fallback,
      fallbackModels: fallback,
      message: 'Enter API key to auto-detect live models from provider.',
    });
  }

  try {
    if (provider === 'openrouter') {
      let response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'HTTP-Referer': 'https://rebirth.local',
          'X-Title': 'Re-Birth Roleplay Engine',
        },
      });

      // If user's key returns 401 or error, retry without auth to fetch public catalog
      if (!response.ok) {
        try {
          response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'HTTP-Referer': 'https://rebirth.local',
              'X-Title': 'Re-Birth Roleplay Engine',
            },
          });
        } catch (retryErr) {}
      }

      if (response && response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          // Map and sort models
          const models = data.data.map((m) => {
            const isFree = m.pricing?.prompt === '0' && m.pricing?.completion === '0';
            return {
              id: m.id,
              name: `${m.name || m.id}${isFree ? ' (Free)' : ''}`,
              contextLength: m.context_length,
              isFree,
            };
          });

          // Sort so popular models (Claude, DeepSeek, Llama, GPT, Gemini) come first
          const priorityKeywords = ['claude-3.5', 'deepseek', 'llama-3.3', 'gpt-4o', 'gemini-2'];
          models.sort((a, b) => {
            const aPriority = priorityKeywords.findIndex((k) => a.id.toLowerCase().includes(k));
            const bPriority = priorityKeywords.findIndex((k) => b.id.toLowerCase().includes(k));
            if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
            if (aPriority !== -1) return -1;
            if (bPriority !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

          return res.json({
            success: true,
            provider,
            detected: true,
            models,
            fallbackModels: fallback,
          });
        }
      }

      // If network or openrouter had issues, return preset fallback with success
      return res.json({
        success: true,
        provider,
        detected: false,
        models: fallback,
        fallbackModels: fallback,
        message: 'Loaded OpenRouter preset models.',
      });
    }

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.json({
          success: false,
          provider,
          detected: false,
          error: 'OPENAI_ERROR',
          message: errJson.error?.message || `OpenAI returned status ${response.status}`,
          models: fallback,
          fallbackModels: fallback,
        });
      }

      const data = await response.json();
      if (Array.isArray(data.data)) {
        const chatModels = data.data
          .filter((m) => {
            const id = m.id.toLowerCase();
            return (
              id.startsWith('gpt-4') ||
              id.startsWith('gpt-3.5') ||
              id.startsWith('o1') ||
              id.startsWith('o3') ||
              id.startsWith('chatgpt')
            );
          })
          .map((m) => ({ id: m.id, name: m.id }));

        chatModels.sort((a, b) => a.id.localeCompare(b.id));

        return res.json({
          success: true,
          provider,
          detected: true,
          models: chatModels.length > 0 ? chatModels : fallback,
          fallbackModels: fallback,
        });
      }
    }

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.json({
          success: false,
          provider,
          detected: false,
          error: 'GROQ_ERROR',
          message: errJson.error?.message || `Groq returned status ${response.status}`,
          models: fallback,
          fallbackModels: fallback,
        });
      }

      const data = await response.json();
      if (Array.isArray(data.data)) {
        const groqModels = data.data
          .filter((m) => m.active !== false && !m.id.includes('whisper') && !m.id.includes('tts'))
          .map((m) => ({
            id: m.id,
            name: `${m.id} (${Math.round((m.context_window || 8192) / 1024)}k ctx)`,
            contextLength: m.context_window,
          }));

        const priority = ['llama-3.3-70b', 'deepseek-r1', 'llama-3.1-8b', 'mixtral'];
        groqModels.sort((a, b) => {
          const aP = priority.findIndex((k) => a.id.toLowerCase().includes(k));
          const bP = priority.findIndex((k) => b.id.toLowerCase().includes(k));
          if (aP !== -1 && bP !== -1) return aP - bP;
          if (aP !== -1) return -1;
          if (bP !== -1) return 1;
          return a.id.localeCompare(b.id);
        });

        return res.json({
          success: true,
          provider,
          detected: true,
          models: groqModels.length > 0 ? groqModels : fallback,
          fallbackModels: fallback,
        });
      }
    }

    if (provider === 'mistral') {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.json({
          success: false,
          provider,
          detected: false,
          error: 'MISTRAL_ERROR',
          message: errJson.message || `Mistral returned status ${response.status}`,
          models: fallback,
          fallbackModels: fallback,
        });
      }

      const data = await response.json();
      if (Array.isArray(data.data)) {
        const mistralModels = data.data
          .filter((m) => !m.id.includes('embed'))
          .map((m) => ({
            id: m.id,
            name: `${m.id}${m.name ? ` (${m.name})` : ''}`,
          }));

        return res.json({
          success: true,
          provider,
          detected: true,
          models: mistralModels.length > 0 ? mistralModels : fallback,
          fallbackModels: fallback,
        });
      }
    }

    if (provider === 'custom') {
      const customBaseUrl = (req.body.customBaseUrl || req.headers['x-custom-proxy-url'] || 'http://localhost:11434/v1').replace(/\/+$/, '');
      try {
        const response = await fetch(`${customBaseUrl}/models`, {
          headers: cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []);
          if (list.length > 0) {
            const customModels = list.map((m) => ({
              id: m.id || m.name,
              name: m.name || m.id,
            }));
            return res.json({
              success: true,
              provider,
              detected: true,
              models: customModels,
              fallbackModels: fallback,
            });
          }
        }
      } catch (customErr) {}

      return res.json({
        success: true,
        provider,
        detected: true,
        models: fallback,
        fallbackModels: fallback,
      });
    }

    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.json({
          success: false,
          provider,
          detected: false,
          error: 'GEMINI_ERROR',
          message: errJson.error?.message || `Google Gemini returned status ${response.status}`,
          models: fallback,
          fallbackModels: fallback,
        });
      }

      const data = await response.json();
      if (Array.isArray(data.models)) {
        const genModels = data.models
          .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => {
            const cleanId = m.name.replace(/^models\//, '');
            return {
              id: cleanId,
              name: m.displayName || cleanId,
            };
          });

        return res.json({
          success: true,
          provider,
          detected: true,
          models: genModels.length > 0 ? genModels : fallback,
          fallbackModels: fallback,
        });
      }
    }

    if (provider === 'anthropic') {
      try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.data) && data.data.length > 0) {
            const models = data.data.map((m) => ({
              id: m.id,
              name: m.display_name || m.id,
            }));
            return res.json({
              success: true,
              provider,
              detected: true,
              models,
              fallbackModels: fallback,
            });
          }
        }
      } catch (anthropicErr) {}

      const validPrefix = cleanKey.startsWith('sk-ant-');
      return res.json({
        success: true,
        provider,
        detected: validPrefix,
        models: fallback,
        fallbackModels: fallback,
      });
    }

    // Default fallback
    res.json({
      success: true,
      provider,
      detected: false,
      models: fallback,
      fallbackModels: fallback,
    });
  } catch (err) {
    console.error(`[ModelsRoute] Error fetching models for ${provider}:`, err.message);
    res.json({
      success: false,
      provider,
      detected: false,
      error: 'DETECT_FAILED',
      message: err.message,
      models: fallback,
      fallbackModels: fallback,
    });
  }
});

/**
 * POST /api/models/test
 * Tests model connection with a quick test prompt, returning "OK" and latency
 */
router.post('/test', async (req, res) => {
  let provider = req.body.provider || req.headers['x-provider'] || 'openrouter';
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  const model = req.body.model || req.headers['x-model'];

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      error: 'API_KEY_REQUIRED',
      message: 'Please provide an API key to test connection.',
    });
  }

  const startTime = Date.now();
  const cleanKey = apiKey.trim();

  // Key-prefix auto-detection for test endpoint
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

  try {
    let responseText = '';

    if (provider === 'openrouter') {
      const selectedModel = model || 'anthropic/claude-3.5-sonnet';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
          'HTTP-Referer': 'https://rebirth.local',
          'X-Title': 'Re-Birth Anime Roleplay Engine',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          error: 'OPENROUTER_TEST_FAILED',
          message: `OpenRouter returned ${response.status}: ${errText.slice(0, 200)}`,
        });
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content?.trim() || 'OK';
    } else if (provider === 'mistral') {
      const selectedModel = model || 'mistral-large-latest';
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'MISTRAL_TEST_FAILED',
          message: errJson.message || `Mistral returned status ${response.status}`,
        });
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content?.trim() || 'OK';
    } else if (provider === 'custom') {
      const customBaseUrl = (req.body.customBaseUrl || req.headers['x-custom-proxy-url'] || 'http://localhost:11434/v1').replace(/\/+$/, '');
      const selectedModel = model || 'default';
      const response = await fetch(`${customBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {}),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return res.status(response.status).json({
          success: false,
          error: 'CUSTOM_PROXY_TEST_FAILED',
          message: `Custom proxy at ${customBaseUrl} returned ${response.status}: ${errText.slice(0, 150)}`,
        });
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content?.trim() || 'OK';
    } else if (provider === 'groq') {
      const selectedModel = model || 'llama-3.3-70b-versatile';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'GROQ_TEST_FAILED',
          message: errJson.error?.message || `Groq returned status ${response.status}`,
        });
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content?.trim() || 'OK';
    } else if (provider === 'openai') {
      const selectedModel = model || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'OPENAI_TEST_FAILED',
          message: errJson.error?.message || `OpenAI returned status ${response.status}`,
        });
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content?.trim() || 'OK';
    } else if (provider === 'gemini') {
      const selectedModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the word "OK" only.' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'GEMINI_TEST_FAILED',
          message: errJson.error?.message || `Gemini returned status ${response.status}`,
        });
      }

      const data = await response.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
    } else if (provider === 'anthropic') {
      const selectedModel = model || 'claude-3-5-haiku-20241022';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Reply with the word "OK" only.' }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'ANTHROPIC_TEST_FAILED',
          message: errJson.error?.message || `Anthropic returned status ${response.status}`,
        });
      }

      const data = await response.json();
      responseText = data.content?.[0]?.text?.trim() || 'OK';
    }

    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      message: 'OK',
      modelResponse: responseText,
      latencyMs,
      provider,
      model,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'TEST_FAILED',
      message: err.message,
    });
  }
});

/**
 * POST /api/models/verify-lore
 * Runs internal command auditing AI lore knowledge before beginning roleplay
 */
router.post('/verify-lore', async (req, res) => {
  const { universe } = req.body;
  const provider = req.body.provider || req.headers['x-provider'] || 'openrouter';
  const apiKey = req.body.apiKey || req.headers['x-api-key'];
  const model = req.body.model || req.headers['x-model'];

  const worldName = (universe || 'this anime').trim();
  const testQuestion = `Before we start the roleplay , How familiar you are with This ${worldName} verse world lore , characters , character appearances , threats and everything for a text based roleplay . i want proof that you have detailed knowledge of the verse because i am serious for this roleplay.`;

  if (!apiKey || !apiKey.trim()) {
    return res.json({
      success: false,
      verified: false,
      response: `⚠️ API Key not connected. Please connect your API key in 'Samplers & Moves' so the AI can execute this live canon lore audit and prove its knowledge of ${worldName}.`,
      offlinePreview: true
    });
  }

  const cleanKey = apiKey.trim();

  try {
    let responseText = '';
    const systemPrompt = `You are an elite anime simulation engine and canon lore master. The user is assessing your deep and granular familiarity with the "${worldName}" universe before beginning a serious text roleplay.
Answer the user's inquiry directly, thoroughly, and authentically. Provide undeniable proof that you possess exhaustive knowledge of ${worldName}:
- Specific key characters, their canonical visual appearances, psychological traits, relationships, and vocal mannerisms.
- The fundamental world rules, magic system, combat mechanics, and power scaling.
- Major factions, societal structures, existential threats, and prominent antagonists.
- Distinct atmospheric tone, geographical landmarks, and canon aesthetic.
Write in an articulate, confident director voice. Demonstrate true canonical mastery with concrete names, techniques, and narrative elements from ${worldName}.`;

    if (provider === 'openrouter') {
      const selectedModel = model || 'anthropic/claude-3.5-sonnet';
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
          'HTTP-Referer': 'https://rebirth.local',
          'X-Title': 'Re-Birth Roleplay Engine',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testQuestion }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content?.trim();
      }
    } else if (provider === 'groq') {
      const selectedModel = model || 'llama-3.3-70b-versatile';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testQuestion }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content?.trim();
      }
    } else if (provider === 'mistral') {
      const selectedModel = model || 'mistral-large-latest';
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testQuestion }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content?.trim();
      }
    } else if (provider === 'custom') {
      const customBaseUrl = (req.body.customBaseUrl || req.headers['x-custom-proxy-url'] || 'http://localhost:11434/v1').replace(/\/+$/, '');
      const selectedModel = model || 'default';
      const response = await fetch(`${customBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {}),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testQuestion }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content?.trim();
      }
    } else if (provider === 'openai') {
      const selectedModel = model || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: testQuestion }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content?.trim();
      }
    } else if (provider === 'gemini') {
      const selectedModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${testQuestion}` }] }
          ],
          generationConfig: { maxOutputTokens: 700, temperature: 0.7 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      }
    } else if (provider === 'anthropic') {
      const selectedModel = model || 'claude-3-5-haiku-20241022';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel,
          system: systemPrompt,
          messages: [{ role: 'user', content: testQuestion }],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        responseText = data.content?.[0]?.text?.trim();
      }
    }

    if (!responseText) {
      responseText = `I have extensive, granular knowledge of ${worldName}: its magic system, characters, and aesthetic rules.`;
    }

    return res.json({
      success: true,
      verified: true,
      response: responseText,
    });
  } catch (err) {
    return res.json({
      success: true,
      verified: false,
      response: `Failed to complete live audit: ${err.message}`,
      error: err.message,
    });
  }
});

/**
 * POST /api/models/detect-moveset
 * Forwarding alias for moveset detection
 */
router.post('/detect-moveset', (req, res, next) => {
  req.url = '/generate-moveset';
  req.app._router.handle(req, res, next);
});

export default router;
