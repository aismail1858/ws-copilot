import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { renameChatFolder } from '../../../chat/historyFolderOperations';
import type { ChatFolder, ChatHistoryEntry } from '../../../chat/history';
import SidebarChatEntryItem from './SidebarChatEntryItem';

type SidebarFolderSectionProps = {
  folder: ChatFolder;
  entries: ChatHistoryEntry[];
  isEditing: boolean;
  onFinishEditing: () => void;
  openFolderMenuId: string | null;
  setOpenFolderMenuId: (id: string | null) => void;
  openChatMenuId: string | null;
  setOpenChatMenuId: (id: string | null) => void;
  onNewChatInFolder: () => void;
  onOpenChat: (chatId: string) => void;
  onTogglePin: (chatId: string) => void;
  onRenameChat: (chatId: string) => void;
  onCloneChat: (chatId: string) => void;
  onMoveChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameFolder: () => void;
  onEditFolderRules: () => void;
  onDeleteFolder: () => void;
};

export default function SidebarFolderSection({
  folder,
  entries,
  isEditing,
  onFinishEditing,
  openFolderMenuId,
  setOpenFolderMenuId,
  onNewChatInFolder,
  onRenameFolder,
  onEditFolderRules,
  onDeleteFolder,
  ...chatEntryProps
}: SidebarFolderSectionProps) {
  const isMenuOpen = openFolderMenuId === folder.id;
  const hasActiveEntry = entries.some((entry) => entry.active);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (hasActiveEntry) setIsExpanded(true);
  }, [hasActiveEntry]);

  return (
    <div className="mb-4">
      <SidebarFolderHeader
        folder={folder}
        isEditing={isEditing}
        onFinishEditing={onFinishEditing}
        isMenuOpen={isMenuOpen}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((expanded) => !expanded)}
        setOpenFolderMenuId={setOpenFolderMenuId}
        onNewChatInFolder={() => {
          setIsExpanded(true);
          onNewChatInFolder();
        }}
        onRenameFolder={onRenameFolder}
        onEditFolderRules={onEditFolderRules}
        onDeleteFolder={onDeleteFolder}
      />
      {isExpanded && <SidebarFolderEntries entries={entries} chatEntryProps={chatEntryProps} />}
    </div>
  );
}

function SidebarFolderHeader({
  folder,
  isEditing,
  onFinishEditing,
  isMenuOpen,
  isExpanded,
  onToggleExpanded,
  setOpenFolderMenuId,
  onNewChatInFolder,
  onRenameFolder,
  onEditFolderRules,
  onDeleteFolder,
}: {
  folder: ChatFolder;
  isEditing: boolean;
  onFinishEditing: () => void;
  isMenuOpen: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  setOpenFolderMenuId: (id: string | null) => void;
  onNewChatInFolder: () => void;
  onRenameFolder: () => void;
  onEditFolderRules: () => void;
  onDeleteFolder: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(folder.name);

  useEffect(() => {
    if (isEditing) {
      setDraft(folder.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, folder.name]);

  const commitName = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== folder.name) {
      renameChatFolder(folder.id, trimmed);
    } else if (!trimmed) {
      setDraft(folder.name);
    }
    onFinishEditing();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') {
      setDraft(folder.name);
      onFinishEditing();
    }
  };

  return (
    <div className="relative flex items-center justify-between px-2 py-1.5 group/folder">
      {isEditing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronIcon expanded={isExpanded} />
          <FolderIcon />
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleKeyDown}
            className="text-sm font-medium text-[#2f2b26] bg-[#f5efe7] border border-[#2f2b26]/20 rounded px-1.5 py-0.5 outline-none focus:border-[#2f2b26]/40 min-w-0 flex-1"
          />
        </div>
      ) : (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-0.5 pr-2 text-left hover:text-[#2f2b26]"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `${folder.name} einklappen` : `${folder.name} aufklappen`}
          title={isExpanded ? 'Ordner einklappen' : 'Ordner aufklappen'}
        >
          <ChevronIcon expanded={isExpanded} color="#2563eb" />
          <FolderIcon color="#2563eb" />
          <span className="text-sm font-medium text-[#2563eb] truncate">{folder.name}</span>
          {folder.promptRules && <PromptRulesDot />}
        </button>
      )}
      {!isEditing && (
        <SidebarFolderControls
          folder={folder}
          isMenuOpen={isMenuOpen}
          setOpenFolderMenuId={setOpenFolderMenuId}
          onNewChatInFolder={onNewChatInFolder}
          onRenameFolder={onRenameFolder}
          onEditFolderRules={onEditFolderRules}
          onDeleteFolder={onDeleteFolder}
        />
      )}
    </div>
  );
}

