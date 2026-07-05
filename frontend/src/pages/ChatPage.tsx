import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type FormEvent,
} from 'react';
import { ingestFile } from '@/api/client';
import { useChat } from '@/hooks/useChat';
import { useLayout } from '@/context/LayoutContext';
import type { ChatAttachment, RagKnowledgeMode } from '@/types';
import { CHAT_HISTORY_CHANGED_EVENT, getActiveThreadId } from '@/chat/history';
import {
  buildChatKnowledgeBaseId,
  type ChatUploadJob,
  loadChatUploadJobs,
  saveChatUploadJobs,
} from '@/chat/uploadJobs';
import {
  createEmptyThread,
  getDefaultFolderId,
  ensureFolders,
  loadThreads,
  saveThreadsAndActive,
  setPendingFolderId,
  getPendingFolderId,
} from '@/chat/historyStorage';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ChatMessages } from '@/features/chat/components/ChatMessages';
import { ModelSelector } from '@/features/chat/components/ModelSelector';
import { SelectedUploadPreviewCard } from '@/features/chat/components/SelectedUploadPreviewCard';
import SourcePanel from '@/features/chat/components/SourcePanel';
import { useSourcePanel, useSourcePanelResize } from '@/features/chat/hooks/useSourcePanel';
import {
  buildChatUploadDocumentId,
} from '@/features/chat/utils/chatUploadSources';
import {
  buildPreviewExcerpt,
  buildPreviewImageUrl,
  inferProgress,
  loadChatKnowledgeMode,
  persistChatKnowledgeMode,
} from '@/features/chat/utils/chatHelpers';
import { useChatUploadPolling } from '@/features/chat/hooks/useChatUpload';
import {
  MAX_CHAT_UPLOAD_JOBS,
  UPLOAD_PROCESSING_STATUSES,
} from '@/features/chat/utils/chatConstants';

interface SelectedUploadPreview {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  excerpt: string;
  previewImageUrl: string;
  localId?: string;
  jobId?: string;
  status: ChatUploadJob['status'] | 'uploading';
  progress: number;
  stage?: string;
  error?: string;
  sourceUrl?: string;
}

function loadLimitedChatUploadJobs(threadId: string | null): ChatUploadJob[] {
  return loadChatUploadJobs(threadId).slice(0, MAX_CHAT_UPLOAD_JOBS);
}

function buildMessageAttachments(
  selectedUploadPreview: SelectedUploadPreview | null
): ChatAttachment[] | undefined {
  if (!selectedUploadPreview || selectedUploadPreview.status !== 'completed') {
    return undefined;
  }
  return [
    {
      kind: 'chat_upload',
      documentId: buildChatUploadDocumentId(selectedUploadPreview.jobId),
      filename: selectedUploadPreview.filename,
      mimeType: selectedUploadPreview.mimeType,
      sizeBytes: selectedUploadPreview.sizeBytes,
      excerpt: selectedUploadPreview.excerpt,
      sourceUrl: selectedUploadPreview.sourceUrl,
      previewImageUrl: selectedUploadPreview.previewImageUrl,
    },
  ];
}

