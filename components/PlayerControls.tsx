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
        className="p-2 rounded transition-colors"
        style={{ 
          background: isPlaying ? 'var(--bg-tertiary)' : 'var(--accent)',
          color: 'white'
        }}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        onClick={onDownload}
        className="p-2 rounded transition-colors"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        aria-label="Download MIDI"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PlayerControls;

