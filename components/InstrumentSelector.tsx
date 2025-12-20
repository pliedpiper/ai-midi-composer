import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Piano } from 'lucide-react';
import { InstrumentDefinition } from '../types';
import { INSTRUMENT_DEFINITIONS } from '../services/instruments';

interface InstrumentSelectorProps {
  instrumentId: string;
  onSelectInstrument: (id: string) => void;
  disabled?: boolean;
}

// Group instruments by category
const groupedInstruments = {
  keys: INSTRUMENT_DEFINITIONS.filter(i => i.category === 'keys'),
  synth: INSTRUMENT_DEFINITIONS.filter(i => i.category === 'synth'),
  other: INSTRUMENT_DEFINITIONS.filter(i => i.category === 'other'),
};

const categoryLabels: Record<string, string> = {
  keys: 'Keys',
  synth: 'Synths',
  other: 'Other',
};

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  instrumentId,
  onSelectInstrument,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentInstrument = INSTRUMENT_DEFINITIONS.find(i => i.id === instrumentId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelectInstrument(id);
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
      >
        <Piano className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        <span>{currentInstrument?.name || 'Piano'}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute left-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[180px]"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          {Object.entries(groupedInstruments).map(([category, instruments]) => (
            <div key={category}>
              {/* Category header */}
              <div
                className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {categoryLabels[category]}
              </div>

              {/* Instruments in category */}
              {instruments.map((instrument) => (
                <button
                  key={instrument.id}
                  onClick={() => handleSelect(instrument.id)}
                  className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between"
                  style={{
                    color: instrument.id === instrumentId ? 'var(--accent)' : 'var(--text-secondary)',
                    background: instrument.id === instrumentId ? 'var(--accent-glow)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (instrument.id !== instrumentId) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (instrument.id !== instrumentId) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="font-medium">{instrument.name}</span>
                  {instrument.id === instrumentId && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
