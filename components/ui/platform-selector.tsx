'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/design-system';
import { FaChevronDown, FaApple, FaAndroid, FaLayerGroup } from 'react-icons/fa';

export type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'BOTH';

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  disabled?: boolean;
}

const platformOptions: { value: Platform; label: string; icon: typeof FaApple }[] = [
  { value: 'APPLE_APP_STORE', label: 'Apple App Store', icon: FaApple },
  { value: 'GOOGLE_PLAY_STORE', label: 'Google Play Store', icon: FaAndroid },
  { value: 'BOTH', label: 'Both Platforms', icon: FaLayerGroup },
];

export function PlatformSelector({ value, onChange, disabled = false }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = platformOptions.find(opt => opt.value === value) || platformOptions[2];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (platform: Platform) => {
    onChange(platform);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 min-h-[44px]"
        style={{
          borderColor: isOpen ? colors.primary.accent : colors.text.secondary + '40',
          backgroundColor: disabled ? colors.background.subtle : colors.background.main,
          color: colors.text.primary,
          '--tw-ring-color': colors.primary.accent,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        } as React.CSSProperties}
        aria-label="Select platform"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <selectedOption.icon size={16} />
          {selectedOption.label}
        </span>
        <FaChevronDown
          size={12}
          style={{
            color: colors.text.secondary,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease-in-out',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bg-white border rounded-lg shadow-xl overflow-hidden"
          style={{
            borderColor: colors.text.secondary + '30',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          role="listbox"
        >
          {platformOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(option.value);
              }}
              className="w-full px-3 py-2 text-left text-sm transition-colors duration-200 min-h-[44px] flex items-center gap-2"
              style={{
                backgroundColor: value === option.value ? colors.primary.accent + '10' : 'transparent',
                color: value === option.value ? colors.primary.accent : colors.text.primary,
                fontWeight: value === option.value ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = colors.background.subtle;
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              role="option"
              aria-selected={value === option.value}
            >
              <option.icon size={16} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
