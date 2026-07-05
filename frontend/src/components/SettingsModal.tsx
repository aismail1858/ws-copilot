import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import {
  Field,
  SyncBadge,
} from '@/features/settings/components/SettingsFields';
import SettingsAdminRuntimeSection from '@/features/settings/components/SettingsAdminRuntimeSection';
import SettingsApiKeysTab from '@/features/settings/components/SettingsApiKeysTab';
import SettingsCompletionSection from '@/features/settings/components/SettingsCompletionSection';
import SettingsTitleSection from '@/features/settings/components/SettingsTitleSection';
import SettingsEmbeddingSection from '@/features/settings/components/SettingsEmbeddingSection';
import SettingsRetrievalLabTab from '@/features/settings/components/SettingsRetrievalLabTab';
import { useCustomProfileSettings } from '@/features/settings/hooks/useCustomProfileSettings';
import { useSettingsRuntimeSync } from '@/features/settings/hooks/useSettingsRuntimeSync';
import {
  type TabId,
} from '@/features/settings/types';
import { uniqueValues } from '@/features/settings/utils/customProfiles';

const LOCAL_RERANKER_PRESET = {
  url: 'http://localhost:8090/rerank',
  model: 'BAAI/bge-reranker-v2-m3',
  headersTemplate: '{}',
  bodyTemplate:
    '{"query":"{{query}}","documents":"{{documents}}","top_n":"{{top_n}}","model":"{{model}}","return_documents":false}',
  resultsPath: 'results',
  indexField: 'index',
  scoreField: 'relevance_score',
} as const;

