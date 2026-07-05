import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { ChatMessage as ChatMessageType } from '@/types';
import { dedupeSourcesByPage } from '../shared/src/utils/sourceDedup.js';
import SourceCitation from './SourceCitation';
import { ChatMessageAttachment } from '@/features/chat/components/ChatMessageAttachment';
import { sanitizeAssistantMessageContent } from '@/features/chat/utils/messageSanitization';

interface Props {
  message: ChatMessageType;
  onOpenSource?: (source: import('@/types').Source) => void;
}

export default function ChatMessage({ message, onOpenSource }: Props) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content || '' : sanitizeAssistantMessageContent(message.content || '');
  const uniqueSources = message.sources ? dedupeSourcesByPage(message.sources) : [];
  const shouldRenderSources = uniqueSources.length > 0 && message.answerMode !== 'model_fallback';
  const isModelFallback = message.answerMode === 'model_fallback' || message.answerMode === 'insufficient_docs';
  const citationRegex = /\[(\d+)\]/g;
  const citedNumbers = [...displayContent.matchAll(citationRegex)].map(m => parseInt(m[1], 10));
  const maxCitedNumber = citedNumbers.length > 0 ? Math.max(...citedNumbers) : 0;
  const hasInvalidCitations = maxCitedNumber > uniqueSources.length;
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'error'>('idle');
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markdownComponents = {
    table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
      <div className="chat-markdown-table-wrapper">
        <table {...props} className="chat-markdown-table">
          {children}
        </table>
      </div>
    ),
    a: ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2f2b26] underline underline-offset-2 hover:text-[#c97748]"
        {...props}
      >
        {children}
      </a>
    ),
    sup: ({ children, ...props }: ComponentPropsWithoutRef<'sup'>) => {
      const content = String(children);
      const match = content.match(/^\[(\d+)\]$/);
      if (match) {
        const num = match[1];
        const sourceIndex = parseInt(num, 10) - 1;
        const source = uniqueSources.find((candidate) => candidate.sourceIndex === sourceIndex + 1)
          ?? uniqueSources[sourceIndex];
        if (source) {
          return (
            <sup>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2f2b26] hover:text-[#c97748] font-medium align-super text-xs no-underline"
                title={source.title}
                {...props}
              >
                [{num}]
              </a>
            </sup>
          );
        }
      }
      return <sup {...props}>{children}</sup>;
    },
  };

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const copyMessage = useCallback(async () => {
    const value = isUser ? message.content || '' : displayContent;
    if (!value.trim()) return;

    const applyFeedback = (state: 'copied' | 'error') => {
      setCopyFeedback(state);
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        setCopyFeedback('idle');
        feedbackTimerRef.current = null;
      }, 1600);
    };

    try {
      await navigator.clipboard.writeText(value);
      applyFeedback('copied');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        applyFeedback(ok ? 'copied' : 'error');
      } catch {
        applyFeedback('error');
      }
    }
  }, [displayContent, isUser, message.content]);

  const copyButton = (
    <button
      type="button"
      onClick={() => void copyMessage()}
      className={[
        'inline-flex h-7 w-7 items-center justify-center',
        copyFeedback === 'copied'
          ? 'border-blue-500/60 text-blue-400'
          : copyFeedback === 'error'
            ? 'border-rose-500/60 text-rose-300'
            : 'border-[#2f2b26]/12 text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]',
      ].join(' ')}
      aria-label="Nachricht kopieren"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col gap-1 max-w-[75ch]">
          <div className="rounded-[1.25rem] bg-[#f3aa7f] px-4 py-3 shadow-[0_2px_8px_rgba(243,170,127,0.25),0_8px_24px_rgba(243,170,127,0.15)]">
            <p
              className="user-message-content whitespace-pre-wrap break-words text-sm text-[#2f2b26] leading-relaxed"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', cursor: 'text' }}
            >
              {message.content}
            </p>
          </div>
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              {message.attachments.map((attachment, index) => {
                const canOpenInPanel = Boolean(attachment.documentId && onOpenSource);
                const attachmentSource = canOpenInPanel
                  ? ({
                      documentId: attachment.documentId!,
                      title: attachment.filename,
                      excerpt: attachment.excerpt || '',
                      score: 0,
                    } as import('@/types').Source)
                  : undefined;
                return (
                  <ChatMessageAttachment
                    key={`${attachment.filename}-${attachment.sourceUrl ?? 'attachment'}-${index}`}
                    attachment={attachment}
                    onOpen={attachmentSource && onOpenSource ? () => onOpenSource(attachmentSource) : undefined}
                  />
                );
              })}
            </div>
          )}
          <div className="flex justify-end">{copyButton}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden">
        <img src="/logo.svg" alt="WS Copilot" className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className="prose-chat"
          style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', cursor: 'text' }}
        >
          {message.streaming && !displayContent ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#f3aa7f] [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#f3aa7f] [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[#f3aa7f] [animation-delay:300ms]" />
              <span className="ml-2 text-xs text-[#756b62]">
                {message.answerModeReason === 'web_search' ? 'Suche...' : 'Denkt nach...'}
              </span>
            </div>
          ) : message.streaming ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
              {displayContent || '\u200b'}
            </ReactMarkdown>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
              {displayContent || '\u200b'}
            </ReactMarkdown>
          )}
          {message.streaming && displayContent && (
            <span className="typing-cursor ml-0.5 inline-block h-4 w-1.5 rounded-sm bg-[#f3aa7f] align-middle" />
          )}
        </div>
        <div className="mt-2 flex justify-start">{copyButton}</div>

        {message.reasoning && (
          <details className="mt-3 group">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-[#756b62] hover:text-[#2f2b26] list-none">
              <span className="inline-block transition-transform group-open:rotate-90deg">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
              <span>Reasoning</span>
            </summary>
            <div className="mt-2 rounded-lg border border-[#2f2b26]/10 bg-white px-3 py-2 text-xs text-[#756b62] font-mono whitespace-pre-wrap shadow-[0_2px_8px_rgba(47,43,38,0.06)]">
              {message.reasoning}
            </div>
          </details>
        )}

        {isModelFallback && !message.streaming && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Diese Antwort basiert auf dem Sprachmodell und nicht auf dokumentierten Quellen. Die Antwort könnte ungenau oder veraltet sein.
              </span>
            </div>
          </div>
        )}

        {hasInvalidCitations && !message.streaming && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Achtung: Die Antwort enthält Quellenangaben (z.B. [{Array.from(new Set(citedNumbers.filter(n => n > uniqueSources.length))).join(', ')}]), die nicht in den verfügbaren Quellen existieren. Dies könnte auf erfundene Informationen hinweisen.
              </span>
            </div>
          </div>
        )}


        {shouldRenderSources && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-[#756b62]">Quellen</p>
            <div className="flex flex-wrap gap-2">
              {uniqueSources.map((src, index) => (
                <SourceCitation
                  key={`${src.url ?? src.documentId ?? src.title}-${index}`}
                  source={src}
                  onClick={src.documentId && onOpenSource ? () => onOpenSource(src) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
