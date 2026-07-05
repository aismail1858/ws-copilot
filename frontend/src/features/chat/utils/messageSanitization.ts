import type { ChatMessage } from '@/types';

const HIDDEN_REASONING_BLOCK_PATTERN =
  /<(think|thinking|reasoning)\b[^>]*>[\s\S]*?<\/\1>/gi;
const TABLE_SEPARATOR_CELL_PATTERN = /^:?-{3,}:?$/;

export function stripHiddenReasoningBlocks(content: string): string {
  if (!content) {
    return '';
  }

  return content
    .replace(HIDDEN_REASONING_BLOCK_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitMarkdownTableRow(line: string): string[] {
  let next = line.trim();
  if (next.startsWith('|')) {
    next = next.slice(1);
  }
  if (next.endsWith('|')) {
    next = next.slice(0, -1);
  }
  return next
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function getMarkdownTableSeparatorColumnCount(line: string): number | null {
  if (!line.includes('|')) {
    return null;
  }
  const cells = splitMarkdownTableRow(line);
  if (cells.length === 0 || cells.some((cell) => !TABLE_SEPARATOR_CELL_PATTERN.test(cell))) {
    return null;
  }
  return cells.length;
}

export function normalizeMalformedMarkdownTables(content: string): string {
  if (!content) {
    return '';
  }

  const lines = content.split(/\r?\n/);
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] ?? '';
    const separatorColumnCount = getMarkdownTableSeparatorColumnCount(nextLine);
    const cells = splitMarkdownTableRow(line);
    const shouldSplitPrefix =
      separatorColumnCount !== null &&
      line.trim() &&
      !line.trim().startsWith('|') &&
      line.includes('|') &&
      cells.length === separatorColumnCount + 1 &&
      cells[0].trim().length > 0;

    if (!shouldSplitPrefix) {
      normalized.push(line);
      continue;
    }

    const [prefix, ...headerCells] = cells;
    if (normalized.length > 0 && normalized[normalized.length - 1].trim()) {
      normalized.push('');
    }
    normalized.push(prefix.trim(), '', `| ${headerCells.join(' | ')} |`);
  }

  return normalized.join('\n');
}

export function sanitizeAssistantMessageContent(content: string): string {
  return normalizeCitations(
    normalizeMalformedMarkdownTables(stripHiddenReasoningBlocks(content))
  );
}

/**
 * Normalize citation markers in text.
 * - Fixes missing spaces before citations: "Merz[1]" → "Merz [1]"
 * - Normalizes [^N] to [N] format
 * - Ensures citations are properly spaced
 */
function normalizeCitations(content: string): string {
  if (!content) {
    return '';
  }

  // Step 1: Normalize [^N] to [N] FIRST
  let normalized = content.replace(/\[\^(\d+)\]/g, '[$1]');

  // Step 2: Fix missing space before citation: "Word[1]" → "Word [1]"
  // but keep "Word [1]" as-is (only adds space if there isn't one)
  normalized = normalized.replace(/(\w)(\[)(\d+)(\])/g, '$1 $2$3$4');

  return normalized;
}

export function sanitizeLoadedChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => {
    if (message.role !== 'assistant') {
      return message;
    }

    return {
      ...message,
      content: sanitizeAssistantMessageContent(message.content || ''),
      reasoning: undefined,
    };
  });
}
