import { useState, type MouseEvent, type ReactNode } from 'react';
import type { SyncStatus } from '@/features/settings/types';

export function Field({
  label,
  description,
  badge,
  children,
}: {
  label: string;
  description?: string;
  badge?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[#2f2b26]/10 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[#2f2b26]">{label}</span>
        {badge === true && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Im Backend gesetzt
          </span>
        )}
        {badge === false && (
          <span className="inline-flex items-center text-xs text-[#756b62] bg-[#fffaf3] border border-[#2f2b26]/10 rounded px-1.5 py-0.5">
            Nicht gesetzt
          </span>
        )}
      </div>
      {description && <p className="text-xs text-zinc-500">{description}</p>}
      {children}
    </div>
  );
}

export function SecretInput({
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-10 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        placeholder={placeholder}
        autoComplete="new-password"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756b62] hover:text-[#2563eb] transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Verbergen' : 'Anzeigen'}
        disabled={disabled}
      >
        {show ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function ModelSelector({
  value,
  models,
  onChange,
  disabled = false,
  allowCustomModels = true,
  protectedModels = [],
}: {
  value: string;
  models: string[];
  onChange: (model: string, newModels: string[]) => void;
  disabled?: boolean;
  allowCustomModels?: boolean;
  protectedModels?: string[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newModel, setNewModel] = useState('');

  const handleAdd = () => {
    if (!allowCustomModels) return;
    const trimmed = newModel.trim();
    if (!trimmed) return;
    const updatedList = models.includes(trimmed) ? models : [...models, trimmed];
    onChange(trimmed, updatedList);
    setNewModel('');
    setIsAdding(false);
  };

  const handleDelete = (event: MouseEvent, model: string) => {
    event.stopPropagation();
    if (protectedModels.includes(model)) return;
    const updatedList = models.filter((entry) => entry !== model);
    onChange(value === model ? (updatedList[0] || '') : value, updatedList);
  };

  const canDeleteCurrentModel =
    allowCustomModels &&
    models.length >= 1 &&
    !disabled &&
    Boolean(value) &&
    !protectedModels.includes(value);

  if (isAdding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={newModel}
          onChange={(event) => setNewModel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAdd();
            if (event.key === 'Escape') setIsAdding(false);
          }}
          className={inputCls}
          placeholder="Modellname eingeben..."
        />
        <button onClick={handleAdd} className={settingsAccentButtonCls}>
          Hinzufügen
        </button>
        <button onClick={() => setIsAdding(false)} className={settingsIconSecondaryButtonCls}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === '__add_new__' && allowCustomModels) {
              setIsAdding(true);
            } else {
              onChange(event.target.value, models);
            }
          }}
          className={selectCls}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
          {allowCustomModels && (
            <>
              <option disabled></option>
              <option value="__add_new__">+ Neues Modell hinzufügen...</option>
            </>
          )}
        </select>
      </div>
      {canDeleteCurrentModel && (
        <button
          onClick={(event) => handleDelete(event, value)}
          title="Aktuelles Modell entfernen"
          className={settingsIconDangerButtonCls}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SyncBadge({ status, error }: { status: SyncStatus; error: string }) {
  if (status === 'idle') return null;
  if (status === 'pending' || status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
        </svg>
        Speichern
      </span>
    );
  }
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Gespeichert
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-400" title={error}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      Fehler
    </span>
  );
}

export const inputCls =
  'ci-input w-full rounded-lg px-3 py-2 text-sm placeholder:text-[#756b62]/70 transition-colors';

export const selectCls =
  'ci-input w-full rounded-lg px-3 py-2 text-sm transition-colors appearance-none cursor-pointer';

const settingsButtonBaseCls =
  'inline-flex items-center justify-center rounded-md border text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/25 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed';

export const settingsSecondaryButtonCls = `${settingsButtonBaseCls} px-3 py-1.5 border-[#2f2b26]/10 text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]`;
export const settingsToggleButtonActiveCls = `${settingsButtonBaseCls} px-3 py-1.5 border-[#f3aa7f]/45 text-[#2f2b26] bg-[#fff1e8]`;
export const settingsDangerButtonCls = `${settingsButtonBaseCls} px-3 py-1.5 border-red-500/35 text-red-700 hover:bg-red-50 hover:border-red-500`;
export const settingsAccentButtonCls = `${settingsButtonBaseCls} px-3 py-2 border-[#f3aa7f]/70 text-[#2f2b26] bg-[#f3aa7f] hover:bg-[#ee9a68]`;
export const settingsIconSecondaryButtonCls = `${settingsButtonBaseCls} px-2.5 py-2 border-[#2f2b26]/10 text-[#756b62] hover:text-[#2f2b26] hover:bg-[#2f2b26]/[0.04]`;
export const settingsIconDangerButtonCls = `${settingsButtonBaseCls} px-2.5 py-2 border-red-500/35 text-red-700 hover:bg-red-50 hover:border-red-500`;
