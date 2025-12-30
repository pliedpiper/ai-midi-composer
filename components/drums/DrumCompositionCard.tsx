import React from 'react';
import { Drum, RefreshCw, Loader2, Shuffle } from 'lucide-react';
import { DrumPattern, DrumPiece } from '../../types/drums';
import { FilterState } from '../../types';
import DrumLaneView from './DrumLaneView';
import DrumPlayerControls from './DrumPlayerControls';
import { FilterPanel } from '../FilterPanel';
import { GENERATION } from '../../constants';

interface DrumCompositionCardProps {
  pattern: DrumPattern;
  isPlaying: boolean;
  regenerating: boolean;
  generatingVariations: boolean;
  isExporting: boolean;
  filterStates: FilterState[];
  onPlay: () => void;
  onStop: () => void;
  onDownloadMidi: () => void;
  onDownloadWav: () => void;
  onRegenerate: () => void;
  onGenerateVariations: () => void;
  onToggleFilter: (filterId: string) => void;
  onUpdateFilterParam: (filterId: string, paramKey: string, value: number) => void;
  onResetFilters: () => void;
  onAddHit: (drum: DrumPiece, time: number, velocity: number) => void;
  onRemoveHit: (hitId: string) => void;
  onUpdateHitVelocity?: (hitId: string, velocity: number) => void;
}

const DrumCompositionCard: React.FC<DrumCompositionCardProps> = ({
  pattern,
  isPlaying,
  regenerating,
  generatingVariations,
  isExporting,
  filterStates,
  onPlay,
  onStop,
  onDownloadMidi,
  onDownloadWav,
  onRegenerate,
  onGenerateVariations,
  onToggleFilter,
  onUpdateFilterParam,
  onResetFilters,
  onAddHit,
  onRemoveHit,
  onUpdateHitVelocity,
}) => {
  // Calculate bar count from pattern - scales to match actual generated content
  // A hit at time 0-3.99 is in bar 1, time 4-7.99 is in bar 2, etc.
  const maxTime = pattern.hits.reduce((max, h) => Math.max(max, h.time), 0);
  const barCount = Math.floor(maxTime / GENERATION.BEATS_PER_BAR) + 1;

  const isAnyOperationInProgress = regenerating || generatingVariations;

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
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)'
            }}
          >
            <Drum className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {pattern.title}
            </h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="badge">{pattern.bpm} BPM</span>
              <span className="badge">{pattern.hits.length} hits</span>
              <span className="badge">{barCount} bars</span>
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

          {/* Regenerate button */}
          <button
            onClick={onRegenerate}
            disabled={isAnyOperationInProgress}
            className="p-2 rounded-lg transition-all"
            style={{
              background: regenerating ? 'var(--accent-glow)' : 'var(--bg-primary)',
              color: regenerating ? 'var(--accent)' : 'var(--text-muted)',
              border: regenerating ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: isAnyOperationInProgress ? 'not-allowed' : 'pointer',
              opacity: isAnyOperationInProgress && !regenerating ? 0.5 : 1,
            }}
            title="Regenerate"
          >
            {regenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>

          {/* Player controls */}
          <DrumPlayerControls
            isPlaying={isPlaying}
            isExporting={isExporting}
            onPlay={onPlay}
            onStop={onStop}
            onDownloadMidi={onDownloadMidi}
            onDownloadWav={onDownloadWav}
          />
        </div>
      </div>

      {/* Drum Lane View */}
      <div className="p-4">
        <DrumLaneView
          hits={pattern.hits}
          bpm={pattern.bpm}
          isPlaying={isPlaying}
          barCount={barCount}
          onAddHit={onAddHit}
          onRemoveHit={onRemoveHit}
          onUpdateVelocity={onUpdateHitVelocity}
        />
      </div>

      {/* Audio Effects Panel */}
      <FilterPanel
        filterStates={filterStates}
        onToggleFilter={onToggleFilter}
        onUpdateParam={onUpdateFilterParam}
        onResetFilters={onResetFilters}
        disabled={isAnyOperationInProgress}
      />
    </div>
  );
};

export default DrumCompositionCard;
