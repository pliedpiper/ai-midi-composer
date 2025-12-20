import React, { useState } from 'react';
import { ChevronDown, Headphones, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';
import { FILTER_DEFINITIONS, getFilterDefinition } from '../services/audioFilters';
import { FilterCard } from './FilterCard';

interface FilterPanelProps {
  filterStates: FilterState[];
  onToggleFilter: (filterId: string) => void;
  onUpdateParam: (filterId: string, paramKey: string, value: number) => void;
  onResetFilters: () => void;
  disabled: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterStates,
  onToggleFilter,
  onUpdateParam,
  onResetFilters,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const enabledCount = filterStates.filter(f => f.enabled).length;

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex justify-between items-center transition-colors"
        style={{
          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
          color: 'var(--text-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          <Headphones className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Audio Effects</span>
          {enabledCount > 0 && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              {enabledCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-3 animate-slide-down">
          {/* Reset button */}
          <div className="flex justify-end">
            <button
              onClick={onResetFilters}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors"
              style={{
                color: 'var(--text-muted)',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-2 gap-2">
            {FILTER_DEFINITIONS.map((definition) => {
              const state = filterStates.find(f => f.id === definition.id);
              if (!state) return null;

              return (
                <FilterCard
                  key={definition.id}
                  definition={definition}
                  state={state}
                  onToggle={() => onToggleFilter(definition.id)}
                  onUpdateParam={(paramKey, value) => onUpdateParam(definition.id, paramKey, value)}
                  disabled={disabled}
                />
              );
            })}
          </div>

          {/* Help text */}
          <p
            className="text-[10px] text-center pt-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Toggle effects and adjust parameters. Changes apply to playback and WAV export.
          </p>
        </div>
      )}
    </div>
  );
};
