import React, { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { BarCount } from '../types';
import { LengthControl } from './LengthControl';

interface ContinuationPanelProps {
  onExtend: (bars: BarCount) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const ContinuationPanel: React.FC<ContinuationPanelProps> = ({
  onExtend,
  isLoading,
  disabled,
}) => {
  const [selectedBars, setSelectedBars] = useState<BarCount>(8);

  const handleExtend = () => {
    onExtend(selectedBars);
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Extend by:
      </span>
      <LengthControl
        value={selectedBars}
        onChange={setSelectedBars}
        label=""
        disabled={disabled || isLoading}
      />
      <button
        onClick={handleExtend}
        disabled={disabled || isLoading}
        className="px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2"
        style={{
          background: disabled || isLoading ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
          color: disabled || isLoading ? 'var(--text-muted)' : 'var(--text-secondary)',
          border: '1px solid var(--border)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.5 : 1,
        }}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        Extend
      </button>
    </div>
  );
};
