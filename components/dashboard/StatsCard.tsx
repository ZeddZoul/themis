/**
 * StatsCard Component
 * 
 * A dashboard statistics card that displays a key metric with:
 * - Icon indicator
 * - Value and label
 * - Optional trend indicator
 * - Loading state with skeleton
 * - Hover effects and click handling
 * - Responsive design for mobile
 */

import React from 'react';
import { IconType } from 'react-icons';
import { colors } from '@/lib/design-system';
import { DynamicIcon } from '@/lib/icons';
import { SkeletonLoader } from '@/components/ui/loading-spinner';

export interface StatsCardProps {
  /** Title/label for the statistic */
  title: string;
  /** The value to display (number or formatted string) */
  value: number | string;
  /** Icon to display */
  icon: IconType;
  /** Optional trend data */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  /** Click handler for navigation */
  onClick?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatsCard Component
 * 
 * Displays a single statistic with icon, value, label, and optional trend.
 * Memoized for performance optimization.
 */
export const StatsCard = React.memo<StatsCardProps>(({
  title,
  value,
  icon,
  trend,
  onClick,
  loading = false,
  className = '',
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Show skeleton loader during loading state
  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border p-4 sm:p-6 ${className}`}
        style={{
          borderColor: colors.text.secondary + '30',
          backgroundColor: colors.background.main,
        }}
      >
        <div className="space-y-3">
          <SkeletonLoader variant="avatar" className="w-12 h-12" />
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          </div>
        </div>
      </div>
    );
  }

  const cardContent = (
    <>
      {/* Icon */}
      <div className="mb-3 sm:mb-4">
        <DynamicIcon
          icon={icon}
          state={isHovered ? 'hover' : 'active'}
          size={48}
          ariaLabel={title}
          decorative
        />
      </div>

      {/* Value */}
      <div className="mb-1 sm:mb-2">
        <div
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {value}
        </div>
      </div>

      {/* Label */}
      <div
        className="text-sm sm:text-base font-medium"
        style={{ color: colors.text.secondary }}
      >
        {title}
      </div>
    </>
  );

  // If clickable, render as button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-white rounded-lg border p-4 sm:p-6 transition-all duration-200 text-left w-full ${className}`}
        style={{
          borderColor: isHovered ? colors.primary.accent : colors.text.secondary + '30',
          backgroundColor: colors.background.main,
          boxShadow: isHovered ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        aria-label={`View ${title}`}
      >
        {cardContent}
      </button>
    );
  }

  // Otherwise, render as div
  return (
    <div
      className={`bg-white rounded-lg border p-4 sm:p-6 ${className}`}
      style={{
        borderColor: colors.text.secondary + '30',
        backgroundColor: colors.background.main,
      }}
    >
      {cardContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.value === nextProps.value &&
    prevProps.loading === nextProps.loading &&
    prevProps.title === nextProps.title &&
    prevProps.trend?.value === nextProps.trend?.value &&
    prevProps.trend?.direction === nextProps.trend?.direction
  );
});

StatsCard.displayName = 'StatsCard';
