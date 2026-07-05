import type { ChatAnswerMode, ChatAnswerModeReason } from '@/types';

export interface AnswerModePresentation {
  label: string;
  className: string;
  description: string;
}

export function getAnswerModePresentation(
  answerMode: ChatAnswerMode,
  answerModeReason?: ChatAnswerModeReason
): AnswerModePresentation {
  if (answerMode === 'docs_grounded' || answerMode === 'web_agent_v4') {
    return {
      label: answerMode === 'web_agent_v4' ? 'Webgestuetzt' : 'Dokumentengestuetzt',
      className: 'border-emerald-600/25 bg-emerald-50 text-emerald-700',
      description:
        answerMode === 'web_agent_v4'
          ? 'Die Antwort ist durch Websuche und gelesene Quellen gestuetzt.'
          : 'Die Antwort ist durch ausreichend passenden Dokumentkontext gestuetzt.',
    };
  }

  if (answerMode === 'model_fallback') {
    return {
      label: 'Modellwissen',
      className: 'border-orange-600/25 bg-orange-50 text-orange-700',
      description: describeModelFallback(answerModeReason),
    };
  }

  return {
    label: 'Doku nicht ausreichend',
    className: 'border-zinc-500/25 bg-zinc-50 text-zinc-700',
    description: describeInsufficientDocs(answerModeReason),
  };
}

function describeModelFallback(answerModeReason?: ChatAnswerModeReason): string {
  switch (answerModeReason) {
    case 'metadata_only_match':
      return 'Es passten nur Dokumentname oder Metadaten, nicht der eigentliche Inhalt.';
    case 'insufficient_support':
      return 'Der gefundene Dokumentkontext war zu schwach fuer eine belastbare Antwort.';
    case 'unsupported_answer':
      return 'Die erste Dokumentantwort war nicht ausreichend belegt und wurde ohne Dokumentkontext neu erzeugt.';
    case 'no_relevant_context':
    default:
      return 'Es wurde kein ausreichend passender Dokumentkontext gefunden.';
  }
}

function describeInsufficientDocs(answerModeReason?: ChatAnswerModeReason): string {
  switch (answerModeReason) {
    case 'metadata_only_match':
      return 'Es passten nur Dokumentname oder Metadaten, nicht der eigentliche Inhalt.';
    case 'insufficient_support':
      return 'Der gefundene Dokumentkontext war zu schwach fuer eine belastbare Antwort.';
    case 'document_refusal':
      return 'Das Modell konnte aus dem Dokumentkontext keine belastbare Antwort ableiten.';
    case 'unsupported_answer':
      return 'Die erzeugte Antwort war nicht ausreichend durch den Dokumentkontext belegt.';
    case 'fallback_disabled':
      return 'Es wurde kein tragfaehiger Dokumentkontext gefunden und Modellwissen ist deaktiviert.';
    case 'no_relevant_context':
    default:
      return 'In den Dokumenten wurde kein ausreichend passender Inhalt gefunden.';
  }
}
