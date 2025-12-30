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
        className="btn btn-icon w-10 h-10 rounded-lg transition-all"
        style={{
          background: isPlaying
            ? 'var(--bg-primary)'
            : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
          color: 'white',
          border: isPlaying ? '1px solid var(--border)' : 'none',
          boxShadow: isPlaying ? 'none' : 'var(--shadow-sm), 0 0 15px rgba(61, 139, 255, 0.2)'
        }}
        title={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <Square className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Download dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDownloadMenu(!showDownloadMenu)}
          disabled={isExporting}
          className="btn btn-icon w-10 h-10 rounded-lg transition-all group flex items-center justify-center"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            opacity: isExporting ? 0.7 : 1,
          }}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Download className="w-4 h-4 transition-colors group-hover:text-white" />
              <ChevronDown className="w-3 h-3 ml-0.5 transition-colors group-hover:text-white" />
            </>
          )}
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
              className="absolute right-0 mt-1 py-1 rounded-lg shadow-lg z-20 min-w-[140px]"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <button
                onClick={() => {
                  onDownloadMidi();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="w-8 text-[10px] font-mono opacity-60">MIDI</span>
                <span>Standard MIDI file</span>
              </button>
              <button
                onClick={() => {
                  onDownloadWav();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="w-8 text-[10px] font-mono opacity-60">WAV</span>
                <span>Audio with effects</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DrumPlayerControls;
