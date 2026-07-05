import { useEffect, useMemo, useState } from 'react';
import {
  CHAT_HISTORY_CHANGED_EVENT,
  getHistoryEntries,
  loadChatFolders,
  searchHistory,
} from '../../../chat/history';
import {
  useSidebarChatActions,
  useSidebarFolderActions,
  useSidebarNavigationActions,
} from '../utils/sidebarActions';
import type { SidebarController } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../../context/LayoutContext';

export function useSidebarController(closeOnMobile: () => void): SidebarController {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const { folders, entries, entriesByFolder } = useSidebarHistoryData(searchQuery);
  const menuState = useSidebarMenuState();
  const { openChangePasswordModal } = useLayout();
  const navigationActions = useSidebarNavigationActions(navigate, closeOnMobile, openChangePasswordModal);
  const folderActions = useSidebarFolderActions(() => setEditingFolderId);
  const chatActions = useSidebarChatActions({ folders, entries, entriesByFolder });

  return {
    folders,
    entries,
    entriesByFolder,
    searchQuery,
    setSearchQuery,
    editingFolderId,
    setEditingFolderId,
    ...menuState,
    ...navigationActions,
    ...folderActions,
    ...chatActions,
  };
}

function useSidebarHistoryData(searchQuery: string) {
  const [folders, setFolders] = useState(() => loadChatFolders());
  const [entries, setEntries] = useState(() => getHistoryEntries());

  useEffect(() => {
    const refresh = () => {
      setFolders(loadChatFolders());
      setEntries(getEntriesForQuery(searchQuery));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key) refresh();
    };

    refresh();
    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [searchQuery]);

  const entriesByFolder = useMemo(() => createEntriesByFolder(folders, entries), [folders, entries]);
  return { folders, entries, entriesByFolder };
}

function useSidebarMenuState() {
  const [openChatMenuId, setOpenChatMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);

  useEffect(() => {
    const closeMenus = () => {
      setOpenChatMenuId(null);
      setOpenFolderMenuId(null);
    };

    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  return { openChatMenuId, setOpenChatMenuId, openFolderMenuId, setOpenFolderMenuId };
}

function getEntriesForQuery(searchQuery: string) {
  const query = searchQuery.trim();
  return query ? searchHistory(query) : getHistoryEntries();
}

function createEntriesByFolder(
  folders: ReturnType<typeof loadChatFolders>,
  entries: ReturnType<typeof getHistoryEntries>
) {
  const map = new Map<string, ReturnType<typeof getHistoryEntries>>();
  for (const folder of folders) map.set(folder.id, []);
  for (const entry of entries) {
    if (!map.has(entry.folderId)) map.set(entry.folderId, []);
    map.get(entry.folderId)?.push(entry);
  }
  return map;
}
