import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLayout } from '../../context/LayoutContext';
import { useSidebarController } from '../../features/sidebar/hooks/useSidebarController';
import SidebarLayout from '../../features/sidebar/components/SidebarLayout';
import type { AuthUser } from '../../lib/types';

export default function Sidebar() {
  const { user: authUser, logout } = useAuth();
  const { isSidebarOpen, closeSidebar } = useLayout();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const closeOnMobile = useCallback(() => {
    if (isMobile) closeSidebar();
  }, [isMobile, closeSidebar]);

  const controller = useSidebarController(closeOnMobile);

  const mappedUser: AuthUser | null = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.display_name || authUser.email,
        role: (authUser.role || 'user') as AuthUser['role'],
        tier: authUser.tier || (authUser.role === 'admin' ? 'admin' : 'member'),
        isActive: true,
      }
    : null;

  return (
    <SidebarLayout
      controller={controller}
      user={mappedUser}
      onLogout={() => void logout()}
      isSidebarOpen={isSidebarOpen}
      onCloseSidebar={closeSidebar}
    />
  );
}
