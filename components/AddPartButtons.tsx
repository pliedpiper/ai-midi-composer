import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import { PartType } from '../types';

const PART_TYPES: { type: PartType; label: string }[] = [
  { type: 'melody', label: 'Melody' },
  { type: 'chords', label: 'Chords' },
  { type: 'bass', label: 'Bass' },
];

interface AddPartButtonsProps {
  addingPart: PartType | null;
  onAddPart: (partType: PartType) => void;
}

const AddPartButtons: React.FC<AddPartButtonsProps> = ({ addingPart, onAddPart }) => {
  return (
    <div 
      className="flex items-center gap-2 px-4 py-3 rounded-b"
      style={{ 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border)',
        borderLeft: '1px solid var(--border)',
        borderRight: '1px solid var(--border)'
      }}
    >
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Add:</span>
      {PART_TYPES.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onAddPart(type)}
          disabled={addingPart !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors"
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: addingPart === type ? 'var(--accent)' : 'var(--text-secondary)',
            opacity: addingPart !== null && addingPart !== type ? 0.5 : 1,
            cursor: addingPart !== null ? 'not-allowed' : 'pointer'
          }}
        >
          {addingPart === type ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          {label}
        </button>
      ))}
    </div>
  );
};

export default AddPartButtons;

