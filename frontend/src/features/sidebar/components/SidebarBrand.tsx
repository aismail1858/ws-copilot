type SidebarBrandProps = {
  onCloseSidebar: () => void;
};

export default function SidebarBrand({ onCloseSidebar }: SidebarBrandProps) {
  return (
    <div className="h-16 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center">
          <img src="/logo.svg" alt="WS Copilot" className="h-8 w-8" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[#2f2b26] text-base tracking-tight font-medium">WS Copilot</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#756b62]">Knowledge Suite</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCloseSidebar}
        className="p-2 text-[#756b62] hover:text-[#2f2b26] transition-colors"
        aria-label="Sidebar schließen"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15m-15 5.25h15m-15 5.25h15" />
        </svg>
      </button>
    </div>
  );
}
