import { togglePinnedHistoryEntry } from '../../../chat/history';
import SidebarChatEntryItem from './SidebarChatEntryItem';
import SidebarFolderSection from './SidebarFolderSection';
import type { SidebarController } from '../types';

type SidebarHistoryListProps = {
  controller: SidebarController;
};

export default function SidebarHistoryList({ controller }: SidebarHistoryListProps) {
  const sharedChatProps = {
    openChatMenuId: controller.openChatMenuId,
    setOpenChatMenuId: controller.setOpenChatMenuId,
    onOpenChat: controller.handleOpenChat,
    onTogglePin: togglePinnedHistoryEntry,
    onRenameChat: controller.handleRenameChat,
    onCloneChat: controller.handleCloneChat,
    onMoveChat: controller.handleMoveChat,
    onDeleteChat: controller.handleDeleteChat,
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
      {controller.searchQuery.trim() ? (
        <SidebarSearchResults entries={controller.entries} chatEntryProps={sharedChatProps} />
      ) : (
        controller.folders.map((folder) =>
          folder.isDefault ? (
            <SidebarDefaultSection
              key={folder.id}
              entries={controller.entriesByFolder.get(folder.id) ?? []}
              chatEntryProps={sharedChatProps}
            />
          ) : (
            <SidebarFolderSection
              key={folder.id}
              folder={folder}
              entries={controller.entriesByFolder.get(folder.id) ?? []}
              isEditing={controller.editingFolderId === folder.id}
              onFinishEditing={() => controller.setEditingFolderId(null)}
              openFolderMenuId={controller.openFolderMenuId}
              setOpenFolderMenuId={controller.setOpenFolderMenuId}
              onNewChatInFolder={() => controller.handleNewChat(folder.id)}
              onRenameFolder={() => controller.handleRenameFolder(folder)}
              onEditFolderRules={() => controller.handleEditFolderRules(folder)}
              onDeleteFolder={() => controller.handleDeleteFolder(folder)}
              {...sharedChatProps}
            />
          )
        )
      )}
    </div>
  );
}

function SidebarSearchResults({
  entries,
  chatEntryProps,
}: {
  entries: SidebarController['entries'];
  chatEntryProps: Omit<Parameters<typeof SidebarChatEntryItem>[0], 'entry'>;
}) {
  return (
    <div className="space-y-0.5">
      {entries.length === 0 && (
        <p className="px-3 py-2 text-sm text-zinc-500 text-center">Keine Ergebnisse gefunden.</p>
      )}
      {entries.map((entry) => (
        <SidebarChatEntryItem key={entry.id} entry={entry} {...chatEntryProps} />
      ))}
    </div>
  );
}

function SidebarDefaultSection({
  entries,
  chatEntryProps,
}: {
  entries: SidebarController['entries'];
  chatEntryProps: Omit<Parameters<typeof SidebarChatEntryItem>[0], 'entry'>;
}) {
  return (
    <div className="space-y-0.5 mb-4">
      {entries.map((entry) => (
        <SidebarChatEntryItem key={entry.id} entry={entry} {...chatEntryProps} />
      ))}
    </div>
  );
}
