'use client';

import { useState, useRef, useEffect } from 'react';
import { colors } from '@/lib/design-system';
import { FaFileDownload, FaChevronDown, FaFilePdf, FaMarkdown, FaCog, FaFileAlt } from 'react-icons/fa';
import { IconType } from 'react-icons';

export type ExportFormat = 'pdf' | 'md' | 'yaml' | 'txt';

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  isExporting?: boolean;
}

const formats: { value: ExportFormat; label: string; icon: IconType }[] = [
  { value: 'pdf', label: 'PDF', icon: FaFilePdf },
  { value: 'md', label: 'Markdown', icon: FaMarkdown },
  { value: 'yaml', label: 'YAML', icon: FaCog },
  { value: 'txt', label: 'Text', icon: FaFileAlt },
];

export function ExportDropdown({ onExport, disabled = false, isExporting = false }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: ExportFormat) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className="h-9 px-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm"
        style={{
          backgroundColor: colors.primary.accent,
          color: 'white',
          opacity: disabled || isExporting ? 0.6 : 1,
          cursor: disabled || isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        <FaFileDownload size={14} />
        <span>{isExporting ? 'Exporting...' : 'Export as'}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border overflow-hidden z-50 min-w-[140px]"
          style={{ borderColor: colors.text.secondary + '30' }}
        >
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.value}
                onClick={() => handleExport(format.value)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <Icon 
                  size={14}
                  style={{ 
                    color: colors.text.secondary 
                  }}
                />
                <span 
                  className="font-medium"
                  style={{ 
                    color: colors.text.primary 
                  }}
                >
                  {format.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
