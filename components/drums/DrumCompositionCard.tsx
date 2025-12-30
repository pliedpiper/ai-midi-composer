import React, { useState } from 'react';
import { Drum, RefreshCw, Loader2, Layers } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);

  // Calculate bar count from pattern - scales to match actual generated content
  // A hit at time 0-3.99 is in bar 1, time 4-7.99 is in bar 2, etc.
  const maxTime = pattern.hits.reduce((max, h) => Math.max(max, h.time), 0);
  const barCount = Math.floor(maxTime / GENERATION.BEATS_PER_BAR) + 1;

  const enabledFiltersCount = filterStates.filter(f => f.enabled).length;

  return (
    <div
      className="rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: 'var(--bg-tertiary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            }}
          >
            <Drum size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {pattern.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                {pattern.bpm} BPM
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                {pattern.hits.length} hits
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                {barCount} bars
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Variations button */}
          <button
            onClick={onGenerateVariations}
            disabled={generatingVariations || regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
            style={{
              background: generatingVariations ? 'var(--accent)' : 'var(--bg-primary)',
              color: generatingVariations ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              opacity: regenerating ? 0.5 : 1,
              cursor: generatingVariations || regenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {generatingVariations ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Layers size={14} />
            )}
            <span>Variations</span>
          </button>

          {/* Regenerate button */}
          <button
            onClick={onRegenerate}
            disabled={regenerating || generatingVariations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
            style={{
              background: regenerating ? 'var(--accent)' : 'var(--bg-primary)',
              color: regenerating ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              opacity: generatingVariations ? 0.5 : 1,
              cursor: regenerating || generatingVariations ? 'not-allowed' : 'pointer',
            }}
          >
            {regenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            <span>Regenerate</span>
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

      {/* Filter Panel Toggle */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 font-mono text-xs transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>Audio Effects</span>
          {enabledFiltersCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {enabledFiltersCount}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showFilters && (
          <div className="mt-3">
            <FilterPanel
              filterStates={filterStates}
              onToggleFilter={onToggleFilter}
              onUpdateParam={onUpdateFilterParam}
              onReset={onResetFilters}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DrumCompositionCard;
