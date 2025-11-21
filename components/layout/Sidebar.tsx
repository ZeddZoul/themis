'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DynamicIcon, IconName } from '@/lib/icons';
import { Tooltip } from '@/components/ui/tooltip';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: 'overview' },
  { label: 'Repositories', href: '/dashboard/repos', icon: 'repositories' },
  { label: 'Issues', href: '/dashboard/issues', icon: 'issues' },
];

const SIDEBAR_STORAGE_KEY = 'themis-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  /**
   * Effect: Load sidebar collapsed state from localStorage on mount
   * Purpose: Restore user's sidebar preference from previous session
   * Dependencies: [] (empty - only runs once on mount)
   * Note: Also sets isMounted flag to prevent hydration mismatch
   */
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
    setIsMounted(true);
  }, []);

  // Persist sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <aside
        className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col"
        style={{ borderColor: colors.text.secondary + '20' }}
      />
    );
  }

  const sidebarWidth = isCollapsed ? '64px' : '240px';

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col"
      style={{ 
        borderColor: colors.text.secondary + '20',
        width: sidebarWidth,
        transition: 'width 200ms ease-in-out',
        zIndex: 1100,
      }}
    >
      {/* Logo/Brand */}
      <div 
        className="border-b flex items-center justify-center"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        {!isCollapsed ? (
          <Image 
            alt='Themis logo' 
            src="/logo.png" 
            width={isMobile ? 120 : 150} 
            height={isMobile ? 69 : 86}
            priority
            sizes={isMobile ? '120px' : '150px'}
            style={{ 
              transition: 'width 200ms ease-in-out, height 200ms ease-in-out',
            }}
          />
        ) : (
          <Image 
            alt='Themis icon' 
            src="/icon.png" 
            width={32} 
            height={32}
            priority
            sizes="32px"
            style={{ 
              objectFit: 'contain',
            }}
          />
        )}
      </div>

      {/* Navigation Links */}
      <nav 
        className="flex-1" 
        aria-label="Main navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: isCollapsed ? '1rem 0' : '1rem',
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          const navLink = (
            <Link
              href={item.href}
              className="flex items-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: active ? colors.primary.accent + '10' : 'transparent',
                color: active ? colors.primary.accent : colors.text.primary,
                fontWeight: active ? 600 : 400,
                '--tw-ring-color': colors.primary.accent,
                padding: '0.75rem',
                minHeight: '44px',
                minWidth: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '0.75rem',
                textDecoration: 'none',
                margin: isCollapsed ? '0' : '0 0.5rem',
              } as React.CSSProperties}
              aria-current={active ? 'page' : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = colors.background.subtle;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <DynamicIcon
                icon={item.icon}
                state={active ? 'active' : 'inactive'}
                size={20}
                ariaLabel={`${item.label} icon`}
                decorative={!isCollapsed}
              />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.href} content={item.label} position="right" delay={1000}>
              {navLink}
            </Tooltip>
          ) : (
            <div key={item.href}>{navLink}</div>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div 
        className="border-t"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        <Tooltip content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right" delay={1000}>
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group"
            style={{
              color: colors.text.secondary,
              '--tw-ring-color': colors.primary.accent,
              padding: isCollapsed ? '0.75rem' : '0.75rem 1rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              minHeight: '44px',
              minWidth: '44px',
              width: '100%',
            } as React.CSSProperties}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.subtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span className="group-hover:hidden">
              <DynamicIcon
                icon={isCollapsed ? 'collapseRight' : 'collapseLeft'}
                state="inactive"
                size={20}
                decorative
              />
            </span>
            <span className="hidden group-hover:inline">
              <DynamicIcon
                icon={isCollapsed ? 'collapseRightFilled' : 'collapseLeftFilled'}
                state="inactive"
                size={20}
                decorative
              />
            </span>
            {!isCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </Tooltip>
      </div>

      {/* Logout Button */}
      <div 
        className="border-t"
        style={{ 
          borderColor: colors.text.secondary + '20',
          padding: isCollapsed ? '1rem 0.5rem' : '1rem',
          transition: 'padding 200ms ease-in-out',
        }}
      >
        {isCollapsed ? (
          <Tooltip content="Logout" position="right" delay={1000}>
            <Button
              variant="primary"
              onClick={handleLogout}
              className="w-full min-h-[44px] min-w-[44px] px-3 flex items-center justify-center"
              aria-label="Logout"
            >
              <DynamicIcon
                icon="logout"
                state="white"
                size={20}
                decorative
              />
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2"
          >
            <DynamicIcon
              icon="logout"
              state="white"
              size={20}
              decorative
            />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
