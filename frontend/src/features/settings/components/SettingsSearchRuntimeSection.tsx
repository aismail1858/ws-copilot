import { Field, inputCls, selectCls } from '@/features/settings/components/SettingsFields';
import type { LLMProvider } from '@/types';
import {
  clampDecimalInput,
  clampIntegerInput,
  type RuntimeSettingsProps,
} from './settingsAdminRuntimeShared';

function RetrievalThresholdField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <Field
      label="Retrieval Threshold"
      description={`Mindest-Score für Kontext-Chunks (${settings.retrievalMinScore.toFixed(2)})`}
    >
      <input
        type="range"
        min={0}
        max={2}
        step={0.01}
        value={settings.retrievalMinScore}
        onChange={(e) =>
          updateSettings({ retrievalMinScore: clampDecimalInput(e.target.value, 0, 2, 0) })
        }
        className="w-full accent-[#f3aa7f]"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>0 - locker</span>
        <span>0.30 - default</span>
        <span>2 - streng</span>
      </div>
    </Field>
  );
}

function NumberInputField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-500">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clampIntegerInput(e.target.value, min, max))}
        className={inputCls}
      />
    </div>
  );
}

function DecimalInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={5}
      step={0.1}
      value={value}
      onChange={(e) => onChange(clampDecimalInput(e.target.value, 0, 5, 0))}
      className={inputCls}
    />
  );
}

function HybridWeightsField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-500">
        Weights V/L ({settings.hybridVectorWeight.toFixed(2)} /{' '}
        {settings.hybridLexicalWeight.toFixed(2)})
      </label>
      <div className="grid grid-cols-2 gap-2">
        <DecimalInput
          value={settings.hybridVectorWeight}
          onChange={(value) => updateSettings({ hybridVectorWeight: value })}
        />
        <DecimalInput
          value={settings.hybridLexicalWeight}
          onChange={(value) => updateSettings({ hybridLexicalWeight: value })}
        />
      </div>
    </div>
  );
}

function HybridSearchField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <Field
      label="Hybrid Search"
      description="Lexikalische Kandidaten und Vector-Treffer werden symmetrisch gesammelt und per gewichteter RRF fusioniert."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Lexical Strategy</label>
          <select
            value={settings.hybridLexicalStrategy}
            onChange={(e) =>
              updateSettings({ hybridLexicalStrategy: e.target.value === 'fts' ? 'fts' : 'bm25' })
            }
            className={selectCls}
          >
            <option value="bm25">BM25-orientiert</option>
            <option value="fts">Postgres FTS Rank</option>
          </select>
        </div>
        <NumberInputField
          label="Candidate Pool"
          value={settings.hybridCandidatePoolSize}
          onChange={(value) => updateSettings({ hybridCandidatePoolSize: value })}
          min={1}
          max={100}
        />
        <NumberInputField
          label="Hybrid RRF-K"
          value={settings.hybridFusionRrfK}
          onChange={(value) => updateSettings({ hybridFusionRrfK: value })}
          min={1}
          max={200}
        />
        <HybridWeightsField settings={settings} updateSettings={updateSettings} />
      </div>
    </Field>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#756b62]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-[#2f2b26]/20 accent-[#f3aa7f]"
      />
      {label}
    </label>
  );
}

function MultiQueryTogglesField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <Field
      label="Multi-Query Hybrid Search"
      description="Erweitert Suchanfragen um Varianten und fusioniert Ergebnisse per RRF."
    >
      <div className="space-y-3">
        <CheckboxRow
          checked={settings.multiQueryEnabled}
          label="Multi-Query aktivieren"
          onChange={(checked) => updateSettings({ multiQueryEnabled: checked })}
        />
        <CheckboxRow
          checked={settings.multiQueryFallbackOnError}
          label="Bei Fehlern auf Single-Query zurückfallen"
          onChange={(checked) => updateSettings({ multiQueryFallbackOnError: checked })}
        />
      </div>
    </Field>
  );
}

function MultiQueryCountField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <Field
      label="Anzahl Suchqueries"
      description={`Min ${settings.multiQueryMinQueries}, Max ${settings.multiQueryMaxQueries}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberInputField
          label="Min Queries"
          value={settings.multiQueryMinQueries}
          onChange={(value) =>
            updateSettings({
              multiQueryMinQueries: value,
              multiQueryMaxQueries: Math.max(value, settings.multiQueryMaxQueries),
            })
          }
          min={1}
          max={10}
        />
        <NumberInputField
          label="Max Queries"
          value={settings.multiQueryMaxQueries}
          onChange={(value) =>
            updateSettings({
              multiQueryMinQueries: Math.min(settings.multiQueryMinQueries, value),
              multiQueryMaxQueries: value,
            })
          }
          min={1}
          max={10}
        />
      </div>
    </Field>
  );
}

function RangeField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  leftLabel,
  centerLabel,
  rightLabel,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
}) {
  return (
    <Field label={label} description={description}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clampDecimalInput(e.target.value, min, max, min))}
        className="w-full accent-[#f3aa7f]"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-500">
        <span>{leftLabel}</span>
        <span>{centerLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </Field>
  );
}

function MultiQueryExpansionField({ settings, updateSettings }: RuntimeSettingsProps) {
  return (
    <>
      <Field
        label="Expansion Provider"
        description="LLM-Provider für die Generierung alternativer Suchanfragen."
      >
        <select
          value={settings.multiQueryExpansionProvider}
          onChange={(e) =>
            updateSettings({ multiQueryExpansionProvider: e.target.value as LLMProvider })
          }
          className={selectCls}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="ollama">Ollama</option>
          <option value="custom">Custom</option>
        </select>
      </Field>
      <RangeField
        label="Expansion Temperature"
        description={`Kreativität für Query-Varianten (${settings.multiQueryExpansionTemperature.toFixed(2)})`}
        value={settings.multiQueryExpansionTemperature}
        min={0}
        max={2}
        step={0.05}
        onChange={(value) => updateSettings({ multiQueryExpansionTemperature: value })}
        leftLabel="0 - konservativ"
        centerLabel="1 - ausgewogen"
        rightLabel="2 - divers"
      />
      <RangeField
        label="RRF-K"
        description={`Reciprocal Rank Fusion Konstante (${settings.multiQueryRrfK})`}
        value={settings.multiQueryRrfK}
        min={1}
        max={200}
        step={1}
        onChange={(value) => updateSettings({ multiQueryRrfK: Math.round(value) })}
        leftLabel="1 - rank-sensitiv"
        centerLabel="60 - default"
        rightLabel="200 - divers"
      />
    </>
  );
}

export function SettingsSearchRuntimeSection(props: RuntimeSettingsProps) {
  return (
    <>
      <RetrievalThresholdField {...props} />
      <HybridSearchField {...props} />
      <MultiQueryTogglesField {...props} />
      <MultiQueryCountField {...props} />
      <MultiQueryExpansionField {...props} />
    </>
  );
}
