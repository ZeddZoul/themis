'use client';

import { useState, useEffect, useCallback } from 'react';
import { colors } from '@/lib/design-system';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Search repositories...', 
  debounceMs = 300 
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce the onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 pr-12 border rounded-lg focus-visible:outline-none focus-visible:ring-2 transition-all min-h-[44px]"
          style={{
            borderColor: colors.text.secondary,
            color: colors.text.primary,
            '--tw-ring-color': colors.primary.accent,
          } as React.CSSProperties}
          aria-label="Search repositories"
        />
        
        {/* Search Icon */}
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
          style={{ color: colors.text.secondary }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Clear Button - Minimum 44x44px touch target */}
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 animate-fadeIn group"
            style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
            aria-label="Clear search"
            type="button"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.accent + '10';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              className="w-5 h-5 transition-colors duration-200"
              style={{ color: colors.text.secondary }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
