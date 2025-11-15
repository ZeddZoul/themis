'use client';

import React, { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/design-system';

export interface TooltipProps {
  /** The content to display in the tooltip */
  content: string;
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing tooltip in milliseconds */
  delay?: number;
}

/**
 * Tooltip Component
 * 
 * Displays a tooltip on hover with configurable position and delay.
 * Used primarily for showing labels in sidebar mini mode.
 * 
 * @example
 * ```tsx
 * <Tooltip content="Dashboard" position="right">
 *   <button>Icon</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'right',
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        
        // Calculate position based on prop
        let top = 0;
        let left = 0;
        
        switch (position) {
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 8;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 8;
            break;
          case 'top':
            top = rect.top - 8;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2;
            break;
        }
        
        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  /**
   * Effect: Cleanup timeout on component unmount
   * Purpose: Prevent memory leaks by clearing pending timeouts
   * Dependencies: [] (empty - cleanup function only)
   * Note: Returns cleanup function to clear timeout when component unmounts
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone the child element and add event handlers
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
  });

  return (
    <>
      <div ref={triggerRef} style={{ display: 'inline-block' }}>
        {trigger}
      </div>
      
      {isVisible && (
        <div
          role="tooltip"
          className="fixed px-3 py-2 text-sm font-medium text-white rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            backgroundColor: colors.text.primary,
            top: position === 'top' ? coords.top : position === 'bottom' ? coords.top : coords.top,
            left: coords.left,
            transform: 
              position === 'right' ? 'translateY(-50%)' :
              position === 'left' ? 'translate(-100%, -50%)' :
              position === 'top' ? 'translate(-50%, -100%)' :
              'translate(-50%, 0)',
            zIndex: 999999,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 rotate-45"
            style={{
              backgroundColor: colors.text.primary,
              ...(position === 'right' && { left: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }),
              ...(position === 'left' && { right: '-4px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }),
              ...(position === 'top' && { bottom: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
              ...(position === 'bottom' && { top: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
            }}
          />
        </div>
      )}
    </>
  );
};
