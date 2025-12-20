import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Download, ChevronDown, Loader2 } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDownloadMidi: () => void;
  onDownloadWav: () => void;
  isExporting: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onStop,
  onDownloadMidi,
  onDownloadWav,
  isExporting,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadMidi = () => {
    onDownloadMidi();
    setShowDropdown(false);
  };

  const handleDownloadWav = () => {
    onDownloadWav();
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center gap-2">
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
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <Square className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Download dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
          className="btn btn-icon w-10 h-10 rounded-lg transition-all group flex items-center justify-center"
          style={{
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            opacity: isExporting ? 0.7 : 1,
          }}
          aria-label="Download options"
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

        {showDropdown && !isExporting && (
          <div
            className="absolute right-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[140px]"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={handleDownloadMidi}
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
              onClick={handleDownloadWav}
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
        )}
      </div>
    </div>
  );
};

export default PlayerControls;

