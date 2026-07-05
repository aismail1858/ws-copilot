import { NavLink } from 'react-router-dom';
import { SIDEBAR_NAV_ITEMS } from './sidebarNavItems';
import type { AuthUser } from '../../../lib/types';

type SidebarNavigationProps = {
  user: AuthUser | null;
  onCloseSidebar: () => void;
};

const TIER_RANK: Record<string, number> = { admin: 0, team_lead: 1, member: 2 };

export default function SidebarNavigation({ user, onCloseSidebar }: SidebarNavigationProps) {
  const tier = user?.tier || (user?.role === 'admin' ? 'admin' : 'member');
  const rank = TIER_RANK[tier] ?? TIER_RANK.member;
  const visibleItems = SIDEBAR_NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return tier === 'admin';
    if (item.minTier) return rank <= (TIER_RANK[item.minTier] ?? TIER_RANK.member);
    return true;
  });

  return (
    <div className="px-3 pb-1 flex flex-col gap-1">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => {
            if (window.innerWidth < 768) onCloseSidebar();
          }}
          className={({ isActive }) =>
            `flex transition-colors w-full rounded-lg px-3 py-2 gap-x-3 items-center ${
              isActive
                ? 'bg-[#fff1e8] text-[#2f2b26]'
                : 'text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
