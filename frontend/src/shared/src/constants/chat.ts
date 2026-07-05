/**
 * Shared chat constants for ws-copilot.
 */

/**
 * Streaming configuration.
 * Controls the rate at which tokens are flushed to the UI during streaming.
 */
export const STREAM_FLUSH_INTERVAL_MS = 24;
export const STREAM_FLUSH_CHARS_PER_TICK = 28;
export const STREAM_INITIAL_BUFFER_MS = 72;

/**
 * Model selection constants.
 */
export const MODEL_OPTION_SEPARATOR = '::';

/**
 * Default model options by provider.
 */
export const DEFAULT_MODELS = {
  claude: '',
  openai: '',
  gemini: '',
  ollama: '',
  custom: '',
} as const;

/**
 * Provider display names.
 */
export const PROVIDER_LABELS = {
  claude: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  ollama: 'Ollama',
  custom: 'Custom',
} as const;

/**
 * Provider colors for UI indicators.
 */
export const PROVIDER_COLORS = {
  claude: 'bg-orange-500',
  openai: 'bg-green-500',
  gemini: 'bg-blue-500',
  ollama: 'bg-purple-500',
  custom: 'bg-gray-500',
} as const;
