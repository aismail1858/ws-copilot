import { Input } from '../../../components/ui/input';

type SidebarSearchProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

export default function SidebarSearch({
  searchQuery,
  onSearchQueryChange,
}: SidebarSearchProps) {
  return (
    <div className="px-3 pb-2">
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#756b62] pointer-events-none z-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <Input
          type="text"
          placeholder="Chats durchsuchen..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full rounded-full pl-9 pr-3"
        />
      </div>
    </div>
  );
}
