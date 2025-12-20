import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterDefinition, FilterState } from '../types';

interface FilterCardProps {
  definition: FilterDefinition;
  state: FilterState;
  onToggle: () => void;
  onUpdateParam: (paramKey: string, value: number) => void;
  disabled: boolean;
}

export const FilterCard: React.FC<FilterCardProps> = ({
  definition,
  state,
  onToggle,
  onUpdateParam,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.enabled) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className="rounded-lg transition-all"
      style={{
        background: state.enabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        border: `1px solid ${state.enabled ? 'var(--accent)' : 'var(--border)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Header with toggle */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          {/* Toggle switch */}
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{
              background: state.enabled ? 'var(--accent)' : 'var(--bg-secondary)',
            }}
          >
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
              style={{
                background: 'white',
                left: state.enabled ? '18px' : '2px',
              }}
            />
          </div>
          <div>
            <span
              className="text-xs font-medium"
              style={{ color: state.enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {definition.name}
            </span>
          </div>
        </div>

        {/* Expand button (only when enabled and has parameters) */}
        {state.enabled && definition.parameters.length > 0 && (
          <button
            onClick={handleExpandClick}
            className="p-1 rounded transition-colors hover:bg-black/10"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
        )}
      </div>

      {/* Parameter sliders (when expanded) */}
      {state.enabled && isExpanded && definition.parameters.length > 0 && (
        <div className="px-3 pb-3 space-y-2 animate-slide-down">
          {definition.parameters.map((param) => (
            <div key={param.key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {param.name}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {state.params[param.key]?.toFixed(param.step < 1 ? 2 : 0)}
                  {param.unit && <span className="ml-0.5 opacity-60">{param.unit}</span>}
                </span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={state.params[param.key] ?? param.default}
                onChange={(e) => onUpdateParam(param.key, parseFloat(e.target.value))}
                disabled={disabled}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${
                    ((state.params[param.key] - param.min) / (param.max - param.min)) * 100
                  }%, var(--bg-secondary) ${
                    ((state.params[param.key] - param.min) / (param.max - param.min)) * 100
                  }%, var(--bg-secondary) 100%)`,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