export default function SettingsModal({ embedded = false, onActiveTabChange }: { embedded?: boolean; onActiveTabChange?: (tab: TabId) => void }) {
  const { settings, updateSettings, isOpen, closeSettings } = useSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('tab-api');
  const backdropRef = useRef<HTMLDivElement>(null);
  const isVisible = embedded || isOpen;

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  useEffect(() => {
    if (embedded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeSettings, embedded]);
  const { backendConfig, myLlmSecrets, syncError, syncStatus } = useSettingsRuntimeSync({
    isVisible,
    settings,
    updateSettings,
    user,
  });

  const {
    activeCustomProfile,
    addCustomProfile,
    canAddCustomProfile,
    customProfiles,
    discardNewCustomProfileDraft,
    duplicateCustomProfile,
    duplicatedCustomProfileLabel,
    editableCustomProfiles,
    isDuplicatingCustomProfileDraft,
    isNewCustomProfileDraftActive,
    newCustomProfileDraft,
    removeCustomProfile,
    setActiveCustomProfile,
    updateCustomProfile,
    updateNewCustomProfileDraft,
  } = useCustomProfileSettings({
    settings,
    updateSettings,
    isVisible,
  });
  const isAdmin = user?.role === 'admin';

  if (!isVisible) return null;

  const applyLocalRerankerPreset = () => {
    updateSettings({
      rerankerEnabled: true,
      rerankerProvider: 'custom',
      rerankerUrl: LOCAL_RERANKER_PRESET.url,
      rerankerModel: LOCAL_RERANKER_PRESET.model,
      rerankerKnownModels: uniqueValues([
        ...(settings.rerankerKnownModels || []),
        LOCAL_RERANKER_PRESET.model,
      ]),
      rerankerHttpHeadersTemplate: LOCAL_RERANKER_PRESET.headersTemplate,
      rerankerHttpBodyTemplate: LOCAL_RERANKER_PRESET.bodyTemplate,
      rerankerHttpResponseResultsPath: LOCAL_RERANKER_PRESET.resultsPath,
      rerankerHttpResponseIndexField: LOCAL_RERANKER_PRESET.indexField,
      rerankerHttpResponseScoreField: LOCAL_RERANKER_PRESET.scoreField,
    });
  };

  const tabs = [
    {
      id: 'tab-api' as TabId,
      label: 'API Keys',
    },
    {
      id: 'tab-llm' as TabId,
      label: 'LLM Einstellungen',
    },
    ...(isAdmin
      ? [
          {
            id: 'tab-lab' as TabId,
            label: 'Retrieval-Labor',
          },
        ]
      : []),
  ];

  const activeTabTitle =
    activeTab === 'tab-api'
      ? 'API Keys'
      : activeTab === 'tab-lab'
        ? 'Retrieval-Labor'
        : 'LLM Einstellungen';

  const isLab = activeTab === 'tab-lab';

  const outerClassName = embedded
    ? 'w-full'
    : isLab
      ? 'fixed inset-0 z-50 flex flex-col bg-white'
      : 'fixed inset-0 bg-[#2f2b26]/18 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  const panelClassName = embedded
    ? 'w-full space-y-4'
    : isLab
      ? 'w-full h-full flex flex-col overflow-hidden'
      : 'w-full max-w-2xl h-[90vh] max-h-[780px] ci-panel rounded-xl overflow-hidden flex flex-col shadow-2xl';
  const tabContentClassName = embedded
    ? 'space-y-8'
    : isLab
      ? 'flex-1 overflow-y-auto px-6 py-5 space-y-8 scrollbar-thin scrollbar-thumb-[#d8c9bd] scrollbar-track-transparent'
      : 'flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin scrollbar-thumb-[#d8c9bd] scrollbar-track-transparent';
  const headerClassName = embedded
    ? 'flex items-center justify-between shrink-0'
    : 'flex items-center justify-between px-6 py-4 border-b border-[#2f2b26]/10 shrink-0';
  const tabBarWrapperClassName = embedded
    ? 'mb-2'
    : 'flex gap-1 px-6 pt-3 pb-0 border-b border-[#2f2b26]/10 shrink-0';
  const tabBarInnerClassName = embedded
    ? 'flex gap-1 bg-white border border-[#2f2b26]/10 rounded-lg p-1 w-fit shadow-sm'
    : 'contents';

  return (
    <div
      ref={backdropRef}
      className={outerClassName}
      onClick={
        embedded
          ? undefined
          : (e) => {
              if (e.target === backdropRef.current) closeSettings();
            }
      }
    >
      <div className={panelClassName}>
        {/* Header */}
        <div className={headerClassName}>
          <div className="flex items-center gap-3">
            <h2 className={embedded ? 'text-xs text-[#756b62] uppercase tracking-wider font-medium' : 'text-[#2f2b26] font-medium text-lg tracking-tight'}>
              {activeTabTitle}
            </h2>
            <SyncBadge status={syncStatus} error={syncError} />
          </div>
          {!embedded && (
            <button
              onClick={closeSettings}
              className="p-2 text-[#756b62] hover:text-[#2f2b26] transition-colors hover:bg-[#2f2b26]/5 rounded-full"
              aria-label="Schließen"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div className={tabBarWrapperClassName}>
          <div className={tabBarInnerClassName}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={
                  embedded
                    ? [
                        'px-3 py-1.5 rounded-md text-sm transition-colors',
                        activeTab === tab.id
                          ? 'bg-[#fff1e8] text-[#2f2b26] shadow-[inset_0_0_0_1px_rgba(243,170,127,0.30)]'
                          : 'text-[#756b62] hover:text-[#2f2b26]',
                      ].join(' ')
                    : [
                        'flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg transition-colors border-b-2 -mb-px',
                        activeTab === tab.id
                          ? 'text-[#2f2b26] border-[#f3aa7f] bg-[#fff1e8]'
                          : 'text-[#756b62] border-transparent hover:text-[#2f2b26] hover:bg-[#2f2b26]/5',
                      ].join(' ')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'tab-api' && (
          <div className={tabContentClassName}>
            <SettingsApiKeysTab
              settings={settings}
              myLlmSecrets={myLlmSecrets}
              updateSettings={updateSettings}
              newCustomProfileDraft={newCustomProfileDraft}
              updateNewCustomProfileDraft={updateNewCustomProfileDraft}
              canAddCustomProfile={canAddCustomProfile}
              addCustomProfile={addCustomProfile}
              discardNewCustomProfileDraft={discardNewCustomProfileDraft}
              duplicateCustomProfile={duplicateCustomProfile}
              duplicatedCustomProfileLabel={duplicatedCustomProfileLabel}
              editableCustomProfiles={editableCustomProfiles}
              activeCustomProfileId={activeCustomProfile.id}
              isDuplicatingCustomProfileDraft={isDuplicatingCustomProfileDraft}
              isNewCustomProfileDraftActive={isNewCustomProfileDraftActive}
              setActiveCustomProfile={setActiveCustomProfile}
              updateCustomProfile={updateCustomProfile}
              removeCustomProfile={removeCustomProfile}
            />
          </div>
        )}

        {/* LLM Settings Tab */}
        {activeTab === 'tab-llm' && (
          <div className={tabContentClassName}>
            {isAdmin && (
              <SettingsEmbeddingSection
                settings={settings}
                backendConfig={backendConfig}
                myLlmSecrets={myLlmSecrets}
                updateSettings={updateSettings}
              />
            )}

            <Field label="System Prompt Ergänzung" description="Wird an den Standard-Prompt angehängt">
              <textarea
                rows={2}
                value={settings.systemPromptAddition}
                onChange={(e) => updateSettings({ systemPromptAddition: e.target.value })}
                className="w-full ci-input rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70 resize-y"
                placeholder="Du bist ein hilfreicher KI-Assistent..."
              />
            </Field>

            <Field label="Temperature">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                  className="flex-1 accent-[#f3aa7f]"
                />
                <span className="text-sm font-mono text-zinc-300 w-12 text-right">{settings.temperature.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>präzise</span>
                <span>kreativ</span>
              </div>
            </Field>

            <SettingsCompletionSection settings={settings} updateSettings={updateSettings} />
            <SettingsTitleSection settings={settings} updateSettings={updateSettings} />

            {isAdmin && (
              <SettingsAdminRuntimeSection
                settings={settings}
                customProfiles={customProfiles}
                activeCustomProfile={activeCustomProfile}
                updateSettings={updateSettings}
                setActiveCustomProfile={setActiveCustomProfile}
                updateCustomProfile={updateCustomProfile}
                applyLocalRerankerPreset={applyLocalRerankerPreset}
              />
            )}
          </div>
        )}

        {activeTab === 'tab-lab' && isAdmin && (
          <div className={tabContentClassName}>
            <SettingsRetrievalLabTab settings={settings} />
          </div>
        )}
      </div>
    </div>
  );
}
