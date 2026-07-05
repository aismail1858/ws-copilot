import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  ConfirmDialog,
  type ConfirmDialogConfig,
  PromptDialog,
  type PromptDialogConfig,
} from '../components/PromptDialog';

type DialogState =
  | { type: 'prompt'; config: PromptDialogConfig; resolve: (value: string | null) => void }
  | { type: 'confirm'; config: ConfirmDialogConfig; resolve: (value: boolean) => void };

interface DialogContextValue {
  prompt: (config: PromptDialogConfig) => Promise<string | null>;
  confirm: (config: ConfirmDialogConfig) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const prompt = useCallback(
    (config: PromptDialogConfig): Promise<string | null> =>
      new Promise((resolve) => {
        setDialog({ type: 'prompt', config, resolve });
      }),
    []
  );

  const confirm = useCallback(
    (config: ConfirmDialogConfig): Promise<boolean> =>
      new Promise((resolve) => {
        setDialog({ type: 'confirm', config, resolve });
      }),
    []
  );

  const handleClose = useCallback(() => setDialog(null), []);

  return (
    <DialogContext.Provider value={{ prompt, confirm }}>
      {children}
      {dialog?.type === 'prompt' && (
        <PromptDialog
          config={dialog.config}
          onConfirm={(value) => {
            dialog.resolve(value);
            handleClose();
          }}
        />
      )}
      {dialog?.type === 'confirm' && (
        <ConfirmDialog
          config={dialog.config}
          onConfirm={(result) => {
            dialog.resolve(result);
            handleClose();
          }}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
