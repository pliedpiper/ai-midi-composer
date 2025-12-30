import React, { useRef, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface DrumPromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled?: boolean;
  error?: string | null;
}

const DrumPromptInput: React.FC<DrumPromptInputProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  loading,
  disabled = false,
  error,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const isDisabled = loading || disabled || !prompt.trim();

  const handleGenerate = () => {
    if (!isDisabled) {
      onGenerate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="mb-10">
      <div
        className="rounded-xl transition-all"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex items-start gap-3 p-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the drums you want to create..."
              rows={1}
              disabled={loading || disabled}
              className="w-full px-4 py-3 text-sm rounded-lg input resize-none overflow-hidden"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid transparent',
                color: 'var(--text-primary)',
                minHeight: '46px'
              }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isDisabled}
            className="btn btn-primary px-6 py-3 text-sm rounded-lg flex items-center gap-2"
            style={{
              background: isDisabled
                ? 'var(--bg-tertiary)'
                : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
              color: isDisabled ? 'var(--text-muted)' : 'white',
              boxShadow: isDisabled ? 'none' : 'var(--shadow-sm), 0 0 20px rgba(61, 139, 255, 0.15)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-slide-up"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171'
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239, 68, 68, 0.15)' }}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DrumPromptInput;
