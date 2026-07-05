import { useEffect, useState } from 'react';
import { CHAT_HISTORY_CHANGED_EVENT, getActiveThreadTitle } from '@/chat/history';
import SidebarHeaderToggleButton from '@/components/SidebarHeaderToggleButton';

// Chat header component with title

export function ChatHeader() {
  const [title, setTitle] = useState(() => getActiveThreadTitle());

  useEffect(() => {
    const updateTitle = () => setTitle(getActiveThreadTitle());
    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, updateTitle);
    return () => window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, updateTitle);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between border-b border-[#2f2b26]/10 bg-white/82 px-4 backdrop-blur-md z-10 sticky top-0 shadow-[0_1px_8px_rgba(47,43,38,0.06),0_4px_16px_rgba(47,43,38,0.04)]">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarHeaderToggleButton />
        <h1 className="text-[#2f2b26] text-sm font-medium truncate max-w-[200px] md:max-w-md">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3"></div>
    </header>
  );
}
