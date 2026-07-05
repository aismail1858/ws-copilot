import {
  createChatFolder,
  createHistoryEntryFrom,
  deleteChatFolder,
  deleteHistoryEntry,
  findOrCreateFolderByName,
  moveHistoryEntryToFolder,
  renameChatFolder,
  renameHistoryEntry,
  requestNewChat,
  selectHistoryEntry,
  updateFolderPromptRules,
  type ChatFolder,
  type ChatHistoryEntry,
} from '../../../chat/history';
import { useDialog } from '../../../context/DialogContext';

type SharedArgs = {
  folders: ChatFolder[];
  entries: ChatHistoryEntry[];
  entriesByFolder: Map<string, ChatHistoryEntry[]>;
};

export function useSidebarNavigationActions(
  navigate: ReturnType<typeof import('react-router-dom')['useNavigate']>,
  closeOnMobile: () => void,
  openChangePasswordModal?: () => void
) {
  return {
    handleNewChat(folderId?: string) {
      requestNewChat(folderId);
      navigate('/');
      closeOnMobile();
    },
    handleOpenChat(chatId: string) {
      selectHistoryEntry(chatId);
      navigate('/');
      closeOnMobile();
    },
    handleOpenSettings() {
      navigate('/settings');
      closeOnMobile();
    },
    handleOpenChangePassword() {
      openChangePasswordModal?.();
      closeOnMobile();
    },
  };
}

export function useSidebarFolderActions(
  getSetEditingFolderId: () => (id: string | null) => void
) {
  const dialog = useDialog();

  return {
    async handleCreateFolder() {
      const name = await dialog.prompt({
        title: 'Neuen Ordner erstellen',
        placeholder: 'Ordnername',
      });
      if (name) {
        const folder = createChatFolder(name);
        if (folder) getSetEditingFolderId()(folder.id);
      }
    },
    async handleRenameFolder(folder: ChatFolder) {
      const nextName = await dialog.prompt({
        title: 'Ordnernamen bearbeiten',
        defaultValue: folder.name,
      });
      if (nextName) renameChatFolder(folder.id, nextName);
    },
    async handleEditFolderRules(folder: ChatFolder) {
      const nextRules = await dialog.prompt({
        title: 'Ordner-Regeln / Zusatzprompt',
        defaultValue: folder.promptRules || '',
      });
      if (nextRules !== null) updateFolderPromptRules(folder.id, nextRules);
    },
    async handleDeleteFolder(folder: ChatFolder) {
      if (folder.isDefault) return;
      const confirmed = await dialog.confirm({
        title: 'Ordner löschen',
        message: `Ordner "${folder.name}" wirklich löschen?`,
        confirmLabel: 'Löschen',
        danger: true,
      });
      if (confirmed) deleteChatFolder(folder.id);
    },
  };
}

export function useSidebarChatActions({ folders, entries, entriesByFolder }: SharedArgs) {
  const dialog = useDialog();

  return {
    async handleRenameChat(chatId: string) {
      const entry = entries.find((e) => e.id === chatId);
      const nextTitle = await dialog.prompt({
        title: 'Chat-Titel bearbeiten',
        defaultValue: entry?.title ?? '',
      });
      if (nextTitle) renameHistoryEntry(chatId, nextTitle);
    },
    async handleCloneChat(chatId: string) {
      createHistoryEntryFrom(chatId);
    },
    async handleMoveChat(chatId: string) {
      const folderList = folders.map((f) => f.name).join(', ');
      const currentFolderName = folders
        .find((f) => (entriesByFolder.get(f.id) ?? []).some((e) => e.id === chatId))
        ?.name;
      const targetFolderName = await dialog.prompt({
        title: 'Chat verschieben',
        message: `Vorhandene Ordner: ${folderList}`,
        defaultValue: currentFolderName ?? '',
        placeholder: 'Zielordner',
      });
      if (!targetFolderName) return;
      const targetFolder = findOrCreateFolderByName(targetFolderName);
      if (targetFolder) moveHistoryEntryToFolder(chatId, targetFolder.id);
    },
    async handleDeleteChat(chatId: string) {
      deleteHistoryEntry(chatId);
    },
  };
}
