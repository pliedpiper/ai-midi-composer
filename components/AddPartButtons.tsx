import React from 'react';
import { Loader2, Music2, Piano, AudioWaveform, RefreshCw } from 'lucide-react';
import { PartType } from '../types';

const PART_TYPES: { type: PartType; label: string; icon: typeof Music2 }[] = [
  { type: 'melody', label: 'Melody', icon: Music2 },
  { type: 'chords', label: 'Chords', icon: Piano },
  { type: 'bass', label: 'Bass', icon: AudioWaveform },
];

interface AddPartButtonsProps {
  addingPart: PartType | null;
  regeneratingPart: PartType | null;
  onAddPart: (partType: PartType) => void;
  onRegeneratePart: (partType: PartType) => void;
  existingParts: PartType[];
}

const AddPartButtons: React.FC<AddPartButtonsProps> = ({
  addingPart,
  regeneratingPart,
  onAddPart,
  onRegeneratePart,
  existingParts,
}) => {
  const isAnyLoading = addingPart !== null || regeneratingPart !== null;

  return (
    <div
      className="flex items-center gap-3 px-5 py-4"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Parts:
      </span>
      <div className="flex items-center gap-2">
        {PART_TYPES.map(({ type, label, icon: Icon }) => {
          const exists = existingParts.includes(type);
          const isAddingThis = addingPart === type;
          const isRegeneratingThis = regeneratingPart === type;
          const isLoading = isAddingThis || isRegeneratingThis;
          const isDisabled = isAnyLoading && !isLoading;

          const handleClick = () => {
            if (exists) {
              onRegeneratePart(type);
            } else {
              onAddPart(type);
            }
          };

          return (
            <div key={type} className="relative group">
              <button
                onClick={handleClick}
                disabled={isAnyLoading}
                className="btn flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: isLoading
                    ? 'var(--accent-glow)'
                    : exists
                    ? 'rgba(61, 139, 255, 0.1)'
                    : 'var(--bg-primary)',
                  color: isLoading
                    ? 'var(--accent)'
                    : exists
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                  border: isLoading
                    ? '1px solid var(--accent)'
                    : exists
                    ? '1px solid rgba(61, 139, 255, 0.3)'
                    : '1px solid var(--border)',
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? '0 0 15px rgba(61, 139, 255, 0.15)' : 'none'
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {label}
                {exists && !isLoading && (
                  <RefreshCw className="w-3 h-3 opacity-50" />
                )}
              </button>

              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                {exists ? `Regenerate ${label}` : `Add ${label}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddPartButtons;
