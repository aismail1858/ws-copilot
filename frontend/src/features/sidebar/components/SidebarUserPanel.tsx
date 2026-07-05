import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { AuthUser } from '../../../lib/types';

type SidebarUserPanelProps = {
  user: AuthUser | null;
  onOpenSettings: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
};

export default function SidebarUserPanel({
  user,
  onOpenSettings,
  onOpenChangePassword,
  onLogout,
}: SidebarUserPanelProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const isAdmin = user?.role === 'admin';
  const isSettingsActive = location.pathname === '/settings';

  return (
    <div className="px-3 pb-3 pt-1 flex flex-col gap-1">
      {isAdmin && (
        <button
          onClick={onOpenSettings}
          className={[
            'flex transition-colors w-full rounded-lg px-3 py-2 gap-x-3 items-center',
            isSettingsActive
              ? 'bg-[#fff1e8] text-[#2f2b26]'
              : 'text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]',
          ].join(' ')}
        >
          <SettingsIcon />
          <span>Konfiguration</span>
        </button>
      )}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          className="flex items-center justify-between w-full rounded-lg px-3 py-2 hover:bg-[#2f2b26]/[0.04] transition-colors group text-left"
        >
          <div className="flex items-center gap-x-3 text-[#756b62] group-hover:text-[#2f2b26] transition-colors">
            <UserIcon />
            <div className="flex flex-col overflow-hidden w-24 sm:w-28">
              <span className="truncate text-sm font-medium text-[#2f2b26]">
                {user?.displayName || user?.email || 'Admin Profil'}
              </span>
              <span className="text-[10px] text-[#756b62] uppercase tracking-wider">
                Rolle: {user?.role ?? 'unknown'}
              </span>
            </div>
          </div>
          <ChevronIcon isOpen={isUserMenuOpen} />
        </button>

        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-[#2f2b26]/10 bg-white shadow-[0_4px_16px_rgba(47,43,38,0.08),0_16px_48px_rgba(47,43,38,0.1)]">
            <div className="px-4 py-3 border-b border-[#2f2b26]/10">
              <p className="text-sm font-medium text-[#2f2b26] truncate">
                {user?.displayName || user?.email || 'Unbekannt'}
              </p>
              <p className="text-[11px] text-[#756b62] uppercase tracking-wider mt-0.5">
                {user?.role === 'admin' ? 'Administrator' : 'Benutzer'}
              </p>
            </div>
            <button
              onClick={() => {
                onOpenChangePassword();
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-x-3 w-full px-4 py-2.5 text-sm text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26] transition-colors"
            >
              <KeyIcon />
              <span>Passwort ändern</span>
            </button>
            <div className="border-t border-[#2f2b26]/10" />
            <button
              onClick={() => {
                onLogout();
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogoutIcon />
              <span>Abmelden</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM3 18.75a6 6 0 0 1 12 0v.75H3v-.75Z" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg className={`w-4 h-4 shrink-0 text-[#756b62] transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0 3-3m0 0 3 3m-3-3H9" />
    </svg>
  );
}
