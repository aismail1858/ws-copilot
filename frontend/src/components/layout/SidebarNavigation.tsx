import { NavLink } from "react-router-dom";
import type { ReactElement } from "react";
import type { User } from "../../lib/types";

type SidebarNavItem = {
  to: string;
  label: string;
  adminOnly?: boolean;
  icon: ReactElement;
};

const NAV_ITEMS: SidebarNavItem[] = [
  {
    to: "/",
    label: "Chat",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m-7.875 7.5h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    to: "/projects",
    label: "Projekte",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
  },
  {
    to: "/token-usage",
    label: "Tokenverbrauch",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h16.5v16.5H3.75V3.75Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75v-3m4.5 3V9m4.5 6.75v-9" />
      </svg>
    ),
  },
  {
    to: "/ingestion",
    label: "Ingestion",
    adminOnly: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
      </svg>
    ),
  },
  {
    to: "/sources",
    label: "Quellen",
    adminOnly: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Zm4.125 3h6.75m-6.75 3h6.75m-6.75 3h4.5" />
      </svg>
    ),
  },
  {
    to: "/users",
    label: "Benutzer",
    adminOnly: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM3 18.75a6 6 0 0 1 12 0v.75H3v-.75Z" />
      </svg>
    ),
  },
];

interface SidebarNavigationProps {
  user: User | null;
}

export default function SidebarNavigation({ user }: SidebarNavigationProps) {
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin");

  return (
    <div className="px-3 pb-1 flex flex-col gap-1">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            "flex transition-colors w-full rounded-lg px-3 py-2 gap-x-3 items-center " +
            (isActive ? "bg-[#fff1e8] text-[#2f2b26]" : "text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]")
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
