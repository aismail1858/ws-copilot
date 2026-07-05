import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutProvider } from '../../context/LayoutContext';
import { DialogProvider } from '../../context/DialogContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useChatHistorySync } from '../../chat/historySync';

function ChatSync() {
  useChatHistorySync();
  return null;
}

export default function DashboardLayout() {
  return (
    <SettingsProvider>
      <LayoutProvider>
        <DialogProvider>
          <ChatSync />
          <div className="h-full flex overflow-hidden font-light text-sm">
            <Sidebar />
            <div className="flex-1 flex overflow-hidden">
              <Outlet />
            </div>
          </div>
          <ChangePasswordModal />
        </DialogProvider>
      </LayoutProvider>
    </SettingsProvider>
  );
}
