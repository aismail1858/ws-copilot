import type { RuntimeLlmConfig } from '@/api/client';

export type LabKnowledgeMode = 'docs_only' | 'docs_plus_model' | 'search';

export interface VariantDraft {
  id: string;
  label: string;
  llmProvider: RuntimeLlmConfig['provider'];
  llmModel: string;
  llmCustomUrl: string;
  llmCustomApiKey: string;
  temperature: number;
  retrievalMinScore: number;
  hybridLexicalStrategy: 'bm25' | 'fts';
  hybridCandidatePoolSize: number;
  hybridFusionRrfK: number;
  hybridVectorWeight: number;
  hybridLexicalWeight: number;
  multiQueryEnabled: boolean;
  multiQueryMinQueries: number;
  multiQueryMaxQueries: number;
  multiQueryRrfK: number;
  multiQueryExpansionProvider: RuntimeLlmConfig['provider'];
  multiQueryExpansionTemperature: number;
  multiQueryFallbackOnError: boolean;
  ingestionContextualPrefixEnabled: boolean;
  ingestionContextualPrefixProvider: RuntimeLlmConfig['provider'];
  ingestionContextualPrefixMaxTokens: number;
  ingestionContextualPrefixDocumentChars: number;
  ingestionContextualPrefixChunkChars: number;
  retrievalHydeEnabled: boolean;
  retrievalHydeProvider: RuntimeLlmConfig['provider'];
  retrievalHydeTemperature: number;
  retrievalHydeMaxTokens: number;
  retrievalHydeFusionWeight: number;
  rerankerEnabled: boolean;
  rerankerProvider: 'cross_encoder' | 'http' | 'custom';
  rerankerModel: string;
  rerankerUrl: string;
}

const SECRET_KEYS: (keyof VariantDraft)[] = ['llmCustomApiKey'];

export function stripVariantSecrets(draft: VariantDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (SECRET_KEYS.includes(key as keyof VariantDraft)) continue;
    out[key] = value;
  }
  return out;
}
