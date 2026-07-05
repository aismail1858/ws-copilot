import SidebarNavigation from "./SidebarNavigation";
import SidebarUserPanel from "./SidebarUserPanel";
import type { User } from "../../lib/types";

interface SidebarLayoutProps {
  user: User | null;
  onLogout: () => void;
}

export default function SidebarLayout({ user, onLogout }: SidebarLayoutProps) {
  return (
    <aside className="flex shrink-0 flex-col overflow-hidden border-r border-border bg-card w-72">
      <div className="h-16 flex items-center px-4">
        <span className="flex h-9 w-9 items-center justify-center">
          <img src="/logo.svg" alt="WS Copilot" className="h-8 w-8" />
        </span>
        <div className="ml-3 flex flex-col leading-tight">
          <span className="text-[#2f2b26] text-base tracking-tight font-medium">WS Copilot</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#756b62]">Knowledge Suite</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3" />
      <div className="border-t border-[#2f2b26]/10">
        <SidebarNavigation user={user} />
        <SidebarUserPanel user={user} onLogout={onLogout} />
      </div>
    </aside>
  );
}
