'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting viewport size based on media queries
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1280px)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for better browser support)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook for detecting mobile viewport
 * Uses the design system mobile breakpoint (< 768px)
 * 
 * @returns boolean indicating if viewport is mobile size
 * 
 * @example
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Render mobile-specific UI
 * }
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook for detecting tablet viewport
 * Uses the design system tablet breakpoint (768px - 1023px)
 * 
 * @returns boolean indicating if viewport is tablet size
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook for detecting desktop viewport
 * Uses the design system desktop breakpoint (>= 1024px)
 * 
 * @returns boolean indicating if viewport is desktop size
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
