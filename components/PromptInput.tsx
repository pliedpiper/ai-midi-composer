import React, { useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) onGenerate();
    }
  };

  return (
    <div className="mb-10">
      <div
        className="flex items-start gap-3 p-2 rounded-xl transition-all"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe the music you want to create..."
            className="w-full px-4 py-3 text-sm rounded-lg input resize-none overflow-hidden"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid transparent',
              color: 'var(--text-primary)',
              minHeight: '46px'
            }}
            rows={1}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={onGenerate}
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

export default PromptInput;

