import React from 'react';
import PianoRoll from './PianoRoll';
import PlayerControls from './PlayerControls';
import AddPartButtons from './AddPartButtons';
import { Composition, PartType } from '../types';

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
    <div className="animate-slide-up">
      {/* Title bar */}
      <div 
        className="flex items-center justify-between px-4 py-3 rounded-t"
        style={{ 
          background: 'var(--bg-secondary)', 
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {composition.title}
          </span>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {composition.bpm} bpm · {composition.notes.length} notes
          </span>
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

