import type { ChatHistoryEntry } from '../../../chat/history';

type SidebarChatEntryItemProps = {
  entry: ChatHistoryEntry;
  openChatMenuId: string | null;
  setOpenChatMenuId: (id: string | null) => void;
  onOpenChat: (chatId: string) => void;
  onTogglePin: (chatId: string) => void;
  onRenameChat: (chatId: string) => void;
  onCloneChat: (chatId: string) => void;
  onMoveChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
};

export default function SidebarChatEntryItem(props: SidebarChatEntryItemProps) {
  const {
    entry,
    openChatMenuId,
    setOpenChatMenuId,
    onOpenChat,
    onTogglePin,
    onRenameChat,
    onCloneChat,
    onMoveChat,
    onDeleteChat,
  } = props;
  const isMenuOpen = openChatMenuId === entry.id;

  return (
    <div className="relative group/chat">
      <button
        type="button"
        onClick={() => onOpenChat(entry.id)}
        className={[
          'w-full text-left px-3 py-1.5 pr-9 text-sm transition-colors truncate rounded-lg',
          entry.active
            ? 'border border-[#f3aa7f]/40 bg-gradient-to-br from-[#fff1e8] to-[#ffe4d4] text-[#2f2b26]'
            : 'text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]',
        ].join(' ')}
        title={entry.title}
      >
        <div className="flex items-center w-full min-w-0">
          {entry.pinned && <PinnedIcon />}
          <span className="truncate flex-1">{entry.title}</span>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpenChatMenuId(isMenuOpen ? null : entry.id);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#756b62]/70 hover:text-[#2f2b26] hover:bg-[#fff1e8] rounded-full opacity-0 group-hover/chat:opacity-100 transition-opacity"
        aria-label="Chat-Menü"
      >
        <MenuDotsIcon />
      </button>
      {isMenuOpen && (
        <SidebarChatEntryMenu
          entry={entry}
          onTogglePin={onTogglePin}
          onRenameChat={onRenameChat}
          onCloneChat={onCloneChat}
          onMoveChat={onMoveChat}
          onDeleteChat={onDeleteChat}
        />
      )}
    </div>
  );
}

function SidebarChatEntryMenu({
  entry,
  onTogglePin,
  onRenameChat,
  onCloneChat,
  onMoveChat,
  onDeleteChat,
}: Pick<
  SidebarChatEntryItemProps,
  'entry' | 'onTogglePin' | 'onRenameChat' | 'onCloneChat' | 'onMoveChat' | 'onDeleteChat'
>) {
  return (
    <div
      className="absolute z-20 right-2 top-8 min-w-[190px] rounded-xl border border-[#2f2b26]/10 bg-white py-1 shadow-[0_4px_16px_rgba(47,43,38,0.08),0_16px_48px_rgba(47,43,38,0.1)]"
      onClick={(event) => event.stopPropagation()}
    >
      <SidebarChatMenuButton onClick={() => onTogglePin(entry.id)}>
        {entry.pinned ? 'Lösen' : 'Anheften'}
      </SidebarChatMenuButton>
      <SidebarChatMenuButton onClick={() => onRenameChat(entry.id)}>Umbenennen</SidebarChatMenuButton>
      <SidebarChatMenuButton onClick={() => onCloneChat(entry.id)}>
        Neuer Chat daraus
      </SidebarChatMenuButton>
      <SidebarChatMenuButton onClick={() => onMoveChat(entry.id)}>
        In Ordner verschieben
      </SidebarChatMenuButton>
      <SidebarChatMenuButton danger onClick={() => onDeleteChat(entry.id)}>
        Löschen
      </SidebarChatMenuButton>
    </div>
  );
}

function SidebarChatMenuButton({
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

function PinnedIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0 mr-1.5 text-[#756b62]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 3.75 14.25 12l2.25 2.25H12v5.25l-.75.75-.75-.75v-5.25H6.75L9 12 8.25 3.75h6.75Z"
      />
    </svg>
  );
}

function MenuDotsIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 12a.75.75 0 1 0 0 .001V12Zm5.25 0a.75.75 0 1 0 0 .001V12Zm5.25 0a.75.75 0 1 0 0 .001V12Z"
      />
    </svg>
  );
}
