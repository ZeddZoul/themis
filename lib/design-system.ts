/**
 * Design System Constants
 * 
 * Centralized color palette, spacing, and breakpoints for Themis.
 * These constants ensure visual consistency across the application.
 */

export const colors = {
  primary: {
    accent: '#8D240C',      // Primary CTAs and success indicators
    accentHover: '#A12A0E', // 10% lighter for hover states
    accentActive: '#741F0A', // 10% darker for active states
  },
  background: {
    main: '#FFFFFF',        // Main page backgrounds
    subtle: '#F8F9FA',      // Subtle backgrounds for cards/sections
  },
  text: {
    primary: '#122438',     // Headings, body copy, navigation text
    secondary: '#4A6C7A',   // Dividers, subtle icons, secondary buttons (WCAG AA compliant: 4.52:1)
  },
  status: {
    success: '#0B7A54',     // Green for no issues (WCAG AA compliant: 4.82:1)
    warning: '#A36802',     // Yellow/orange for warnings (WCAG AA compliant: 4.58:1)
    error: '#C62828',       // Red for critical issues (WCAG AA compliant: 5.62:1)
    info: '#1565C0',        // Blue for informational (WCAG AA compliant: 5.75:1)
  },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

// Type exports for TypeScript support
export type ColorPalette = typeof colors;
export type SpacingScale = typeof spacing;
export type Breakpoints = typeof breakpoints;
