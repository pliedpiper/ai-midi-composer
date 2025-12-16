import React from 'react';
import { Play, Square, Download } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDownload: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlay,
  onStop,
  onDownload,
}) => {
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
      <button
        onClick={onDownload}
        className="btn btn-icon w-10 h-10 rounded-lg transition-all group"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)'
        }}
        aria-label="Download MIDI"
      >
        <Download className="w-4 h-4 transition-colors group-hover:text-white" />
      </button>
    </div>
  );
};

export default PlayerControls;

