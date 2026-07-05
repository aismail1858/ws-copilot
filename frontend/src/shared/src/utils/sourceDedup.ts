/**
 * Shared source deduplication utilities for ws-copilot.
 * Deduplicates chat sources by page URL or document ID.
 */

import type { Source } from '../types/chat.js';

/**
 * Message source type (used in extension).
 * Extends Source with additional metadata.
 */
export interface MessageSource extends Source {
  url?: string;
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  sourceIndex?: number;
  hitCount?: number;
  chunkIndex?: number;
  pageNo?: number;
}

/**
 * Deduplicate sources by page URL or document ID.
 *
 * This function groups sources by a "page key" (URL or document ID),
 * combines hit counts, and keeps the source with the highest score.
 *
 * @param sources - Array of sources to deduplicate
 * @returns Deduplicated array of sources
 */
export function dedupeSourcesByPage<T extends Source | MessageSource>(sources: T[]): T[] {
  const byPageKey = new Map<string, T>();
  const orderedKeys: string[] = [];

  for (const source of sources) {
    const normalizedUrl = normalizeSourceUrl(source.url);
    const pageKey = getSourcePageKey(source, normalizedUrl);
    const candidate: T = {
      ...source,
      url: normalizedUrl,
    };
    const existing = byPageKey.get(pageKey);

    if (!existing) {
      const hitCount = (source as Partial<MessageSource>).hitCount ?? 1;
      byPageKey.set(pageKey, { ...candidate, hitCount } as T);
      orderedKeys.push(pageKey);
      continue;
    }

    const nextHitCount = ((existing as Partial<MessageSource>).hitCount ?? 1) + ((source as Partial<MessageSource>).hitCount ?? 1);
    const betterCandidate = (candidate.score ?? 0) > (existing.score ?? 0) ? candidate : existing;
    byPageKey.set(
      pageKey,
      {
        ...betterCandidate,
        hitCount: nextHitCount,
        sourceIndex: (existing as Partial<MessageSource>).sourceIndex
          ?? (candidate as Partial<MessageSource>).sourceIndex,
      } as T
    );
  }

  const dedupedSources = orderedKeys
    .map((pageKey) => byPageKey.get(pageKey))
    .filter((source): source is T => Boolean(source));

  return dedupedSources.sort(compareSources);
}

function compareSources(left: Source | MessageSource, right: Source | MessageSource): number {
  const leftIndex = normalizeSourceIndex((left as Partial<MessageSource>).sourceIndex);
  const rightIndex = normalizeSourceIndex((right as Partial<MessageSource>).sourceIndex);
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  const byHitCount = ((right as Partial<MessageSource>).hitCount ?? 1) - ((left as Partial<MessageSource>).hitCount ?? 1);
  if (byHitCount !== 0) return byHitCount;
  return (right.score ?? 0) - (left.score ?? 0);
}

function normalizeSourceIndex(value?: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : Number.MAX_SAFE_INTEGER;
}

/**
 * Get a unique page key for a source.
 *
 * Priority: URL > document ID > title > excerpt
 *
 * @param source - The source to get a key for
 * @param normalizedUrl - Pre-normalized URL (optional)
 * @returns A unique string key for this source
 */
function getSourcePageKey(source: Source | MessageSource, normalizedUrl?: string): string {
  if (normalizedUrl) {
    return `url:${normalizedUrl}`;
  }

  const documentId = (source.documentId || '').trim();
  if (documentId) return `doc:${documentId}`;

  const title = (source.title || '').trim().toLowerCase();
  if (title) return `title:${title}`;

  return `fallback:${source.excerpt?.trim().slice(0, 120) || ''}`;
}

/**
 * Normalize a URL for deduplication.
 *
 * Removes hash, trailing slashes, and standardizes the format.
 *
 * @param rawUrl - The URL to normalize
 * @returns Normalized URL or undefined
 */
function normalizeSourceUrl(rawUrl?: string): string | undefined {
  const value = (rawUrl || '').trim();
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    parsed.hash = '';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return parsed.toString();
  } catch {
    // Invalid URL, just clean it up
    return value.replace(/#.*$/, '').replace(/\/+$/, '');
  }
}
