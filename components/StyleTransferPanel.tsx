import React, { useState } from 'react';
import { Loader2, ChevronDown, Wand2 } from 'lucide-react';
import { GENERATION } from '../constants';

interface StyleTransferPanelProps {
  onApplyStyle: (prompt: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const StyleTransferPanel: React.FC<StyleTransferPanelProps> = ({
  onApplyStyle,
  isLoading,
  disabled,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyCustom = () => {
    if (customPrompt.trim()) {
      onApplyStyle(customPrompt.trim());
      setCustomPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && !isLoading && customPrompt.trim()) {
      handleApplyCustom();
    }
  };

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
          <Wand2 className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Style Transfer</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-3 animate-slide-down">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {GENERATION.STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyStyle(preset.prompt)}
                disabled={disabled || isLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  opacity: disabled || isLoading ? 0.5 : 1,
                  cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Custom style: e.g., 'more energetic', 'add swing'"
              disabled={disabled || isLoading}
              className="flex-1 text-xs px-3 py-2 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                opacity: disabled || isLoading ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleApplyCustom}
              disabled={disabled || isLoading || !customPrompt.trim()}
              className="px-4 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2"
              style={{
                background: disabled || isLoading || !customPrompt.trim()
                  ? 'var(--bg-tertiary)'
                  : 'var(--accent)',
                color: disabled || isLoading || !customPrompt.trim()
                  ? 'var(--text-muted)'
                  : 'white',
                cursor: disabled || isLoading || !customPrompt.trim()
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
