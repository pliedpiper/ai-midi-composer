import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled: boolean;
  error: string | null;
}

const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  loading,
  disabled,
  error,
}) => {
  const isDisabled = loading || !prompt.trim() || disabled;

  return (
    <div className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your music..."
          className="flex-1 px-4 py-3 text-sm rounded"
          style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)',
            color: 'var(--text-primary)'
          }}
          onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onGenerate()}
        />
        <button
          onClick={onGenerate}
          disabled={isDisabled}
          className="px-6 py-3 text-sm font-medium rounded transition-opacity"
          style={{ 
            background: isDisabled ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: isDisabled ? 'var(--text-muted)' : 'white',
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Generate'
          )}
        </button>
      </div>
      
      {error && (
        <div 
          className="mt-3 px-3 py-2 rounded text-sm flex items-center gap-2"
          style={{ 
            background: 'rgba(220, 38, 38, 0.1)', 
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#f87171'
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PromptInput;

