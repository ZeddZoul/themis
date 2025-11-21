'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DynamicIcon, IconName } from '@/lib/icons';
import { FaTimes } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';

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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Handle swipe to close
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;

    let startX = 0;
    let currentX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      
      if (diff > 50) {
        onClose();
      }
    };

    const sidebar = sidebarRef.current;
    sidebar.addEventListener('touchstart', handleTouchStart);
    sidebar.addEventListener('touchmove', handleTouchMove);

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className="fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col shadow-xl transform transition-transform duration-300"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Logo and Close Button */}
        <div 
          className="border-b flex items-center justify-between"
          style={{ 
            borderColor: colors.text.secondary + '20',
            padding: '1.5rem 1rem',
          }}
        >
          <Image 
            alt='Themis logo' 
            src="/logo.png" 
            width={120} 
            height={69}
            priority
            sizes="120px"
          />
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
            style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
            aria-label="Close menu"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.subtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <DynamicIcon
              icon={FaTimes}
              state="inactive"
              size={24}
              ariaLabel="Close menu"
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav 
          className="flex-1" 
          aria-label="Main navigation"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1rem',
          }}
        >
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                ref={index === 0 ? firstFocusableRef : null}
                href={item.href}
                onClick={onClose}
                className="flex items-center rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98]"
                style={{
                  backgroundColor: active ? colors.primary.accent + '10' : 'transparent',
                  color: active ? colors.primary.accent : colors.text.primary,
                  fontWeight: active ? 600 : 400,
                  '--tw-ring-color': colors.primary.accent,
                  padding: '0.75rem',
                  minHeight: '44px',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  margin: '0 0.5rem',
                } as React.CSSProperties}
                aria-current={active ? 'page' : undefined}
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
                  decorative
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div 
          className="border-t"
          style={{ 
            borderColor: colors.text.secondary + '20',
            padding: '1rem',
          }}
        >
          <Button
            variant="primary"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2"
          >
            <DynamicIcon
              icon={MdLogout}
              state="white"
              size={20}
              decorative
            />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
