/**
 * Icon System
 * 
 * Centralized icon mapping and wrapper component for consistent iconography
 * throughout the application using react-icons library.
 */

import React from 'react';
import { IconType } from 'react-icons';
import { 
  MdDashboard, 
  MdWarning, 
  MdError, 
  MdInfo,
  MdCheckCircle,
} from 'react-icons/md';
import { 
  FaCodeBranch, 
  FaCheckCircle as FaCheck,
  FaTimesCircle,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from 'react-icons/fa';
import { RiGitRepositoryFill } from 'react-icons/ri';
import { VscIssues } from 'react-icons/vsc';
import { AiOutlineIssuesClose } from 'react-icons/ai';
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarRightCollapse, TbLayoutSidebarRightCollapseFilled } from 'react-icons/tb';
import { GiCheckedShield } from 'react-icons/gi';
import { colors } from './design-system';

/**
 * Icon mapping for all use cases in the application
 */
export const iconMap = {
  // Navigation icons
  overview: MdDashboard,
  repositories: FaCodeBranch,
  issues: VscIssues,
  
  // Status icons
  success: FaCheck,
  error: MdError,
  warning: FaExclamationTriangle,
  info: MdInfo,
  
  // Additional status icons
  checkCircle: MdCheckCircle,
  timesCircle: FaTimesCircle,
  pendingIssues: AiOutlineIssuesClose,
  complianceRate: GiCheckedShield,
  
  // UI control icons
  chevronLeft: FaChevronLeft,
  chevronRight: FaChevronRight,
  logout: FaSignOutAlt,
  collapseLeft: TbLayoutSidebarLeftCollapse,
  collapseLeftFilled: TbLayoutSidebarLeftCollapseFilled,
  collapseRight: TbLayoutSidebarRightCollapse,
  collapseRightFilled: TbLayoutSidebarRightCollapseFilled,
} as const;

export type IconName = keyof typeof iconMap;

/**
 * Icon state types for dynamic coloring
 */
export type IconState = 'active' | 'inactive' | 'hover' | 'success' | 'error' | 'warning' | 'info' | 'white';

/**
 * Props for the DynamicIcon component
 */
export interface DynamicIconProps {
  /** The icon to render (can be IconName string or IconType component) */
  icon: IconName | IconType;
  /** Visual state of the icon affecting its color */
  state?: IconState;
  /** Size of the icon in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Whether the icon is decorative (hides from screen readers) */
  decorative?: boolean;
}

/**
 * Get color based on icon state
 */
function getIconColor(state: IconState): string {
  switch (state) {
    case 'active':
      return colors.primary.accent;
    case 'inactive':
      return colors.text.secondary;
    case 'hover':
      return colors.primary.accentHover;
    case 'success':
      return colors.status.success;
    case 'error':
      return colors.status.error;
    case 'warning':
      return colors.status.warning;
    case 'info':
      return colors.status.info;
    case 'white':
      return '#FFFFFF';
    default:
      return colors.text.primary;
  }
}

/**
 * DynamicIcon Component
 * 
 * A wrapper component for react-icons that provides:
 * - State-based coloring (active, inactive, hover, status colors)
 * - Smooth color transitions
 * - Proper ARIA labels for accessibility
 * - Consistent sizing
 * 
 * @example
 * ```tsx
 * <DynamicIcon icon="overview" state="active" size={24} ariaLabel="Dashboard" />
 * <DynamicIcon icon={MdDashboard} state="inactive" size={20} />
 * ```
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  icon,
  state = 'inactive',
  size = 20,
  className = '',
  ariaLabel,
  decorative = false,
}) => {
  // Resolve icon component
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : icon;
  
  if (!IconComponent) {
    return null;
  }

  const color = getIconColor(state);

  return (
    <IconComponent
      size={size}
      className={className}
      style={{
        color,
        transition: 'color 200ms ease-in-out',
      }}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? 'presentation' : undefined}
    />
  );
};

/**
 * Hook for managing icon hover states
 * 
 * @example
 * ```tsx
 * const { isHovered, hoverProps } = useIconHover();
 * <div {...hoverProps}>
 *   <DynamicIcon icon="overview" state={isHovered ? 'hover' : 'inactive'} />
 * </div>
 * ```
 */
export function useIconHover() {
  const [isHovered, setIsHovered] = React.useState(false);

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
}