function SidebarFolderEntries({
  entries,
  chatEntryProps,
}: {
  entries: ChatHistoryEntry[];
  chatEntryProps: Omit<SidebarFolderSectionProps, 'folder' | 'entries' | 'isEditing' | 'onFinishEditing' | 'openFolderMenuId' | 'setOpenFolderMenuId' | 'onNewChatInFolder' | 'onRenameFolder' | 'onEditFolderRules' | 'onDeleteFolder'>;
}) {
  return (
    <div className="pl-4 space-y-0.5 mt-1 ml-2">
      {entries.length === 0 && (
        <p className="px-3 py-1.5 text-[11px] text-[#a08d79]">Keine Chats im Ordner.</p>
      )}
      {entries.map((entry) => (
        <SidebarChatEntryItem key={entry.id} entry={entry} {...chatEntryProps} />
      ))}
    </div>
  );
}

function SidebarFolderControls({
  folder,
  isMenuOpen,
  setOpenFolderMenuId,
  onNewChatInFolder,
  onRenameFolder,
  onEditFolderRules,
  onDeleteFolder,
}: {
  folder: ChatFolder;
  isMenuOpen: boolean;
  setOpenFolderMenuId: (id: string | null) => void;
  onNewChatInFolder: () => void;
  onRenameFolder: () => void;
  onEditFolderRules: () => void;
  onDeleteFolder: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-opacity">
        <SidebarFolderActionButton
          title="Neuer Chat im Ordner"
          onClick={(event) => {
            event.stopPropagation();
            onNewChatInFolder();
          }}
        >
          <AddIcon />
        </SidebarFolderActionButton>
        <SidebarFolderActionButton
          title="Ordner-Menü"
          onClick={(event) => {
            event.stopPropagation();
            setOpenFolderMenuId(isMenuOpen ? null : folder.id);
          }}
        >
          <MenuDotsIcon />
        </SidebarFolderActionButton>
      </div>
      {isMenuOpen && (
        <SidebarFolderMenu
          canDelete={!folder.isDefault}
          onRenameFolder={onRenameFolder}
          onEditFolderRules={onEditFolderRules}
          onDeleteFolder={onDeleteFolder}
        />
      )}
    </>
  );
}

function SidebarFolderMenu({
  canDelete,
  onRenameFolder,
  onEditFolderRules,
  onDeleteFolder,
}: {
  canDelete: boolean;
  onRenameFolder: () => void;
  onEditFolderRules: () => void;
  onDeleteFolder: () => void;
}) {
  return (
    <div className="absolute z-20 right-2 top-8 min-w-[180px] rounded-xl border border-[#2f2b26]/10 bg-white py-1 shadow-[0_4px_16px_rgba(47,43,38,0.08),0_16px_48px_rgba(47,43,38,0.1)]">
      <SidebarFolderMenuButton onClick={onRenameFolder}>Umbenennen</SidebarFolderMenuButton>
      <SidebarFolderMenuButton onClick={onEditFolderRules}>Regeln bearbeiten</SidebarFolderMenuButton>
      {canDelete && (
        <SidebarFolderMenuButton danger onClick={onDeleteFolder}>
          Ordner löschen
        </SidebarFolderMenuButton>
      )}
    </div>
  );
}

function SidebarFolderMenuButton({
  children,
  danger = false,
  onClick,
}: {
  children: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2f2b26]/[0.04] ${
        danger ? 'text-red-600' : 'text-[#756b62] hover:text-[#2f2b26]'
      }`}
    >
      {children}
    </button>
  );
}

function SidebarFolderActionButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
      title={title}
    >
      {children}
    </button>
  );
}

function ChevronIcon({ expanded, color }: { expanded: boolean; color?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
      style={color ? { color } : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

function FolderIcon({ color }: { color?: string }) {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      style={color ? { color } : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  );
}

function PromptRulesDot() {
  return (
    <span className="w-1.5 h-1.5 rounded-full bg-[#f3aa7f] shrink-0" title="Regeln aktiv"></span>
  );
}

function AddIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MenuDotsIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 12a.75.75 0 1 0 0 .001V12Zm5.25 0a.75.75 0 1 0 0 .001V12Zm5.25 0a.75.75 0 1 0 0 .001V12Z"
      />
    </svg>
  );
}
