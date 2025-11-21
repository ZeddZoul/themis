import React from 'react';
import { colors } from '@/lib/design-system';
import { DynamicIcon, IconName } from '@/lib/icons';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'processing';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const Badge = React.memo<BadgeProps>(function Badge({ variant, size = 'md', children, className = '', showIcon = false }) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const variantStyles = {
    success: {
      backgroundColor: colors.status.success + '15',
      color: colors.status.success,
      border: `1px solid ${colors.status.success}40`,
    },
    warning: {
      backgroundColor: colors.status.warning + '15',
      color: colors.status.warning,
      border: `1px solid ${colors.status.warning}40`,
    },
    error: {
      backgroundColor: colors.status.error + '15',
      color: colors.status.error,
      border: `1px solid ${colors.status.error}40`,
    },
    info: {
      backgroundColor: colors.status.info + '15',
      color: colors.status.info,
      border: `1px solid ${colors.status.info}40`,
    },
    processing: {
      backgroundColor: colors.primary.accent + '15',
      color: colors.primary.accent,
      border: `1px solid ${colors.primary.accent}40`,
    },
  };

  const iconMap: Record<BadgeVariant, IconName> = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
    processing: 'loading',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md transition-all duration-200 ${sizeStyles[size]} ${className}`}
      style={variantStyles[variant]}
    >
      {showIcon && (
        <DynamicIcon
          icon={iconMap[variant]}
          state={variant}
          size={iconSizes[size]}
          decorative
        />
      )}
      {children}
    </span>
  );
});
