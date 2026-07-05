import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuthChangedEventName } from '@/auth/session';
import { loadSettings, saveSettings } from '@/api/client';
import { usePersistentUserLlmSettingsSync } from '@/features/settings/hooks/usePersistentUserLlmSettingsSync';
import type { AppSettings } from '@/types';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const authEventName = getAuthChangedEventName();
    const authHandler = () => setSettings(loadSettings());
    window.addEventListener(authEventName, authHandler);

    // Sync settings across tabs/windows
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'ws-copilot-settings' && event.newValue) {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      window.removeEventListener(authEventName, authHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  usePersistentUserLlmSettingsSync({ settings, updateSettings });

  const openSettings = useCallback(() => setIsOpen(true), []);
  const closeSettings = useCallback(() => setIsOpen(false), []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isOpen, openSettings, closeSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