export default function ChatPage() {
  const { messages, isLoading, sendMessage, stopStreaming } = useChat();
  const { isSidebarOpen } = useLayout();
  const {
    activeSource,
    sourcePanelWidth,
    isResizingSourcePanel,
    handleOpenSource,
    handleCloseSourcePanel,
    setSourcePanelWidth,
    setIsResizingSourcePanel,
  } = useSourcePanel();
  const { handleStartSourcePanelResize } = useSourcePanelResize(
    isResizingSourcePanel,
    setIsResizingSourcePanel,
    sourcePanelWidth,
    setSourcePanelWidth
  );
  const initialThreadId = getActiveThreadId();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => initialThreadId);
  const [chatUploadJobs, setChatUploadJobs] = useState<ChatUploadJob[]>(() =>
    loadLimitedChatUploadJobs(initialThreadId)
  );
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedUploadPreview, setSelectedUploadPreview] = useState<SelectedUploadPreview | null>(
    null
  );
  const uploadSessionRef = useRef(0);
  const previousPreviewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const plusMenuRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState('');
  const [knowledgeMode, setKnowledgeMode] = useState<RagKnowledgeMode>(() => loadChatKnowledgeMode());
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stopRequestedRef = useRef(false);
  const knowledgeBaseId = buildChatKnowledgeBaseId(activeThreadId);
  const updateChatUploadJobs = useCallback(
    (modifier: (previous: ChatUploadJob[]) => ChatUploadJob[]) => {
      setChatUploadJobs((prev) => {
        const next = modifier(prev).slice(0, MAX_CHAT_UPLOAD_JOBS);
        saveChatUploadJobs(activeThreadId, next);
        return next;
      });
    },
    [activeThreadId]
  );

  useEffect(() => {
    const handler = () => {
      setActiveThreadId(getActiveThreadId());
    };
    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, handler);
  }, []);

  // Close source panel when switching chats
  useEffect(() => {
    handleCloseSourcePanel();
  }, [activeThreadId, handleCloseSourcePanel]);

  useEffect(() => {
    uploadSessionRef.current += 1;
    setIsUploadingFile(false);
    const limitedJobs = loadLimitedChatUploadJobs(activeThreadId);
    setChatUploadJobs(limitedJobs);
    saveChatUploadJobs(activeThreadId, limitedJobs);
    setSelectedUploadPreview(null);
    setUploadError(null);
  }, [activeThreadId]);

  useEffect(() => {
    const previousUrl = previousPreviewUrlRef.current;
    const currentUrl = selectedUploadPreview?.previewImageUrl ?? null;
    if (previousUrl && previousUrl !== currentUrl && previousUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrl);
    }
    previousPreviewUrlRef.current = currentUrl;
  }, [selectedUploadPreview?.previewImageUrl]);

  useEffect(() => {
    return () => {
      const currentUrl = previousPreviewUrlRef.current;
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, []);

  useEffect(() => {
    persistChatKnowledgeMode(knowledgeMode);
  }, [knowledgeMode]);

  useEffect(() => {
    if (!plusMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && plusMenuRef.current?.contains(target)) {
        return;
      }
      setPlusMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [plusMenuOpen]);

  const hasPendingUploads = chatUploadJobs.some(
    (job) => job.status === 'pending' || job.status === 'active'
  );
  const selectedUploadIsProcessing = Boolean(
    selectedUploadPreview && UPLOAD_PROCESSING_STATUSES.includes(selectedUploadPreview.status)
  );
  const sendBlockedByUpload = isUploadingFile || hasPendingUploads || selectedUploadIsProcessing;
  const chatContentWidthClass = isSidebarOpen ? 'max-w-3xl' : 'max-w-3xl lg:max-w-none';
  const chatContentPaddingClass = isSidebarOpen ? '' : 'lg:px-8 xl:px-10';

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`;
  }, [input]);

  const handleSubmit = useCallback((event?: FormEvent) => {
    event?.preventDefault();
    if (stopRequestedRef.current) {
      stopRequestedRef.current = false;
      return;
    }
    if (!input.trim() || isLoading || sendBlockedByUpload) return;
    sendMessage(input, {
      knowledgeMode,
      searchMode: knowledgeMode === 'search' ? 'auto' : undefined,
      attachments: buildMessageAttachments(selectedUploadPreview),
    });
    setInput('');
    setSelectedUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [input, isLoading, knowledgeMode, selectedUploadPreview, sendBlockedByUpload, sendMessage]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (stopRequestedRef.current) {
      stopRequestedRef.current = false;
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploadSession = ++uploadSessionRef.current;

      let effectiveKbId = knowledgeBaseId;
      if (!effectiveKbId) {
        const folders = ensureFolders();
        const threads = loadThreads();
        const folderId = getPendingFolderId() || getDefaultFolderId(folders);
        const newThread = createEmptyThread(folderId);
        saveThreadsAndActive([newThread, ...threads], newThread.id);
        setPendingFolderId(null);
        effectiveKbId = `chat-${newThread.id}`;
      }

      setUploadError(null);
      setIsUploadingFile(true);
      const initialPreview: SelectedUploadPreview = {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        excerpt: 'Vorschau wird geladen...',
        previewImageUrl: buildPreviewImageUrl(file),
        status: 'uploading',
        progress: 0,
        stage: 'Datei wird hochgeladen',
      };
      setSelectedUploadPreview(initialPreview);
      try {
        const excerpt = await buildPreviewExcerpt(file);
        if (uploadSession !== uploadSessionRef.current) return;
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                excerpt,
              }
            : prev
        );

        const jobResult = await ingestFile(file, { knowledgeBaseId: effectiveKbId });
        if (uploadSession !== uploadSessionRef.current) return;
        const now = new Date().toISOString();
        const localId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newJob: ChatUploadJob = {
          localId,
          jobId: jobResult.jobId,
          filename: file.name,
          status: jobResult.status,
          progress: jobResult.progress,
          stage: jobResult.stage,
          error: jobResult.error,
          createdAt: now,
          updatedAt: now,
          excerpt: jobResult.excerpt,
          sourceUrl: jobResult.sourceUrl,
        };
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                localId,
                jobId: jobResult.jobId,
                status: jobResult.status,
                progress: inferProgress(jobResult.status, jobResult.progress),
                stage: jobResult.stage || 'Ingestion gestartet',
                error: jobResult.error,
                excerpt: jobResult.excerpt ?? prev.excerpt,
                sourceUrl: jobResult.sourceUrl,
              }
            : prev
        );
        updateChatUploadJobs((prev) => [newJob, ...prev]);
      } catch (err) {
        if (uploadSession !== uploadSessionRef.current) return;
        const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
        setUploadError(message);
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                progress: 100,
                stage: 'Upload fehlgeschlagen',
                error: message,
              }
            : prev
        );
      } finally {
        if (uploadSession === uploadSessionRef.current) {
          setIsUploadingFile(false);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [knowledgeBaseId, updateChatUploadJobs]
  );

  useChatUploadPolling(chatUploadJobs, activeThreadId, updateChatUploadJobs);

  useEffect(() => {
    if (!selectedUploadPreview?.localId) return;
    const latest = chatUploadJobs.find((job) => job.localId === selectedUploadPreview.localId);
    if (!latest) return;
    setSelectedUploadPreview((prev) =>
      prev
        ? {
            ...prev,
            status: latest.status,
            progress: inferProgress(latest.status, latest.progress),
            stage: latest.stage || prev.stage,
            error: latest.error || prev.error,
            excerpt: latest.excerpt || prev.excerpt,
            sourceUrl: latest.sourceUrl || prev.sourceUrl,
          }
        : prev
    );
  }, [chatUploadJobs, selectedUploadPreview?.localId]);

  const handleRemoveSelectedPreview = useCallback(() => {
    const current = selectedUploadPreview;
    if (!current) return;

    if (UPLOAD_PROCESSING_STATUSES.includes(current.status)) {
      uploadSessionRef.current += 1;
      setIsUploadingFile(false);
    }

    if (current.localId) {
      updateChatUploadJobs((prev) => prev.filter((job) => job.localId !== current.localId));
    }

    setSelectedUploadPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedUploadPreview, updateChatUploadJobs]);

  return (
    <main className="flex-1 flex min-h-0 relative bg-transparent select-text">
      <div className="flex min-w-0 flex-1 flex-col select-text">
        <SourcePanel
          activeSource={activeSource}
          sourcePanelWidth={sourcePanelWidth}
          isResizingSourcePanel={isResizingSourcePanel}
          onClose={handleCloseSourcePanel}
          onResizeStart={handleStartSourcePanelResize}
        />
        <ChatHeader />
        <ChatMessages
          messages={messages}
          isSidebarOpen={isSidebarOpen}
          onWelcomeSend={(query) => sendMessage(query, {
            knowledgeMode,
            searchMode: knowledgeMode === 'search' ? 'auto' : undefined,
          })}
          onOpenSource={handleOpenSource}
        />

        <div className="px-4 py-4">
          {selectedUploadPreview && (
            <div className={['mx-auto mb-2 w-full', chatContentWidthClass, chatContentPaddingClass].join(' ')}>
              <SelectedUploadPreviewCard
                preview={selectedUploadPreview}
                onRemove={handleRemoveSelectedPreview}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className={['mx-auto relative w-full', chatContentWidthClass, chatContentPaddingClass].join(' ')}>
            <div className="ci-panel flex flex-col rounded-[1.35rem] transition-all focus-within:border-[#f3aa7f]/55">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  stopRequestedRef.current = false;
                  setInput(event.target.value);
                }}
                onKeyDown={handleKeyDown}
                className="w-full max-h-48 resize-none bg-transparent px-4 pt-4 pb-3 text-sm text-[#2f2b26] placeholder-[#756b62]/70 outline-none disabled:cursor-not-allowed"
                placeholder="Nachricht an WS Copilot senden..."
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="relative" ref={plusMenuRef}>
                    <button
                      type="button"
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center rounded-xl border text-[#756b62] transition-colors',
                        'border-[#2f2b26]/10 bg-transparent hover:border-[#2f2b26]/12 hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]',
                      ].join(' ')}
                      aria-label="Aktionen"
                      aria-haspopup="menu"
                      aria-expanded={plusMenuOpen}
                      title="Aktionen"
                      onClick={() => setPlusMenuOpen((open) => !open)}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.9}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.md,.txt,.html,.docx,.pptx,.js,.php,.ts"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isUploadingFile || hasPendingUploads}
                    />
                    {plusMenuOpen && (
                      <div
                        className="absolute bottom-10 left-0 z-20 min-w-44 rounded-lg border border-[#2f2b26]/10 bg-white p-1 shadow-lg"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          disabled={isUploadingFile || hasPendingUploads}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-[#2f2b26] hover:bg-[#2f2b26]/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            setPlusMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                        >
                          <span className="flex items-center">
                            <svg
                              className="mr-2 h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m21.4 11.05-9.2 9.2a6 6 0 0 1-8.49-8.49l9.9-9.9a4 4 0 0 1 5.66 5.66l-9.9 9.9a2 2 0 1 1-2.83-2.83l8.49-8.49"
                              />
                            </svg>
                            Datei hochladen
                          </span>
                        </button>
                        <button
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={knowledgeMode === 'search'}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-[#2f2b26] hover:bg-[#2f2b26]/[0.04]"
                          onClick={() => {
                            setKnowledgeMode((mode) => (mode === 'search' ? 'docs_plus_model' : 'search'));
                            setPlusMenuOpen(false);
                          }}
                        >
                          <span className="flex items-center">
                            <svg
                              className="mr-2 h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3c-2.2 2.5-3.3 5.5-3.3 9s1.1 6.5 3.3 9" />
                            </svg>
                            Suche
                          </span>
                          {knowledgeMode === 'search' && <span className="text-[#b45f32]">Aktiv</span>}
                        </button>
                      </div>
                    )}
                  </div>
                  <ModelSelector />
                  {knowledgeMode === 'search' && (
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#f3aa7f]/45 bg-[#fff1e8] px-2 text-xs font-medium text-[#2f2b26]"
                      title="Suche deaktivieren"
                      onClick={() => setKnowledgeMode('docs_plus_model')}
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3c-2.2 2.5-3.3 5.5-3.3 9s1.1 6.5 3.3 9" />
                      </svg>
                      <span>Suche</span>
                      <span className="text-[#b45f32]" aria-hidden="true">x</span>
                      <span className="sr-only">Suche deaktivieren</span>
                    </button>
                  )}
                </div>
                {isLoading ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopRequestedRef.current = true;
                      stopStreaming();
                    }}
                    className="ci-button-primary p-2 rounded-full transition-colors flex items-center justify-center"
                    title="Stoppen"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || sendBlockedByUpload}
                    className="ci-button-primary p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      sendBlockedByUpload
                        ? 'Warte, bis die Dokument-Ingestion abgeschlossen ist'
                        : 'Senden'
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 10.5 7.5-7.5 7.5 7.5M12 3v18"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {uploadError &&
              (!selectedUploadPreview || selectedUploadPreview.error !== uploadError) && (
                <p className="mt-2 text-xs text-red-600">{uploadError}</p>
              )}
            <div className="mt-3 text-center text-xs text-[#756b62]">
              KI kann Fehler machen. Überprüfen Sie wichtige Informationen.
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
