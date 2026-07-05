import { useLayout } from "../../context/LayoutContext";

type SidebarHeaderToggleButtonProps = {
  onClick?: () => void;
};

export default function SidebarHeaderToggleButton({ onClick }: SidebarHeaderToggleButtonProps) {
  const { isSidebarOpen, toggleSidebar } = useLayout();
  const desktopVisibility = isSidebarOpen ? "md:hidden" : "md:inline-flex";

  return (
    <button
      type="button"
      onClick={onClick ?? toggleSidebar}
      className={
        "mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#756b62] transition-colors " +
        "hover:bg-[#f8f3ef] hover:text-[#2f2b26] " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3aa7f]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
        desktopVisibility
      }
      aria-label="Sidebar öffnen"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15m-15 5.25h15m-15 5.25h15" />
      </svg>
    </button>
  );
}
