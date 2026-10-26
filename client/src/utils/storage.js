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

const DEFAULT_API_PROFILES = [
  {
    id: 'profile-groq-llama33',
    name: 'Groq - Llama 3.3 70B (Ultra Fast)',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    apiKey: '',
  },
  {
    id: 'profile-mistral-large',
    name: 'Mistral AI - Mistral Large',
    provider: 'mistral',
    model: 'mistral-large-latest',
    apiKey: '',
  },
  {
    id: 'profile-openrouter-claude',
    name: 'OpenRouter - Claude 3.5 Sonnet',
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    apiKey: '',
  },
  {
    id: 'profile-gemini-pro',
    name: 'Google Gemini - 1.5 Pro',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    apiKey: '',
  },
  {
    id: 'profile-openai-gpt4o',
    name: 'OpenAI - GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
  },
  {
    id: 'profile-custom-ollama',
    name: 'Local Ollama Proxy (11434)',
    provider: 'custom',
    model: 'default',
    apiKey: '',
    customBaseUrl: 'http://localhost:11434/v1',
  },
  {
    id: 'profile-custom-lmstudio',
    name: 'LM Studio Proxy (1234)',
    provider: 'custom',
    model: 'default',
    apiKey: '',
    customBaseUrl: 'http://localhost:1234/v1',
  },
];

export function getStoredApiProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify(DEFAULT_API_PROFILES));
      return DEFAULT_API_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_API_PROFILES;
  } catch (e) {
    return DEFAULT_API_PROFILES;
  }
}

export function saveStoredApiProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEYS.API_PROFILES, JSON.stringify(profiles));
    window.dispatchEvent(new Event('rebirth_api_profiles_updated'));
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
