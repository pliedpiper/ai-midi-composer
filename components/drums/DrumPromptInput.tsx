import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Settings2, Sparkles } from 'lucide-react';
import { BarCount } from '../../types';
import { LengthControl } from '../LengthControl';

interface DrumPromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: (barCount?: BarCount) => void;
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
  const [showSettings, setShowSettings] = useState(false);
  const [barCount, setBarCount] = useState<BarCount>(4);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && !disabled && prompt.trim()) {
      onGenerate(barCount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="relative rounded-xl transition-all"
        style={{
          background: 'var(--bg-secondary)',
          border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--border)'}`,
          boxShadow: error ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : 'var(--shadow-sm)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the drums you want to create"
          rows={1}
          disabled={loading || disabled}
          className="w-full resize-none font-mono text-sm p-4 pb-12 focus:outline-none"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            minHeight: '60px',
          }}
        />

        {/* Settings Panel */}
        {showSettings && (
          <div
            className="absolute left-4 bottom-12 p-3 rounded-lg z-10"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Bars:</span>
              <LengthControl value={barCount} onChange={setBarCount} />
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 rounded-b-xl"
          style={{
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all"
              style={{
                color: showSettings ? 'var(--accent)' : 'var(--text-muted)',
                background: showSettings ? 'rgba(61, 139, 255, 0.1)' : 'transparent',
              }}
            >
              <Settings2 size={14} />
              <span>{barCount} bars</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || disabled || !prompt.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-medium transition-all"
            style={{
              background: loading || disabled || !prompt.trim()
                ? 'var(--bg-secondary)'
                : 'var(--accent)',
              color: loading || disabled || !prompt.trim()
                ? 'var(--text-muted)'
                : 'white',
              cursor: loading || disabled || !prompt.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Drums</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          className="mt-2 p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
};

export default DrumPromptInput;
