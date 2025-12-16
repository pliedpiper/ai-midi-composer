import React from 'react';
import { BarCount } from '../types';
import { GENERATION } from '../constants';

interface LengthControlProps {
  value: BarCount;
  onChange: (bars: BarCount) => void;
  label?: string;
  disabled?: boolean;
}

export const LengthControl: React.FC<LengthControlProps> = ({
  value,
  onChange,
  label = 'Length',
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-text-muted whitespace-nowrap">{label}:</span>
      )}
      <div className="flex rounded-lg overflow-hidden border border-border">
        {GENERATION.BAR_COUNT_OPTIONS.map((bars) => (
          <button
            key={bars}
            onClick={() => onChange(bars)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === bars
                ? 'bg-accent text-white'
                : 'bg-bg-primary text-text-secondary hover:bg-bg-tertiary'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {bars}
          </button>
        ))}
      </div>
      <span className="text-xs text-text-muted">bars</span>
    </div>
  );
};
