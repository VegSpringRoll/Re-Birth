/**
 * Safe localStorage utilities for Re-Birth API keys, samplers, and dedicated summarizer settings.
 */

const STORAGE_KEYS = {
  BYOK_KEYS: 'rebirth_byok_keys',
  ACTIVE_PROVIDER: 'rebirth_active_provider',
  SELECTED_MODELS: 'rebirth_selected_models',
  SAMPLER_CONFIG: 'rebirth_samplers',
  SUMMARY_CONFIG: 'rebirth_summary_config',
  MONGODB_CONFIG: 'rebirth_mongodb_config',
  API_PROFILES: 'rebirth_api_profiles_v1',
  ACTIVE_PROFILE_ID: 'rebirth_active_profile_id_v1',
  CUSTOM_PROXY_URL: 'rebirth_custom_proxy_url',
};

const DEFAULT_SAMPLERS = {
  temperature: 0.85,
  top_p: 0.95,
  min_tokens: 250,
  max_tokens: 1200,
  sliding_window: 10,
  frequency_penalty: 0.2,
  repetition_penalty: 1.1,
  safety_threshold: 'standard',
};

const DEFAULT_KEYS = {
  openrouter: '',
  anthropic: '',
  openai: '',
  gemini: '',
  groq: '',
  mistral: '',
  custom: '',
};

const DEFAULT_MODELS = {
  openrouter: 'anthropic/claude-3.5-sonnet',
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
  custom: 'default',
};

export const DEFAULT_PRESET_MODELS = {
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek: DeepSeek R1 (Reasoning)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta: Llama 3.3 70B Instruct' },
    { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o-mini (Fast & Cheap)' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Google: Gemini 2.0 Flash (Free)' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Anthropic: Claude 3.5 Haiku (Fast)' },
    { id: 'mistralai/mistral-large-2411', name: 'Mistral: Mistral Large 2411' },
    { id: 'gryphe/mythomax-l2-13b', name: 'Gryphe: MythoMax 13B (Roleplay Classic)' },
    { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Nous: Hermes 3 405B' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o-mini (Fast & Affordable - Recommended for Summary)' },
    { id: 'gpt-4o', name: 'GPT-4o (Flagship Multimodal)' },
    { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o-latest (Dynamic)' },
    { id: 'o3-mini', name: 'o3-mini (High-speed Reasoning)' },
    { id: 'o1', name: 'o1 (Deep Reasoning)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  groq: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast & Free - Recommended for Summary)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
  ],
  mistral: [
    { id: 'mistral-small-latest', name: 'Mistral Small (Fast & High Precision - Recommended for Summary)' },
    { id: 'mistral-large-latest', name: 'Mistral Large (Flagship - Deep Narrative)' },
    { id: 'open-mistral-nemo', name: 'Mistral NeMo 12B' },
    { id: 'ministral-8b-latest', name: 'Ministral 8B' },
  ],
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ultra Fast & Free - Recommended for Summary)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast & High Quality - Recommended for Summary)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  ],
  custom: [
    { id: 'default', name: 'Custom Model (Specify Model ID)' },
  ],
};

/**
 * Intelligent helper to auto-detect API provider from common key prefixes
 */
export function detectProviderFromApiKey(key) {
  if (!key || typeof key !== 'string') return null;
  const k = key.trim();
  if (k.startsWith('sk-or-v1-') || k.startsWith('sk-or-')) return 'openrouter';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('AIzaSy') || k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('sk-proj-') || (k.startsWith('sk-') && !k.startsWith('sk-or-') && !k.startsWith('sk-ant-'))) return 'openai';
  return null;
}

const DEFAULT_SUMMARY_CONFIG = {
  enabled: true,
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  customBaseUrl: 'http://localhost:11434/v1',
  intervalTurns: 10,
};

export function getStoredApiKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BYOK_KEYS);
    return raw ? { ...DEFAULT_KEYS, ...JSON.parse(raw) } : { ...DEFAULT_KEYS };
  } catch (e) {
    return { ...DEFAULT_KEYS };
  }
}

export function saveStoredApiKeys(keys) {
  try {
    localStorage.setItem(STORAGE_KEYS.BYOK_KEYS, JSON.stringify(keys));
  } catch (e) {}
}

export function getActiveProvider() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER) || 'openrouter';
  } catch (e) {
    return 'openrouter';
  }
}

export function saveActiveProvider(provider) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, provider);
  } catch (e) {}
}

