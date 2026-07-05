import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface LayoutContextValue {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  isChangePasswordModalOpen: boolean;
  openChangePasswordModal: () => void;
  closeChangePasswordModal: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  const openChangePasswordModal = useCallback(() => setIsChangePasswordModalOpen(true), []);
  const closeChangePasswordModal = useCallback(() => setIsChangePasswordModalOpen(false), []);

  const value = useMemo<LayoutContextValue>(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      isChangePasswordModalOpen,
      openChangePasswordModal,
      closeChangePasswordModal,
    }),
    [isSidebarOpen, isChangePasswordModalOpen, openSidebar, closeSidebar, toggleSidebar, openChangePasswordModal, closeChangePasswordModal]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
}

