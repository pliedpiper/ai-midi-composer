import React, { useMemo } from 'react';
import PianoRoll from './PianoRoll';
import PlayerControls from './PlayerControls';
import AddPartButtons from './AddPartButtons';
import { StyleTransferPanel } from './StyleTransferPanel';
import { ContinuationPanel } from './ContinuationPanel';
import { Composition, PartType, BarCount } from '../types';
import { Music, Shuffle, Loader2 } from 'lucide-react';

interface CompositionCardProps {
  composition: Composition;
  isPlaying: boolean;
  addingPart: PartType | null;
  regeneratingPart: PartType | null;
  applyingStyle: boolean;
  extending: boolean;
  generatingVariations: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDownload: () => void;
  onAddPart: (partType: PartType) => void;
  onRegeneratePart: (partType: PartType) => void;
  onApplyStyle: (prompt: string) => void;
  onExtend: (bars: BarCount) => void;
  onGenerateVariations: () => void;
}

const CompositionCard: React.FC<CompositionCardProps> = ({
  composition,
  isPlaying,
  addingPart,
  regeneratingPart,
  applyingStyle,
  extending,
  generatingVariations,
  onPlay,
  onStop,
  onDownload,
  onAddPart,
  onRegeneratePart,
  onApplyStyle,
  onExtend,
  onGenerateVariations,
}) => {
  // Determine which parts exist in composition
  const existingParts = useMemo(() => {
    const parts = new Set<PartType>();
    composition.notes.forEach(n => {
      if (n.partType) parts.add(n.partType);
    });
    return Array.from(parts);
  }, [composition.notes]);

  const isAnyOperationInProgress = addingPart !== null || regeneratingPart !== null ||
    applyingStyle || extending || generatingVariations;

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

        <div className="flex items-center gap-2">
          {/* Variations button */}
          <button
            onClick={onGenerateVariations}
            disabled={isAnyOperationInProgress}
            className="p-2 rounded-lg transition-all"
            style={{
              background: generatingVariations ? 'var(--accent-glow)' : 'var(--bg-primary)',
              color: generatingVariations ? 'var(--accent)' : 'var(--text-muted)',
              border: generatingVariations ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: isAnyOperationInProgress ? 'not-allowed' : 'pointer',
              opacity: isAnyOperationInProgress && !generatingVariations ? 0.5 : 1,
            }}
            title="Generate variations"
          >
            {generatingVariations ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shuffle className="w-4 h-4" />
            )}
          </button>

          <PlayerControls
            isPlaying={isPlaying}
            onPlay={onPlay}
            onStop={onStop}
            onDownload={onDownload}
          />
        </div>
      </div>

      {/* Piano Roll */}
      <PianoRoll
        notes={composition.notes}
        isPlaying={isPlaying}
        bpm={composition.bpm}
      />

      {/* Add/Regenerate Parts */}
      <AddPartButtons
        addingPart={addingPart}
        regeneratingPart={regeneratingPart}
        onAddPart={onAddPart}
        onRegeneratePart={onRegeneratePart}
        existingParts={existingParts}
      />

      {/* Continuation Panel */}
      <ContinuationPanel
        onExtend={onExtend}
        isLoading={extending}
        disabled={isAnyOperationInProgress}
      />

      {/* Style Transfer Panel */}
      <StyleTransferPanel
        onApplyStyle={onApplyStyle}
        isLoading={applyingStyle}
        disabled={isAnyOperationInProgress}
      />
    </div>
  );
};

export default CompositionCard;
