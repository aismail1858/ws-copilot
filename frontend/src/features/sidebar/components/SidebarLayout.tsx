import { useState } from 'react';
import SidebarBrand from './SidebarBrand';
import SidebarHistoryList from './SidebarHistoryList';
import SidebarNavigation from './SidebarNavigation';
import SidebarQuickActions from './SidebarQuickActions';
import SidebarSearch from './SidebarSearch';
import SidebarUserPanel from './SidebarUserPanel';
import type { SidebarController } from '../types';
import type { AuthUser } from '../../../lib/types';

export interface SidebarLayoutProps {
  controller: SidebarController;
  user: AuthUser | null;
  onLogout: () => void;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function SidebarLayout({
  controller,
  user,
  onLogout,
  isSidebarOpen,
  onCloseSidebar,
}: SidebarLayoutProps) {
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <aside
      className={[
        'flex shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-[width,transform,opacity] duration-300',
        'fixed inset-y-0 left-0 z-40 w-72 md:static',
        isSidebarOpen
          ? 'translate-x-0 opacity-100'
          : '-translate-x-full opacity-100 md:w-0 md:translate-x-0 md:border-r-transparent md:opacity-0 md:pointer-events-none',
        isSidebarOpen
          ? 'shadow-[4px_0_24px_rgba(47,43,38,0.06),12px_0_48px_rgba(47,43,38,0.04)]'
          : 'md:shadow-none',
      ].join(' ')}
      aria-hidden={!isSidebarOpen}
    >
      <SidebarBrand onCloseSidebar={onCloseSidebar} />
      <SidebarQuickActions
        onNewChat={() => controller.handleNewChat()}
        onCreateFolder={controller.handleCreateFolder}
      />
      <SidebarSearch
        searchQuery={controller.searchQuery}
        onSearchQueryChange={controller.setSearchQuery}
      />
      <SidebarHistoryList controller={controller} />
      <div className="border-t border-[#2f2b26]/10 mt-auto">
        <button
          type="button"
          onClick={() => setNavCollapsed((prev) => !prev)}
          className="flex items-center justify-between w-full px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[#756b62] hover:text-[#2f2b26] transition-colors"
        >
          <span>Menu</span>
          <svg
            className={['w-3 h-3 transition-transform duration-200', navCollapsed ? '' : 'rotate-180'].join(' ')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {!navCollapsed && (
          <>
            <SidebarNavigation user={user} onCloseSidebar={onCloseSidebar} />
            <SidebarUserPanel
              user={user}
              onOpenSettings={controller.handleOpenSettings}
              onOpenChangePassword={controller.handleOpenChangePassword}
              onLogout={onLogout}
            />
          </>
        )}
      </div>
    </aside>
  );
}
