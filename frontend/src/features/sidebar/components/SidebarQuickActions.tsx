import { Button } from '../../../components/ui/button';

type SidebarQuickActionsProps = {
  onNewChat: () => void;
  onCreateFolder: () => void;
};

export default function SidebarQuickActions({
  onNewChat,
  onCreateFolder,
}: SidebarQuickActionsProps) {
  return (
    <div className="px-3 py-2 grid grid-cols-2 gap-2">
      <Button
        onClick={onNewChat}
        size="lg"
        className="w-full rounded-full text-xs"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Neuer Chat</span>
      </Button>
      <Button
        onClick={onCreateFolder}
        variant="outline"
        size="lg"
        className="w-full rounded-full text-xs hover:border-[#2563eb]/30 hover:bg-[#2563eb]/5 hover:text-[#2563eb]"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h3.964c.392 0 .77.153 1.052.427l1.006.977c.282.274.66.427 1.052.427h6.426A2.25 34.25 0 0 1 21 9.33v8.67a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V7.5Z"
          />
        </svg>
        <span>Ordner</span>
      </Button>
    </div>
  );
}
