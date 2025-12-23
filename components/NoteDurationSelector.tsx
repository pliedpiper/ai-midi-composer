import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Music } from 'lucide-react';

interface NoteDurationSelectorProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

const DURATION_OPTIONS = [
  { value: 0.25, label: '1/16', description: 'Sixteenth' },
  { value: 0.5, label: '1/8', description: 'Eighth' },
  { value: 1, label: '1/4', description: 'Quarter' },
  { value: 2, label: '1/2', description: 'Half' },
  { value: 4, label: '1', description: 'Whole' },
];

export const NoteDurationSelector: React.FC<NoteDurationSelectorProps> = ({
  duration,
  onDurationChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = DURATION_OPTIONS.find(opt => opt.value === duration) || DURATION_OPTIONS[2];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: number) => {
    onDurationChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        title="Note duration for new notes"
      >
        <Music className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        <span>{currentOption.label} note</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute left-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[140px]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between"
              style={{
                color: option.value === duration ? 'var(--accent)' : 'var(--text-secondary)',
                background: option.value === duration ? 'var(--accent-glow)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (option.value !== duration) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== duration) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span className="font-medium">{option.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>{option.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
