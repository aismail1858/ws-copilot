import type { ChatFolder, ChatHistoryEntry } from '../../chat/history';

export interface SidebarController {
  folders: ChatFolder[];
  entries: ChatHistoryEntry[];
  entriesByFolder: Map<string, ChatHistoryEntry[]>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  editingFolderId: string | null;
  setEditingFolderId: (id: string | null) => void;
  openChatMenuId: string | null;
  setOpenChatMenuId: (id: string | null) => void;
  openFolderMenuId: string | null;
  setOpenFolderMenuId: (id: string | null) => void;
  handleNewChat: (folderId?: string) => void;
  handleCreateFolder: () => Promise<void>;
  handleOpenChat: (chatId: string) => void;
  handleRenameChat: (chatId: string) => Promise<void>;
  handleCloneChat: (chatId: string) => Promise<void>;
  handleMoveChat: (chatId: string) => Promise<void>;
  handleDeleteChat: (chatId: string) => Promise<void>;
  handleRenameFolder: (folder: ChatFolder) => Promise<void>;
  handleEditFolderRules: (folder: ChatFolder) => Promise<void>;
  handleDeleteFolder: (folder: ChatFolder) => Promise<void>;
  handleOpenSettings: () => void;
  handleOpenChangePassword: () => void;
}
