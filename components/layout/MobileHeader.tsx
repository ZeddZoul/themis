'use client';

import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { colors } from '@/lib/design-system';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

/**
 * MobileHeader Component
 * 
 * Displays the current page name in the header on mobile viewports.
 * Only renders on mobile devices (< 768px).
 * 
 * Maps pathname to user-friendly page names:
 * - /dashboard → "Overview"
 * - /dashboard/repos → "Repositories"
 * - /dashboard/issues → "Issues"
 */
export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Map pathname to display name
  const getPageName = (path: string | null): string => {
    if (!path) return 'Themis Checker';

    // Exact match for dashboard overview
    if (path === '/dashboard') {
      return 'Overview';
    }

    // Match dashboard sub-pages
    if (path.startsWith('/dashboard/repos')) {
      return 'Repositories';
    }

    if (path.startsWith('/dashboard/issues')) {
      return 'Issues';
    }

    // Match check results pages
    if (path.startsWith('/check/')) {
      return 'Check Results';
    }

    // Default fallback
    return 'Themis';
  };

  const pageName = getPageName(pathname);

  // Don't render - let CSS handle visibility with lg:hidden
  // This ensures it shows whenever sidebar is hidden (below 1024px)

  return (
    <header 
      className="lg:hidden bg-white border-b sticky top-0 z-30"
      style={{ 
        borderColor: colors.text.secondary + '20',
        backgroundColor: colors.background.main,
      }}
    >
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onMenuClick}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2"
          style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
          aria-label="Open menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: colors.text.primary }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1
          className="text-lg font-bold tracking-tight"
          style={{ color: colors.text.primary }}
        >
          {pageName}
        </h1>
        <div className="w-[44px]" /> {/* Spacer for centering - matches button width */}
      </div>
    </header>
  );
}