export function getStoredModels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_MODELS);
    return raw ? { ...DEFAULT_MODELS, ...JSON.parse(raw) } : { ...DEFAULT_MODELS };
  } catch (e) {
    return { ...DEFAULT_MODELS };
  }
}

export function saveStoredModels(models) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODELS, JSON.stringify(models));
  } catch (e) {}
}

export function getStoredSamplers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAMPLER_CONFIG);
    return raw ? { ...DEFAULT_SAMPLERS, ...JSON.parse(raw) } : { ...DEFAULT_SAMPLERS };
  } catch (e) {
    return { ...DEFAULT_SAMPLERS };
  }
}

export function saveStoredSamplers(samplers) {
  try {
    localStorage.setItem(STORAGE_KEYS.SAMPLER_CONFIG, JSON.stringify(samplers));
  } catch (e) {}
}

export function getStoredSummaryConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUMMARY_CONFIG);
    return raw ? { ...DEFAULT_SUMMARY_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_SUMMARY_CONFIG };
  } catch (e) {
    return { ...DEFAULT_SUMMARY_CONFIG };
  }
}

export function saveStoredSummaryConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUMMARY_CONFIG, JSON.stringify(config));
  } catch (e) {}
}

export function getStoredMongoUri() {
  try {
    return localStorage.getItem(STORAGE_KEYS.MONGODB_CONFIG) || 'mongodb://127.0.0.1:27017/rp_engine';
  } catch (e) {
    return 'mongodb://127.0.0.1:27017/rp_engine';
  }
}

export function saveStoredMongoUri(uri) {
  try {
    localStorage.setItem(STORAGE_KEYS.MONGODB_CONFIG, uri);
  } catch (e) {}
}

export function getStoredCustomProxyUrl() {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_PROXY_URL) || 'http://localhost:11434/v1';
  } catch (e) {
    return 'http://localhost:11434/v1';
  }
}

export function saveStoredCustomProxyUrl(url) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROXY_URL, url);
  } catch (e) {}
}

/**
 * Returns the active primary BYOK API configuration for world briefings and canon audits
 */
export function getPrimaryApiConfig() {
  const provider = getActiveProvider() || 'openrouter';
  const keys = getStoredApiKeys() || {};
  const models = getStoredModels() || {};
  const customBaseUrl = getStoredCustomProxyUrl() || 'http://localhost:11434/v1';

  let apiKey = keys[provider] || '';
  let model = models[provider] || '';

  // Fallback: If the selected provider has no key entered, find any provider that has a valid key
  if (!apiKey && provider !== 'custom') {
    for (const p of ['openrouter', 'groq', 'gemini', 'openai', 'mistral', 'anthropic']) {
      if (keys[p] && keys[p].trim()) {
        return {
          provider: p,
          apiKey: keys[p].trim(),
          model: models[p] || '',
          customBaseUrl,
        };
      }
    }
  }

  return {
    provider,
    apiKey: apiKey ? apiKey.trim() : '',
    model: model ? model.trim() : '',
    customBaseUrl,
  };
}

const DEFAULT_API_PROFILES = [];

const DUMMY_PROFILE_IDS = [
  'profile-groq-llama33',
  'profile-mistral-large',
  'profile-openrouter-claude',
  'profile-gemini-pro',
  'profile-openai-gpt4o',
  'profile-custom-ollama',
  'profile-custom-lmstudio',
];

export function getStoredApiProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Purge unnecessary dummy profiles that have empty API keys
    const cleanProfiles = parsed.filter(
      (p) => p && !DUMMY_PROFILE_IDS.includes(p.id) || Boolean(p.apiKey?.trim())
    );
    
    if (cleanProfiles.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify(cleanProfiles));
    }
    return cleanProfiles;
  } catch (e) {
    return [];
  }
}

export function saveStoredApiProfiles(profiles) {
  try {
    const cleanProfiles = Array.isArray(profiles)
      ? profiles.filter((p) => p && (!DUMMY_PROFILE_IDS.includes(p.id) || Boolean(p.apiKey?.trim())))
      : [];
    localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify(cleanProfiles));
    window.dispatchEvent(new Event('rebirth_api_profiles_updated'));
    // Auto-sync with MongoDB cloud
    saveByokToMongoDB({ apiProfiles: cleanProfiles }).catch(() => {});
  } catch (e) {}
}

export function getActiveApiProfileId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || '';
  } catch (e) {
    return '';
  }
}

