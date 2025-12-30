import React, { useState } from 'react';
import { X, Play, Square, Check } from 'lucide-react';
import { DrumPatternVariation } from '../../types/drums';
import DrumLaneView from './DrumLaneView';
import { GENERATION } from '../../constants';

interface DrumVariationPickerProps {
  variations: DrumPatternVariation[];
  onSelect: (id: string) => void;
  onCancel: () => void;
  currentlyPlaying: string | null;
  onPlayVariation: (id: string) => void;
  onStopPlayback: () => void;
}

const DrumVariationPicker: React.FC<DrumVariationPickerProps> = ({
  variations,
  onSelect,
  onCancel,
  currentlyPlaying,
  onPlayVariation,
  onStopPlayback,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const handlePlayClick = (variationId: string) => {
    if (currentlyPlaying === variationId) {
      onStopPlayback();
    } else {
      onPlayVariation(variationId);
    }
  };

  // Calculate bar count from first variation - scales to match actual content
  const firstVariation = variations[0];
  const maxTime = firstVariation?.pattern.hits.reduce((max, h) => Math.max(max, h.time), 0) ?? 0;
  const barCount = Math.floor(maxTime / GENERATION.BEATS_PER_BAR) + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-5xl rounded-xl overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Choose a Variation
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variations grid */}
        <div className="p-6">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${variations.length}, 1fr)` }}
          >
            {variations.map((variation) => {
              const isSelected = selectedId === variation.id;
              const isCurrentlyPlaying = currentlyPlaying === variation.id;

              return (
                <div
                  key={variation.id}
                  className="rounded-lg overflow-hidden cursor-pointer transition-all"
                  style={{
                    background: 'var(--bg-primary)',
                    border: isSelected
                      ? '2px solid var(--accent)'
                      : '2px solid var(--border)',
                    boxShadow: isSelected
                      ? '0 0 20px rgba(61, 139, 255, 0.2)'
                      : 'none',
                  }}
                  onClick={() => setSelectedId(variation.id)}
                >
                  {/* Variation header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded"
                        style={{
                          background: isSelected ? 'var(--accent)' : 'var(--bg-primary)',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {variation.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {variation.pattern.hits.length} hits
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    )}
                  </div>

                  {/* Mini drum lane view */}
                  <div className="overflow-hidden">
                    <DrumLaneView
                      hits={variation.pattern.hits}
                      bpm={variation.pattern.bpm}
                      isPlaying={isCurrentlyPlaying}
                      barCount={barCount}
                      compact
                    />
                  </div>

                  {/* Play button */}
                  <div
                    className="px-4 py-3 flex gap-2"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayClick(variation.id);
                      }}
                      className="flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                      style={{
                        background: isCurrentlyPlaying
                          ? 'var(--accent)'
                          : 'var(--bg-tertiary)',
                        color: isCurrentlyPlaying ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      {isCurrentlyPlaying ? (
                        <>
                          <Square className="w-3 h-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="px-6 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: selectedId
                ? 'var(--accent)'
                : 'var(--bg-tertiary)',
              color: selectedId ? 'white' : 'var(--text-muted)',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              opacity: selectedId ? 1 : 0.5,
            }}
          >
            Use Selected
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrumVariationPicker;
