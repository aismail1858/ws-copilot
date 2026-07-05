import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface PromptDialogConfig {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
}

interface PromptDialogProps {
  config: PromptDialogConfig;
  onConfirm: (value: string | null) => void;
}

export function PromptDialog({ config, onConfirm }: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(config.defaultValue ?? '');

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onConfirm(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    onConfirm(trimmed || null);
  };

  return (
    <div
      className="fixed inset-0 bg-[#2f2b26]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onConfirm(null);
      }}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[#2f2b26] font-medium text-lg tracking-tight">{config.title}</h2>
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="relative z-10 p-2 text-[#756b62] hover:text-[#2f2b26] transition-colors hover:bg-[#2f2b26]/[0.04] rounded-full"
            aria-label="Schliessen"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {config.message && (
            <p className="text-sm text-[#756b62] whitespace-pre-line">{config.message}</p>
          )}
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={config.placeholder}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onConfirm(null)}>
              Abbrechen
            </Button>
            <Button type="submit">
              Bestätigen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmDialogProps {
  config: ConfirmDialogConfig;
  onConfirm: (result: boolean) => void;
}

export function ConfirmDialog({ config, onConfirm }: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onConfirm(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm]);

  return (
    <div
      className="fixed inset-0 bg-[#2f2b26]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onConfirm(false);
      }}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[#2f2b26] font-medium text-lg tracking-tight">{config.title}</h2>
          <button
            type="button"
            onClick={() => onConfirm(false)}
            className="relative z-10 p-2 text-[#756b62] hover:text-[#2f2b26] transition-colors hover:bg-[#2f2b26]/[0.04] rounded-full"
            aria-label="Schliessen"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          <p className="text-sm text-[#756b62]">{config.message}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onConfirm(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(true)}
              variant={config.danger ? 'destructive' : 'default'}
            >
              {config.confirmLabel ?? 'Bestätigen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