export function saveActiveApiProfileId(id) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    window.dispatchEvent(new Event('rebirth_api_profiles_updated'));
  } catch (e) {}
}

/**
 * Syncs local BYOK settings & profiles with MongoDB Cloud
 * This ensures that when accessing on mobile or another device,
 * all saved API keys, models, and profiles automatically appear.
 */
export async function syncByokWithMongoDB() {
  try {
    const res = await fetch('/api/settings/byok');
    if (!res.ok) return null;
    const remote = await res.json();
    if (!remote.success) return null;

    let updatedAny = false;

    // 1. Sync API Keys
    const localKeys = getStoredApiKeys();
    const mergedKeys = { ...localKeys };
    if (remote.apiKeys && typeof remote.apiKeys === 'object') {
      for (const [prov, key] of Object.entries(remote.apiKeys)) {
        if (key && key.trim()) {
          // If local doesn't have it, adopt remote
          if (!mergedKeys[prov]?.trim()) {
            mergedKeys[prov] = key.trim();
            updatedAny = true;
          }
        }
      }
      if (updatedAny) {
        localStorage.setItem(STORAGE_KEYS.BYOK_KEYS, JSON.stringify(mergedKeys));
      }
    }

    // 2. Sync Active Provider
    if (remote.activeProvider && (!getActiveProvider() || getActiveProvider() === 'custom')) {
      if (mergedKeys[remote.activeProvider]?.trim()) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, remote.activeProvider);
        updatedAny = true;
      }
    }

    // 3. Sync Models
    const localModels = getStoredModels();
    const mergedModels = { ...localModels };
    if (remote.models && typeof remote.models === 'object') {
      for (const [prov, mId] of Object.entries(remote.models)) {
        if (mId && !mergedModels[prov]) {
          mergedModels[prov] = mId;
          updatedAny = true;
        }
      }
      if (updatedAny) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_MODELS, JSON.stringify(mergedModels));
      }
    }

    // 4. Sync Summary Config
    if (remote.summaryConfig && typeof remote.summaryConfig === 'object' && Object.keys(remote.summaryConfig).length > 0) {
      const localSummary = getStoredSummaryConfig();
      if (!localSummary.apiKey && remote.summaryConfig.apiKey) {
        const mergedSummary = { ...localSummary, ...remote.summaryConfig };
        localStorage.setItem(STORAGE_KEYS.SUMMARY_CONFIG, JSON.stringify(mergedSummary));
        updatedAny = true;
      }
    }

    // 4. Sync API Profiles (Cleaned of dummies)
    const localProfiles = getStoredApiProfiles();
    const remoteProfiles = Array.isArray(remote.apiProfiles)
      ? remote.apiProfiles.filter((p) => p && (!DUMMY_PROFILE_IDS.includes(p.id) || Boolean(p.apiKey?.trim())))
      : [];

    if (remoteProfiles.length > 0) {
      // Merge unique by ID
      const profileMap = new Map();
      remoteProfiles.forEach((p) => profileMap.set(p.id, p));
      localProfiles.forEach((p) => profileMap.set(p.id, p));
      const finalProfiles = Array.from(profileMap.values());
      localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify(finalProfiles));
      updatedAny = true;
    }

    if (remote.activeProfileId && !getActiveApiProfileId()) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, remote.activeProfileId);
      updatedAny = true;
    }

    if (updatedAny) {
      window.dispatchEvent(new Event('rebirth_keys_updated'));
      window.dispatchEvent(new Event('rebirth_api_profiles_updated'));
    }

    return remote;
  } catch (err) {
    console.warn('[Sync] Could not sync BYOK settings with server:', err.message);
    return null;
  }
}

/**
 * Persists current BYOK state & profiles to MongoDB Cloud
 */
export async function saveByokToMongoDB(partial = {}) {
  try {
    const payload = {
      activeProvider: getActiveProvider(),
      apiKeys: getStoredApiKeys(),
      models: getStoredModels(),
      customProxyUrl: getStoredCustomProxyUrl(),
      samplers: getStoredSamplers(),
      summaryConfig: getStoredSummaryConfig(),
      apiProfiles: getStoredApiProfiles(),
      activeProfileId: getActiveApiProfileId(),
      ...partial,
    };

    const res = await fetch('/api/settings/byok', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err) {
    console.warn('[Sync] Failed to persist BYOK settings to cloud:', err.message);
    return null;
  }
}
