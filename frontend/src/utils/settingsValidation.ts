/**
 * Type guards and validators for application settings.
 * This file can be independently deleted and replaced with different validation logic.
 */

import type { AppSettings } from '@/types';

/**
 * Type guard to check if a value is a valid string.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a valid non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid number.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Type guard to check if a value is a valid boolean.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a valid array.
 */
export function isArray<T>(value: unknown, guard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (guard) return value.every(guard);
  return true;
}

/**
 * Type guard to check if a value is a valid LLM provider.
 */
export function isValidLlmProvider(value: unknown): value is AppSettings['llmProvider'] {
  return isString(value) && ['claude', 'openai', 'gemini', 'ollama', 'custom'].includes(value);
}

/**
 * Type guard to check if a value is a valid embedding provider.
 */
export function isValidEmbeddingProvider(value: unknown): value is AppSettings['embeddingProvider'] {
  return isString(value) && ['gemini', 'openai', 'ollama', 'custom'].includes(value);
}

/**
 * Type guard to check if a value is a valid reranker provider.
 */
export function isValidRerankerProvider(value: unknown): value is AppSettings['rerankerProvider'] {
  return isString(value) && ['cross_encoder', 'http', 'custom'].includes(value);
}

/**
 * Type guard to check if a value is a valid vision summary provider.
 */
export function isValidVisionProvider(
  value: unknown
): value is AppSettings['ingestionVisionSummaryProvider'] {
  return isString(value) && ['gemini', 'openai', 'ollama', 'custom', 'http'].includes(value);
}

/**
 * Type guard to check if a value is a valid hybrid lexical strategy.
 */
export function isValidHybridLexicalStrategy(
  value: unknown
): value is AppSettings['hybridLexicalStrategy'] {
  return isString(value) && ['bm25', 'fts'].includes(value);
}

/**
 * Type guard to check if a value is a valid knowledge mode.
 */
export function isValidRagKnowledgeMode(value: unknown): value is 'docs_only' | 'docs_plus_model' | 'search' {
  return isString(value) && ['docs_only', 'docs_plus_model', 'search'].includes(value);
}

/**
 * Clamp a number between min and max values.
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (!isNumber(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamp and round a number between min and max values.
 */
export function clampRoundedNumber(value: unknown, min: number, max: number): number {
  if (!isNumber(value)) return min;
  return Math.round(Math.max(min, Math.min(max, value)));
}

/**
 * Normalize a string value, trimming whitespace.
 */
export function normalizeString(value: unknown, fallback: string): string {
  if (isString(value)) return value.trim();
  return fallback;
}

/**
 * Normalize a boolean value.
 */
export function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (isBoolean(value)) return value;
  return fallback;
}

/**
 * Normalize a number value with clamping.
 */
export function normalizeNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  if (!isNumber(value)) return fallback;
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

/**
 * Normalize an array of strings, removing duplicates and empty strings.
 */
export function normalizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!isArray<string>(value, isString)) return fallback;
  return Array.from(new Set(value.map((v) => v.trim()).filter(Boolean)));
}

/**
 * Normalize a value to match a set of valid options.
 */
export function normalizeEnum<T extends string>(
  value: unknown,
  validOptions: ReadonlySet<T>,
  fallback: T
): T {
  if (isString(value) && validOptions.has(value as T)) {
    return value as T;
  }
  return fallback;
}

/**
 * Valid LLM providers.
 */
export const validLlmProviders = new Set<AppSettings['llmProvider']>([
  'claude',
  'openai',
  'gemini',
  'ollama',
  'custom',
]);

/**
 * Valid embedding providers.
 */
export const validEmbeddingProviders = new Set<AppSettings['embeddingProvider']>([
  'gemini',
  'openai',
  'ollama',
  'custom',
]);

/**
 * Valid reranker providers.
 */
export const validRerankerProviders = new Set<AppSettings['rerankerProvider']>([
  'cross_encoder',
  'http',
  'custom',
]);

/**
 * Valid vision summary providers.
 */
export const validVisionProviders = new Set<AppSettings['ingestionVisionSummaryProvider']>([
  'gemini',
  'openai',
  'ollama',
  'custom',
  'http',
]);
