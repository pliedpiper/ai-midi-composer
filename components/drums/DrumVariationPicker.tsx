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
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl animate-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Choose a Variation
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Click to select, then confirm your choice
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Variations grid */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
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
                  onClick={() => setSelectedId(variation.id)}
                  className="rounded-lg overflow-hidden cursor-pointer transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: isSelected
                      ? '2px solid var(--accent)'
                      : '2px solid var(--border)',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  }}
                >
                  {/* Variation header */}
                  <div
                    className="px-3 py-2 flex items-center justify-between"
                    style={{
                      background: isSelected ? 'rgba(61, 139, 255, 0.1)' : 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold"
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

                    {/* Play/Stop button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentlyPlaying) {
                          onStopPlayback();
                        } else {
                          onPlayVariation(variation.id);
                        }
                      }}
                      className="p-1.5 rounded-md transition-all"
                      style={{
                        background: isCurrentlyPlaying ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-primary)',
                        color: isCurrentlyPlaying ? '#ef4444' : 'var(--text-secondary)',
                      }}
                    >
                      {isCurrentlyPlaying ? <Square size={12} /> : <Play size={12} />}
                    </button>
                  </div>

                  {/* Mini drum lane view */}
                  <div className="p-2">
                    <DrumLaneView
                      hits={variation.pattern.hits}
                      bpm={variation.pattern.bpm}
                      isPlaying={isCurrentlyPlaying}
                      barCount={barCount}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3"
          style={{
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-mono text-xs transition-all"
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-medium transition-all"
            style={{
              background: selectedId ? 'var(--accent)' : 'var(--bg-secondary)',
              color: selectedId ? 'white' : 'var(--text-muted)',
              cursor: selectedId ? 'pointer' : 'not-allowed',
            }}
          >
            <Check size={14} />
            <span>Use Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrumVariationPicker;
