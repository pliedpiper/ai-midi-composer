import React, { useState } from 'react';
import { Play, Square, Download, Loader2, ChevronDown } from 'lucide-react';

interface DrumPlayerControlsProps {
  isPlaying: boolean;
  isExporting: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDownloadMidi: () => void;
  onDownloadWav: () => void;
}

const DrumPlayerControls: React.FC<DrumPlayerControlsProps> = ({
  isPlaying,
  isExporting,
  onPlay,
  onStop,
  onDownloadMidi,
  onDownloadWav,
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Play/Stop button */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
        style={{
          background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent)',
          color: isPlaying ? '#ef4444' : 'white',
        }}
        title={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? <Square size={14} /> : <Play size={14} />}
      </button>

      {/* Download dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
          disabled={isExporting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
          style={{
            background: 'var(--bg-tertiary)',
            color: isExporting ? 'var(--text-muted)' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
            cursor: isExporting ? 'not-allowed' : 'pointer',
          }}
        >
          {isExporting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          <span>Export</span>
          <ChevronDown size={12} />
        </button>

        {showDownloadMenu && !isExporting && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDownloadMenu(false)}
            />

            {/* Menu */}
            <div
              className="absolute right-0 top-full mt-1 py-1 rounded-lg z-20 min-w-[120px]"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <button
                onClick={() => {
                  onDownloadMidi();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-3 py-2 text-left font-mono text-xs transition-all hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Download MIDI
              </button>
              <button
                onClick={() => {
                  onDownloadWav();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-3 py-2 text-left font-mono text-xs transition-all hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Download WAV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DrumPlayerControls;
