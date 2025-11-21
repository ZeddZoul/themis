import React from 'react';
import { colors } from '@/lib/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-4 py-2 min-h-[44px] rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'text-white',
    secondary: '',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: '',
  };

  const getStyles = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: colors.primary.accent,
        '--hover-bg': colors.primary.accentHover,
        '--active-bg': colors.primary.accentActive,
        '--tw-ring-color': colors.primary.accent,
      } as React.CSSProperties;
    } else if (variant === 'secondary') {
      return {
        backgroundColor: colors.background.subtle,
        color: colors.text.secondary,
        '--hover-bg': '#E5E7EB',
        '--tw-ring-color': colors.text.secondary,
      } as React.CSSProperties;
    } else if (variant === 'danger') {
      return {
        '--tw-ring-color': '#EF4444',
      } as React.CSSProperties;
    } else if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        border: `1px solid ${colors.primary.accent}`,
        color: colors.primary.accent,
        '--hover-bg': colors.primary.accent + '10',
        '--tw-ring-color': colors.primary.accent,
      } as React.CSSProperties;
    }
    return {};
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className} hover:[background-color:var(--hover-bg)] active:[background-color:var(--active-bg)]`}
      style={getStyles()}
      {...props}
    >
      {children}
    </button>
  );
}
