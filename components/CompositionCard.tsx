import React from 'react';
import PianoRoll from './PianoRoll';
import PlayerControls from './PlayerControls';
import AddPartButtons from './AddPartButtons';
import { Composition, PartType } from '../types';
import { Music } from 'lucide-react';

interface CompositionCardProps {
  composition: Composition;
  isPlaying: boolean;
  addingPart: PartType | null;
  onPlay: () => void;
  onStop: () => void;
  onDownload: () => void;
  onAddPart: (partType: PartType) => void;
}

const CompositionCard: React.FC<CompositionCardProps> = ({
  composition,
  isPlaying,
  addingPart,
  onPlay,
  onStop,
  onDownload,
  onAddPart,
}) => {
  return (
    <div
      className="animate-slide-up rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        boxShadow: isPlaying
          ? 'var(--shadow-lg), 0 0 30px rgba(61, 139, 255, 0.1)'
          : 'var(--shadow-md)'
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)'
            }}
          >
            <Music className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {composition.title}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="badge">{composition.bpm} BPM</span>
              <span className="badge">{composition.notes.length} notes</span>
            </div>
          </div>
        </div>

        <PlayerControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onStop={onStop}
          onDownload={onDownload}
        />
      </div>

      {/* Piano Roll */}
      <PianoRoll
        notes={composition.notes}
        isPlaying={isPlaying}
        bpm={composition.bpm}
      />

      {/* Add Parts */}
      <AddPartButtons
        addingPart={addingPart}
        onAddPart={onAddPart}
      />
    </div>
  );
};

export default CompositionCard;

