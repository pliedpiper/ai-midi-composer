import React from 'react';
import { Loader2, Plus, Music2, Piano, AudioWaveform } from 'lucide-react';
import { PartType } from '../types';

const PART_TYPES: { type: PartType; label: string; icon: typeof Music2 }[] = [
  { type: 'melody', label: 'Melody', icon: Music2 },
  { type: 'chords', label: 'Chords', icon: Piano },
  { type: 'bass', label: 'Bass', icon: AudioWaveform },
];

interface AddPartButtonsProps {
  addingPart: PartType | null;
  onAddPart: (partType: PartType) => void;
}

const AddPartButtons: React.FC<AddPartButtonsProps> = ({ addingPart, onAddPart }) => {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        Add part:
      </span>
      <div className="flex items-center gap-2">
        {PART_TYPES.map(({ type, label, icon: Icon }) => {
          const isActive = addingPart === type;
          const isDisabled = addingPart !== null && !isActive;

          return (
            <button
              key={type}
              onClick={() => onAddPart(type)}
              disabled={addingPart !== null}
              className="btn flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all"
              style={{
                background: isActive
                  ? 'var(--accent-glow)'
                  : 'var(--bg-primary)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                border: isActive
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
                opacity: isDisabled ? 0.4 : 1,
                cursor: addingPart !== null ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? '0 0 15px rgba(61, 139, 255, 0.15)' : 'none'
              }}
            >
              {isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AddPartButtons;

